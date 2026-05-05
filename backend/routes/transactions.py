"""
Transaction History API Routes
Provides endpoints to view and manage transaction history
"""
from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from google.cloud.firestore_v1.base_query import FieldFilter
from database import get_db
from auth import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/transactions")


@router.get("/history", response_model=Dict[str, Any])
async def get_transaction_history(
    user_id: str = Depends(get_current_user),
    product_id: Optional[str] = Query(None, description="Filter by product ID"),
    transaction_type_sold: Optional[bool] = Query(None, description="Filter by sold status"),
    limit: int = Query(50, ge=1, le=200, description="Number of records to return")
):
    """
    Get transaction history for the authenticated user.
    Returns all transaction history records where the user is the seller.
    """
    try:
        db = get_db()
        transactions_ref = db.collection('transaction_history')
        
        # Start with seller_id filter
        query = transactions_ref.where(filter=FieldFilter('seller_id', '==', user_id))
        
        # Apply additional filters if provided
        if product_id:
            query = query.where(filter=FieldFilter('product_id', '==', product_id))
        
        if transaction_type_sold is not None:
            query = query.where(filter=FieldFilter('transaction_type_sold', '==', transaction_type_sold))
        
        # Order by created_at descending and limit
        query = query.order_by('created_at', direction='DESCENDING').limit(limit)
        
        # Fetch transactions
        transactions = []
        for doc in query.stream():
            transaction_data = doc.to_dict()
            transaction_data['id'] = doc.id
            
            # Enrich with product details
            product_id_val = transaction_data.get('product_id')
            if product_id_val:
                try:
                    product_doc = db.collection('products').document(product_id_val).get()
                    if product_doc.exists:
                        product_data = product_doc.to_dict()
                        transaction_data['product'] = {
                            'id': product_id_val,
                            'title': product_data.get('title'),
                            'images': product_data.get('images', []),
                            'price': product_data.get('price')
                        }
                except Exception as e:
                    logger.warning(f"Error fetching product {product_id_val}: {str(e)}")
                    transaction_data['product'] = None
            
            transactions.append(transaction_data)
        
        return {
            "transactions": transactions,
            "count": len(transactions)
        }
        
    except Exception as e:
        logger.error(f"Error fetching transaction history: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to fetch transaction history", "detail": str(e)}
        )


@router.get("/stats", response_model=Dict[str, Any])
async def get_transaction_stats(
    user_id: str = Depends(get_current_user),
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze")
):
    """
    Get transaction statistics for the authenticated user.
    Returns summary of sold/active products and revenue.
    """
    try:
        db = get_db()
        transactions_ref = db.collection('transaction_history')
        
        # Calculate date threshold
        date_threshold = datetime.now() - timedelta(days=days)
        
        # Fetch all transactions for the user
        query = transactions_ref.where(filter=FieldFilter('seller_id', '==', user_id))
        query = query.where(filter=FieldFilter('created_at', '>=', date_threshold))
        
        transactions = list(query.stream())
        
        # Calculate statistics
        total_sold = 0
        total_active = 0
        total_revenue = 0.0
        
        for doc in transactions:
            transaction_data = doc.to_dict()
            if transaction_data.get('transaction_type_sold'):
                total_sold += 1
                total_revenue += transaction_data.get('amount', 0)
            else:
                total_active += 1
        
        return {
            "period_days": days,
            "total_sold": total_sold,
            "total_active": total_active,
            "total_revenue": total_revenue,
            "total_transactions": len(transactions)
        }
        
    except Exception as e:
        logger.error(f"Error fetching transaction stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to fetch transaction stats", "detail": str(e)}
        )


@router.get("/product/{product_id}", response_model=List[Dict[str, Any]])
async def get_product_transaction_history(
    product_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get transaction history for a specific product.
    Only the seller can view the transaction history.
    """
    try:
        db = get_db()
        
        # Verify product ownership
        product_doc = db.collection('products').document(product_id).get()
        if not product_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"error": "Not Found", "detail": "Product not found"}
            )
        
        product_data = product_doc.to_dict()
        if product_data.get('seller_id') != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"error": "Forbidden", "detail": "Unauthorized to view this product's transaction history"}
            )
        
        # Fetch transaction history
        transactions_ref = db.collection('transaction_history')
        query = transactions_ref.where(filter=FieldFilter('product_id', '==', product_id))
        query = query.order_by('created_at', direction='DESCENDING')
        
        transactions = []
        for doc in query.stream():
            transaction_data = doc.to_dict()
            transaction_data['id'] = doc.id
            transactions.append(transaction_data)
        
        return transactions
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching product transaction history: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "Failed to fetch product transaction history", "detail": str(e)}
        )
