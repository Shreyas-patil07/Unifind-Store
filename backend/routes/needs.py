"""
Needs API - Demand → Supply Engine
Production-ready endpoints for need posting and matching.
"""
import time
import logging
from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse

from models import (
    NeedCreate, Need, NeedResponse, RankedResult,
    SellerDemandBanner, SellerNeedFeed, NeedFulfillRequest
)
from database import get_db
from auth import get_current_user
from services.need_matcher import (
    match_need_to_listings,
    match_need_to_sellers,
    rank_needs_for_seller,
    extract_keywords,
    normalize_text
)
from services.intent_extractor import extract_intent

logger = logging.getLogger(__name__)
router = APIRouter()

# Rate limiting
MAX_NEEDS_PER_DAY = 5
NEED_EXPIRY_DAYS = 7


def _extract_tags_from_text(text: str) -> List[str]:
    """Extract meaningful tags from text."""
    keywords = extract_keywords(text)
    # Limit to top 5 most relevant keywords
    return list(keywords)[:5]


def _generate_title_from_text(text: str) -> str:
    """Generate a concise title from raw text."""
    normalized = normalize_text(text)
    words = normalized.split()
    # Take first 8 words as title
    title_words = words[:8]
    title = ' '.join(title_words)
    if len(words) > 8:
        title += '...'
    return title.capitalize()


@router.post("/needs", response_model=NeedResponse)
async def create_need(
    request: NeedCreate,
    current_user: str = Depends(get_current_user)
):
    """
    Create a new need (buyer posts what they're looking for).
    
    Process:
    1. Extract structured data from raw text
    2. Store need in database
    3. Find matching listings
    4. Notify relevant sellers
    """
    db = get_db()
    user_id = current_user
    current_time = datetime.now()
    
    # Check rate limit (5 needs per day)
    needs_ref = db.collection('needs')
    yesterday = current_time - timedelta(days=1)
    recent_needs = needs_ref.where('user_id', '==', user_id)\
        .where('created_at', '>=', yesterday)\
        .stream()
    
    recent_count = sum(1 for _ in recent_needs)
    if recent_count >= MAX_NEEDS_PER_DAY:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily limit reached. You can post {MAX_NEEDS_PER_DAY} needs per day."
        )
    
    try:
        # Extract intent using AI
        logger.info(f"Extracting intent from: {request.raw_text[:50]}...")
        intent = await extract_intent(request.raw_text)
        
        # Generate structured data
        title = _generate_title_from_text(request.raw_text)
        tags = _extract_tags_from_text(request.raw_text)
        
        # Get user's college
        users_ref = db.collection('users').where('firebase_uid', '==', user_id).limit(1)
        user_docs = list(users_ref.stream())
        college = user_docs[0].to_dict().get('college', 'Unknown') if user_docs else 'Unknown'
        
        # Create price range if max_price is specified
        price_range = None
        if intent.get('max_price'):
            price_range = {
                'min': 0,
                'max': float(intent['max_price'])
            }
        
        # Create need object
        need_data = {
            'user_id': user_id,
            'raw_text': request.raw_text,
            'title': title,
            'category': intent.get('category', 'Other'),
            'tags': tags,
            'price_range': price_range,
            'college': college,
            'location': None,
            'created_at': current_time,
            'status': 'open',
            'matched_listings': [],
            'interested_sellers': []
        }
        
        # Save to database
        need_ref = needs_ref.document()
        need_ref.set(need_data)
        need_id = need_ref.id
        
        logger.info(f"Created need {need_id} for user {user_id}")
        
        # Find matching listings
        products_ref = db.collection('products')
        active_products = products_ref.where('is_active', '==', True)\
            .where('mark_as_sold', '==', False)\
            .limit(100)\
            .stream()
        
        listings = []
        for doc in active_products:
            product_data = doc.to_dict()
            # Extract tags from product (use category + keywords from title)
            product_tags = [product_data.get('category', '')]
            product_tags.extend(_extract_tags_from_text(product_data.get('title', '')))
            
            listings.append({
                'id': doc.id,
                'title': product_data.get('title', ''),
                'description': product_data.get('description', ''),
                'price': product_data.get('price', 0),
                'category': product_data.get('category', ''),
                'tags': product_tags,
                'images': product_data.get('images', [])
            })
        
        logger.info(f"Found {len(listings)} active listings to match against")
        
        # Match need to listings
        matches = match_need_to_listings(need_data, listings, limit=10)
        
        # Store matched listing IDs
        matched_ids = [m['id'] for m in matches]
        need_ref.update({'matched_listings': matched_ids})
        
        logger.info(f"Found {len(matches)} matching listings for need {need_id}")
        
        # Find relevant sellers to notify
        sellers_data = []
        products_by_seller = {}
        
        for listing in listings:
            # Get seller info
            product_ref = products_ref.document(listing['id'])
            product_doc = product_ref.get()
            if product_doc.exists:
                seller_id = product_doc.to_dict().get('seller_id')
                if seller_id and seller_id != user_id:  # Don't notify the buyer
                    if seller_id not in products_by_seller:
                        products_by_seller[seller_id] = []
                    products_by_seller[seller_id].append(listing)
        
        for seller_id, seller_listings in products_by_seller.items():
            sellers_data.append({
                'user_id': seller_id,
                'listings': seller_listings
            })
        
        relevant_sellers = match_need_to_sellers(need_data, sellers_data, limit=20)
        logger.info(f"Identified {len(relevant_sellers)} relevant sellers")
        
        # Create notifications for relevant sellers
        notifications_ref = db.collection('notifications')
        for seller_id in relevant_sellers[:10]:  # Notify top 10 sellers
            notification_data = {
                'user_id': seller_id,
                'type': 'new_need',
                'need_id': need_id,
                'title': 'New buyer need matches your items!',
                'message': f"Someone is looking for: {title}",
                'created_at': current_time,
                'read': False
            }
            notifications_ref.add(notification_data)
        
        logger.info(f"Created {len(relevant_sellers[:10])} notifications")
        
        # Build response
        need_obj = Need(
            id=need_id,
            **need_data
        )
        
        ranked_results = [
            RankedResult(**m) for m in matches
        ]
        
        return NeedResponse(
            need=need_obj,
            matched_listings=ranked_results
        )
        
    except Exception as exc:
        logger.error(f"Error creating need: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create need. Please try again."
        )


