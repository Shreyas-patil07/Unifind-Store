from fastapi import APIRouter, HTTPException
from typing import List
from datetime import datetime
from database import get_db
from models import Review, ReviewCreate

router = APIRouter()


@router.post("/reviews", response_model=Review)
async def create_review(review: ReviewCreate):
    """Create a new review and update user rating"""
    db = get_db()
    
    review_data = review.model_dump()
    review_data['created_at'] = datetime.now()
    
    # Add review to collection
    doc_ref = db.collection('reviews').document()
    doc_ref.set(review_data)
    
    # Update user's rating
    user_ref = db.collection('users').document(review.reviewed_user_id)
    user_doc = user_ref.get()
    
    if user_doc.exists:
        user_data = user_doc.to_dict()
        current_rating = user_data.get('rating', 0.0)
        review_count = user_data.get('review_count', 0)
        
        # Calculate new average rating
        new_rating = ((current_rating * review_count) + review.rating) / (review_count + 1)
        
        user_ref.update({
            'rating': new_rating,
            'review_count': review_count + 1
        })
    
    review_data['id'] = doc_ref.id
    return review_data


@router.get("/reviews/user/{user_id}", response_model=List[Review])
async def get_user_reviews(user_id: str):
    """Get all reviews for a user"""
    db = get_db()
    
    reviews = []
    for doc in db.collection('reviews').where('reviewed_user_id', '==', user_id).order_by('created_at', direction='DESCENDING').stream():
        review_data = doc.to_dict()
        review_data['id'] = doc.id
        reviews.append(review_data)
    
    return reviews


@router.get("/reviews/product/{product_id}", response_model=List[Review])
async def get_product_reviews(product_id: str):
    """Get all reviews for a product"""
    db = get_db()
    
    reviews = []
    for doc in db.collection('reviews').where('product_id', '==', product_id).order_by('created_at', direction='DESCENDING').stream():
        review_data = doc.to_dict()
        review_data['id'] = doc.id
        reviews.append(review_data)
    
    return reviews


@router.get("/reviews/{review_id}", response_model=Review)
async def get_review(review_id: str):
    """Get a specific review"""
    db = get_db()
    doc = db.collection('reviews').document(review_id).get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review_data = doc.to_dict()
    review_data['id'] = doc.id
    return review_data
