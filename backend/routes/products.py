"""
Refactored Products API - Backend-Driven Architecture
All filtering, sorting, and pagination handled server-side
"""
from fastapi import APIRouter, HTTPException, Depends, status, Query, Body
from typing import Optional, List, Dict, Any
from datetime import datetime
from google.cloud.firestore_v1.base_query import FieldFilter
from google.cloud.firestore import Increment, ArrayUnion, DELETE_FIELD
from database import get_db
from models import Product, ProductCreate, ProductUpdate
from auth import get_current_user, get_optional_user
from services.cloudinary_service import extract_public_id, delete_product_image
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/products")


def enrich_products_with_sellers_batch(db, products: list) -> list:
    """
    Enrich multiple products with seller info using batch queries.
    OPTIMIZED: Fetches all sellers in 2 queries instead of N*2 queries.
    """
    if not products:
        return products
    
    # Collect unique seller IDs
    seller_ids = list(set(p.get('seller_id') for p in products if p.get('seller_id')))
    
    if not seller_ids:
        for product in products:
            product['seller'] = None
        return products
    
    # Batch fetch all users (1 query)
    users_map = {}
    try:
        for seller_id in seller_ids:
            user_doc = db.collection('users').document(seller_id).get()
            if user_doc.exists:
                users_map[seller_id] = user_doc.to_dict()
    except Exception as e:
        logger.error(f"Error batch fetching users: {e}")
    
    # Batch fetch all profiles (1 query per batch of 10 due to Firestore 'in' limit)
    profiles_map = {}
    try:
        # Firestore 'in' operator supports max 10 values
        for i in range(0, len(seller_ids), 10):
            batch_ids = seller_ids[i:i+10]
            profile_query = db.collection('user_profiles').where('user_id', 'in', batch_ids)
            for doc in profile_query.stream():
                profile_data = doc.to_dict()
                user_id = profile_data.get('user_id')
                if user_id:
                    profiles_map[user_id] = profile_data
    except Exception as e:
        logger.error(f"Error batch fetching profiles: {e}")
    
    # Enrich products with seller data from maps
    for product in products:
        seller_id = product.get('seller_id')
        if not seller_id:
            product['seller'] = None
            continue
        
        user_data = users_map.get(seller_id)
        if not user_data:
            product['seller'] = None
            continue
        
        profile_data = profiles_map.get(seller_id, {})
        avatar = profile_data.get('avatar')
        
        product['seller'] = {
            'id': seller_id,
            'name': user_data.get('name'),
            'avatar': avatar
        }
    
    return products


def enrich_product_with_seller(db, product_data: dict) -> dict:
    """
    Enrich product with seller summary to avoid N+1 queries
    """
    seller_id = product_data.get('seller_id')
    if not seller_id:
        product_data['seller'] = None
        return product_data
    
    try:
        # Fetch seller user data
        user_doc = db.collection('users').document(seller_id).get()
        if not user_doc.exists:
            product_data['seller'] = None
            return product_data
        
        user_data = user_doc.to_dict()
        
        # Fetch seller profile for avatar
        profile_query = db.collection('user_profiles').where('user_id', '==', seller_id).limit(1)
        profile_docs = list(profile_query.stream())
        
        avatar = None
        if profile_docs:
            profile_data = profile_docs[0].to_dict()
            avatar = profile_data.get('avatar')
        
        # Build seller summary
        product_data['seller'] = {
            'id': seller_id,
            'name': user_data.get('name'),
            'avatar': avatar
        }
        
    except Exception as e:
        logger.error(f"Error enriching product {product_data.get('id')} with seller: {e}")
        product_data['seller'] = None
    
    return product_data