@router.get("/needs/match/{need_id}")
async def get_need_matches(
    need_id: str,
    current_user: str = Depends(get_current_user)
):
    """Get matching listings for a specific need."""
    db = get_db()
    
    # Get need
    need_ref = db.collection('needs').document(need_id)
    need_doc = need_ref.get()
    
    if not need_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Need not found"
        )
    
    need_data = need_doc.to_dict()
    
    # Verify ownership
    if need_data.get('user_id') != current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this need"
        )
    
    # Get matched listings
    matched_ids = need_data.get('matched_listings', [])
    
    if not matched_ids:
        return {'matches': []}
    
    # Fetch listing details
    products_ref = db.collection('products')
    matches = []
    
    for product_id in matched_ids[:10]:
        product_doc = products_ref.document(product_id).get()
        if product_doc.exists:
            product_data = product_doc.to_dict()
            matches.append({
                'id': product_id,
                'title': product_data.get('title'),
                'price': product_data.get('price'),
                'images': product_data.get('images', []),
                'category': product_data.get('category')
            })
    
    return {'matches': matches}


@router.get("/needs/seller-feed", response_model=SellerNeedFeed)
async def get_seller_need_feed(
    current_user: str = Depends(get_current_user)
):
    """
    Get feed of relevant needs for a seller.
    Shows needs that match the seller's listings.
    """
    db = get_db()
    seller_id = current_user
    
    # Get seller's active listings
    products_ref = db.collection('products')
    seller_products = products_ref.where('seller_id', '==', seller_id)\
        .where('is_active', '==', True)\
        .where('mark_as_sold', '==', False)\
        .stream()
    
    seller_listings = []
    for doc in seller_products:
        product_data = doc.to_dict()
        product_tags = [product_data.get('category', '')]
        product_tags.extend(_extract_tags_from_text(product_data.get('title', '')))
        
        seller_listings.append({
            'id': doc.id,
            'title': product_data.get('title', ''),
            'description': product_data.get('description', ''),
            'category': product_data.get('category', ''),
            'tags': product_tags
        })
    
    if not seller_listings:
        return SellerNeedFeed(needs=[], total_count=0)
    
    # Get open needs
    needs_ref = db.collection('needs')
    open_needs = needs_ref.where('status', '==', 'open')\
        .order_by('created_at', direction='DESCENDING')\
        .limit(50)\
        .stream()
    
    needs_list = []
    for doc in open_needs:
        need_data = doc.to_dict()
        needs_list.append({
            'id': doc.id,
            **need_data
        })
    
    # Rank needs by relevance
    ranked_needs = rank_needs_for_seller(seller_listings, needs_list, limit=10)
    
    # Enrich with user info
    for need in ranked_needs:
        user_id = need.get('user_id')
        users_ref = db.collection('users').where('firebase_uid', '==', user_id).limit(1)
        user_docs = list(users_ref.stream())
        if user_docs:
            user_data = user_docs[0].to_dict()
            need['buyer_name'] = user_data.get('name', 'Anonymous')
            need['buyer_college'] = user_data.get('college', 'Unknown')
    
    return SellerNeedFeed(
        needs=ranked_needs,
        total_count=len(ranked_needs)
    )