@router.get("", response_model=Dict[str, Any])
async def get_products(
    q: Optional[str] = Query(None, description="Search query"),
    category: Optional[str] = Query(None, description="Filter by category"),
    subcategory: Optional[str] = Query(None, description="Filter by subcategory"),
    condition: Optional[str] = Query(None, description="Filter by condition"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    sort: Optional[str] = Query("newest", description="Sort order: newest, oldest, price-low, price-high, most-viewed"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page")
):
    """
    Get all products (active and sold) with server-side filtering, sorting, and pagination.
    
    Returns:
        {
            items: Product[] (with seller info embedded),
            total: int,
            page: int,
            page_size: int,
            pages: int
        }
    """
    try:
        db = get_db()
        products_ref = db.collection('products')
        
        # Fetch all products (both active and sold)
        query = products_ref
        
        # Apply Firestore filters (limited to avoid composite index requirements)
        if category:
            query = query.where(filter=FieldFilter('category', '==', category))
        
        # Fetch all matching documents
        products = []
        for doc in query.stream():
            product_data = doc.to_dict()
            product_data['id'] = doc.id
            products.append(product_data)
        
        # Apply Python-side filters
        filtered_products = []
        for product in products:
            # Search filter
            if q:
                search_query = q.lower()
                searchable_text = f"{product.get('title', '')} {product.get('description', '')} {product.get('location', '')}".lower()
                if search_query not in searchable_text:
                    continue
            
            # Subcategory filter
            if subcategory and product.get('subcategory') != subcategory:
                continue
            
            # Condition filter
            if condition and product.get('condition') != condition:
                continue
            
            # Price filters
            if min_price is not None and product.get('price', 0) < min_price:
                continue
            if max_price is not None and product.get('price', float('inf')) > max_price:
                continue
            
            filtered_products.append(product)
        
        # Sort products
        if sort == 'newest':
            filtered_products.sort(key=lambda x: x.get('posted_date', datetime.min), reverse=True)
        elif sort == 'oldest':
            filtered_products.sort(key=lambda x: x.get('posted_date', datetime.min))
        elif sort == 'price-low':
            filtered_products.sort(key=lambda x: x.get('price', 0))
        elif sort == 'price-high':
            filtered_products.sort(key=lambda x: x.get('price', 0), reverse=True)
        elif sort == 'most-viewed':
            filtered_products.sort(key=lambda x: x.get('views', 0), reverse=True)
        
        # Apply pagination
        total = len(filtered_products)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_products = filtered_products[start_idx:end_idx]
        
        # Enrich with seller info using BATCH query (OPTIMIZED - was N+1 problem)
        enriched_products = enrich_products_with_sellers_batch(db, paginated_products)
        
        return {
            "items": enriched_products,
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": (total + page_size - 1) // page_size if total > 0 else 0
        }
        
    except Exception as e:
        logger.error(f"Error fetching products: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to fetch products", "detail": str(e)}
        )


@router.post("/batch", response_model=List[Product])
async def get_products_batch(
    product_ids: List[str] = Body(..., embed=True, max_length=50),
    user_id: Optional[str] = Depends(get_optional_user)
):
    """
    Batch fetch products by IDs (for recently viewed, etc.)
    Maximum 50 IDs per request
    """
    if not product_ids:
        return []
    
    try:
        db = get_db()
        products = []
        
        # Fetch all products in batch
        for product_id in product_ids[:50]:  # Limit to 50
            doc_ref = db.collection('products').document(product_id)
            doc = doc_ref.get()
            
            if doc.exists:
                product_data = doc.to_dict()
                # Only return active products
                if product_data.get('is_active', True):
                    product_data['id'] = doc.id
                    # Enrich with seller info
                    product_data = enrich_product_with_seller(db, product_data)
                    products.append(product_data)
        
        return products
        
    except Exception as e:
        logger.error(f"Error batch fetching products: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to batch fetch products", "detail": str(e)}
        )


@router.post("", response_model=Product, status_code=status.HTTP_201_CREATED)
async def create_product(product: ProductCreate, user_id: str = Depends(get_current_user)):
    """Create a new product listing"""
    try:
        db = get_db()
        product_data = product.model_dump()
        product_data['views'] = 0
        product_data['viewed_by'] = []
        product_data['posted_date'] = datetime.now()
        product_data['updated_at'] = datetime.now()
        product_data['is_active'] = True
        product_data['seller_id'] = user_id
        product_data['mark_as_sold'] = False
        product_data['sold_to'] = None
        
        doc_ref = db.collection('products').document()
        doc_ref.set(product_data)
        
        product_data['id'] = doc_ref.id
        # Enrich with seller info
        product_data = enrich_product_with_seller(db, product_data)
        
        return product_data
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Validation Error", "detail": str(e)}
        )
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Internal Server Error", "detail": "Failed to create product"}
        )


@router.get("/seller/me", response_model=List[Product])
async def get_seller_products(user_id: str = Depends(get_current_user)):
    """Get all products for the authenticated seller (including inactive/sold)"""
    db = get_db()
    products_ref = db.collection('products')
    
    query = products_ref.where('seller_id', '==', user_id)
    
    products = []
    try:
        for doc in query.stream():
            product_data = doc.to_dict()
            product_data['id'] = doc.id
            # Enrich with seller info
            product_data = enrich_product_with_seller(db, product_data)
            products.append(product_data)
        
        # Sort by posted_date descending
        products.sort(key=lambda x: x.get('posted_date', datetime.min), reverse=True)
        
        logger.info(f"Fetched {len(products)} products for seller {user_id}")
    except Exception as e:
        logger.error(f"Error fetching seller products: {str(e)}", exc_info=True)
    
    return products


@router.get("/{product_id}", response_model=Product)
async def get_product(product_id: str, user_id: Optional[str] = Depends(get_optional_user)):
    """Get a specific product by ID and track unique views per user"""
    db = get_db()
    doc_ref = db.collection('products').document(product_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Not Found", "detail": "Product not found"}
        )
    
    product_data = doc.to_dict()
    
    # Track unique views per user
    if user_id:
        viewed_by = product_data.get('viewed_by', [])
        
        if user_id not in viewed_by:
            doc_ref.update({
                'viewed_by': ArrayUnion([user_id]),
                'views': Increment(1)
            })
            
            updated_doc = doc_ref.get()
            product_data = updated_doc.to_dict()
            
            logger.info(f"New view tracked for product {product_id} by user {user_id}")
    
    product_data['id'] = doc.id
    # Enrich with seller info
    product_data = enrich_product_with_seller(db, product_data)
    
    return product_data


@router.put("/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductCreate, user_id: str = Depends(get_current_user)):
    """Update a product listing"""
    db = get_db()
    doc_ref = db.collection('products').document(product_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Not Found", "detail": "Product not found"}
        )
    
    # Verify ownership
    existing_product = doc.to_dict()
    if existing_product.get('seller_id') != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "Forbidden", "detail": "Unauthorized to modify this product"}
        )
    
    product_data = product.model_dump()
    product_data['updated_at'] = datetime.now()
    doc_ref.update(product_data)
    
    product_data['id'] = product_id
    product_data['views'] = doc.to_dict().get('views', 0)
    product_data['posted_date'] = doc.to_dict().get('posted_date')
    product_data['is_active'] = doc.to_dict().get('is_active', True)
    product_data['seller_id'] = user_id
    
    return product_data


@router.patch("/{product_id}", response_model=Product)
async def partial_update_product(product_id: str, product: ProductUpdate, user_id: str = Depends(get_current_user)):
    """Partially update a product listing (PATCH)"""
    db = get_db()
    doc_ref = db.collection('products').document(product_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Not Found", "detail": "Product not found"}
        )
    
    existing_product = doc.to_dict()
    if existing_product.get('seller_id') != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "Forbidden", "detail": "Unauthorized to modify this product"}
        )
    
    update_data = product.model_dump(exclude_unset=True)
    
    if update_data:
        update_data['updated_at'] = datetime.now()
        doc_ref.update(update_data)
        
        updated_doc = doc_ref.get()
        product_data = updated_doc.to_dict()
        product_data['id'] = product_id
        product_data = enrich_product_with_seller(db, product_data)
        
        return product_data
    else:
        existing_product['id'] = product_id
        existing_product = enrich_product_with_seller(db, existing_product)
        return existing_product