@router.get("/needs/seller-banner", response_model=SellerDemandBanner)
async def get_seller_demand_banner(
    current_user: str = Depends(get_current_user)
):
    """
    Get banner data for seller dashboard.
    Shows count of relevant needs.
    """
    db = get_db()
    seller_id = current_user
    
    # Get seller's active listings
    products_ref = db.collection('products')
    seller_products = products_ref.where('seller_id', '==', seller_id)\
        .where('is_active', '==', True)\
        .where('mark_as_sold', '==', False)\
        .stream()
    
    seller_listings = []
    seller_categories = set()
    
    for doc in seller_products:
        product_data = doc.to_dict()
        category = product_data.get('category', '')
        seller_categories.add(category)
        
        product_tags = [category]
        product_tags.extend(_extract_tags_from_text(product_data.get('title', '')))
        
        seller_listings.append({
            'id': doc.id,
            'title': product_data.get('title', ''),
            'description': product_data.get('description', ''),
            'category': category,
            'tags': product_tags
        })
    
    if not seller_listings:
        return SellerDemandBanner(
            total_relevant_needs=0,
            top_categories=[],
            message="List items to see buyer demand"
        )
    
    # Get open needs
    needs_ref = db.collection('needs')
    open_needs = needs_ref.where('status', '==', 'open')\
        .order_by('created_at', direction='DESCENDING')\
        .limit(100)\
        .stream()
    
    needs_list = []
    for doc in open_needs:
        need_data = doc.to_dict()
        needs_list.append({
            'id': doc.id,
            **need_data
        })
    
    # Rank needs
    ranked_needs = rank_needs_for_seller(seller_listings, needs_list, limit=50)
    
    # Get top categories
    category_counts = {}
    for need in ranked_needs:
        cat = need.get('category', 'Other')
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    top_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
    top_categories = [cat for cat, _ in top_categories[:3]]
    
    # Generate message
    count = len(ranked_needs)
    if count == 0:
        message = "No active buyer needs match your items"
    elif count == 1:
        message = "1 buyer needs items you can sell"
    else:
        message = f"{count} buyers need items you can sell"
    
    return SellerDemandBanner(
        total_relevant_needs=count,
        top_categories=top_categories,
        message=message
    )


@router.post("/needs/{need_id}/fulfill")
async def fulfill_need(
    need_id: str,
    request: NeedFulfillRequest,
    current_user: str = Depends(get_current_user)
):
    """Mark a need as fulfilled."""
    db = get_db()
    
    # Get need
    need_ref = db.collection('needs').document(need_id)
    need_doc = need_ref.get()
    
    if not need_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Need not found"
        )
    
    need_data = need_doc.to_dict()
    
    # Verify ownership
    if need_data.get('user_id') != current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this need"
        )
    
    # Update status
    need_ref.update({
        'status': 'fulfilled',
        'fulfilled_at': datetime.now(),
        'fulfilled_with_product': request.product_id
    })
    
    return {'message': 'Need marked as fulfilled'}


@router.post("/needs/{need_id}/save")
async def save_need(
    need_id: str,
    current_user: str = Depends(get_current_user)
):
    """Save a need (seller expresses interest)."""
    db = get_db()
    
    # Get need
    need_ref = db.collection('needs').document(need_id)
    need_doc = need_ref.get()
    
    if not need_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Need not found"
        )
    
    need_data = need_doc.to_dict()
    interested_sellers = need_data.get('interested_sellers', [])
    
    # Add seller if not already interested
    if current_user not in interested_sellers:
        interested_sellers.append(current_user)
        need_ref.update({'interested_sellers': interested_sellers})
    
    return {'message': 'Need saved successfully'}


@router.get("/needs/my-needs")
async def get_my_needs(
    current_user: str = Depends(get_current_user)
):
    """Get all needs posted by the current user."""
    db = get_db()
    
    needs_ref = db.collection('needs')
    user_needs = needs_ref.where('user_id', '==', current_user)\
        .order_by('created_at', direction='DESCENDING')\
        .limit(20)\
        .stream()
    
    needs_list = []
    for doc in user_needs:
        need_data = doc.to_dict()
        needs_list.append({
            'id': doc.id,
            **need_data
        })
    
    return {'needs': needs_list}