@router.get("/{product_id}/interested-buyers")
async def get_interested_buyers(product_id: str, user_id: str = Depends(get_current_user)):
    """Get all users who have messaged about this product"""
    db = get_db()
    
    doc_ref = db.collection('products').document(product_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Not Found", "detail": "Product not found"}
        )
    
    product_data = doc.to_dict()
    if product_data.get('seller_id') != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "Forbidden", "detail": "Unauthorized to view interested buyers"}
        )
    
    try:
        chat_rooms = db.collection('chat_rooms').where('product_id', '==', product_id).stream()
        
        interested_buyers = []
        seen_user_ids = set()
        
        for chat_room in chat_rooms:
            chat_data = chat_room.to_dict()
            buyer_id = chat_data.get('user1_id') if chat_data.get('user2_id') == user_id else chat_data.get('user2_id')
            
            if buyer_id and buyer_id != user_id and buyer_id not in seen_user_ids:
                seen_user_ids.add(buyer_id)
                
                user_doc = db.collection('users').document(buyer_id).get()
                if user_doc.exists:
                    user_data = user_doc.to_dict()
                    
                    # Get avatar from profile
                    profile_query = db.collection('user_profiles').where('user_id', '==', buyer_id).limit(1)
                    profile_docs = list(profile_query.stream())
                    avatar = None
                    if profile_docs:
                        avatar = profile_docs[0].to_dict().get('avatar')
                    
                    interested_buyers.append({
                        'id': buyer_id,
                        'name': user_data.get('name'),
                        'email': user_data.get('email'),
                        'avatar': avatar,
                        'last_message': chat_data.get('last_message'),
                        'last_message_time': chat_data.get('last_message_time')
                    })
        
        return interested_buyers
    except Exception as e:
        logger.error(f"Error fetching interested buyers: {str(e)}", exc_info=True)
        return []


@router.patch("/{product_id}/mark-sold")
async def mark_product_as_sold(
    product_id: str,
    request_body: dict = Body({}),
    user_id: str = Depends(get_current_user)
):
    """Mark a product as sold and create a transaction history record"""
    buyer_id = request_body.get('buyer_id')
    
    logger.info(f"[mark-sold] Request received: product_id={product_id}, buyer_id={buyer_id}, user_id={user_id}")
    
    db = get_db()
    doc_ref = db.collection('products').document(product_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        logger.warning(f"Product {product_id} not found when marking as sold")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Not Found", "detail": "Product not found"}
        )
    
    # Verify ownership
    existing_product = doc.to_dict()
    if existing_product.get('seller_id') != user_id:
        logger.warning(f"User {user_id} unauthorized to mark product {product_id} as sold")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "Forbidden", "detail": "Unauthorized to modify this product"}
        )
    
    # Mark as sold (soft delete)
    update_data = {
        'is_active': False,
        'sold_at': datetime.now(),
        'updated_at': datetime.now()
    }
    
    # Only set sold_to if buyer_id is provided
    if buyer_id:
        update_data['sold_to'] = buyer_id
    
    doc_ref.update(update_data)
    
    logger.info(f"[mark-sold] Product {product_id} marked as sold" + (f" to buyer {buyer_id}" if buyer_id else " (no buyer specified)"))
    
    # Create product transaction history record
    transaction_history_data = {
        'amount': existing_product.get('price', 0),
        'product_id': product_id,
        'seller_id': user_id,
        'status': 'completed',
        'transaction_type_sold': True,
        'created_at': datetime.now()
    }
    db.collection('transaction_history').add(transaction_history_data)
    logger.info(f"Created transaction history record for product {product_id} marked as sold")
    
    # Create transaction records if buyer is specified
    if buyer_id:
        transaction_data = {
            'product_id': product_id,
            'seller_id': user_id,
            'buyer_id': buyer_id,
            'amount': existing_product.get('price', 0),
            'status': 'completed',
            'created_at': datetime.now(),
            'completed_at': datetime.now()
        }
        
        # Create seller transaction (sell)
        seller_transaction = {
            **transaction_data,
            'user_id': user_id,
            'transaction_type': 'sell',
            'other_party_id': buyer_id
        }
        db.collection('transaction_history').add(seller_transaction)
        
        # Create buyer transaction (buy)
        buyer_transaction = {
            **transaction_data,
            'user_id': buyer_id,
            'transaction_type': 'buy',
            'other_party_id': user_id
        }
        db.collection('transaction_history').add(buyer_transaction)
        logger.info(f"Created transaction records for product {product_id} sale to buyer {buyer_id}")
    
    logger.info(f"[mark-sold] Returning success response")
    return {"message": "Product marked as sold successfully", "buyer_id": buyer_id}


@router.patch("/{product_id}/mark-active")
async def mark_product_as_active(product_id: str, user_id: str = Depends(get_current_user)):
    """Mark a product as active again and create a transaction history record"""
    logger.info(f"[mark-active] Request received: product_id={product_id}, user_id={user_id}")
    
    db = get_db()
    doc_ref = db.collection('products').document(product_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        logger.warning(f"Product {product_id} not found when marking as active")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Not Found", "detail": "Product not found"}
        )
    
    # Verify ownership
    existing_product = doc.to_dict()
    if existing_product.get('seller_id') != user_id:
        logger.warning(f"User {user_id} unauthorized to mark product {product_id} as active")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "Forbidden", "detail": "Unauthorized to modify this product"}
        )
    
    # Mark as active and clear sold information using DELETE_FIELD
    update_data = {
        'is_active': True,
        'updated_at': datetime.now()
    }
    
    # Use DELETE_FIELD to properly remove fields in Firestore
    if 'sold_to' in existing_product:
        update_data['sold_to'] = DELETE_FIELD
    if 'sold_at' in existing_product:
        update_data['sold_at'] = DELETE_FIELD
    
    doc_ref.update(update_data)
    
    # Create product transaction history record
    transaction_history_data = {
        'amount': existing_product.get('price', 0),
        'product_id': product_id,
        'seller_id': user_id,
        'status': 'completed',
        'transaction_type_sold': False,
        'created_at': datetime.now()
    }
    db.collection('transaction_history').add(transaction_history_data)
    logger.info(f"Created transaction history record for product {product_id} marked as active")
    
    logger.info(f"[mark-active] Product {product_id} marked as active successfully")
    
    return {"message": "Product marked as active successfully"}


@router.delete("/{product_id}")
async def delete_product(product_id: str, user_id: str = Depends(get_current_user)):
    """Delete a product listing by ID only"""
    db = get_db()
    doc_ref = db.collection('products').document(product_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "Not Found", "detail": "Product not found"}
        )
    
    # Verify ownership
    existing_product = doc.to_dict()
    if existing_product.get('seller_id') != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "Forbidden", "detail": "Unauthorized to modify this product"}
        )
    
    try:
        # Delete the product itself
        doc_ref.delete()
        
        logger.info(f"Successfully deleted product {product_id}")
        
        # Best-effort Cloudinary cleanup — log failures but don't block the response
        for url in existing_product.get('images', []):
            public_id = extract_public_id(url)
            if public_id:
                try:
                    delete_product_image(public_id)
                except Exception as e:
                    logger.warning(
                        "Failed to delete Cloudinary image %s for product %s: %s",
                        public_id, product_id, e
                    )
        
        return {
            "message": "Product deleted successfully",
            "deleted": {
                "product": product_id
            }
        }
        
    except Exception as e:
        logger.error(f"Error deleting product {product_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to delete product", "detail": str(e)}
        )
