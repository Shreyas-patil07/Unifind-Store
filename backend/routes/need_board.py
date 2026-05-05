"""
AI Need Board API - Optimized with rate limiting and error handling.
"""
import time
import logging
from typing import Dict, Tuple, List, Any
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, status, Depends
from fastapi.responses import JSONResponse

from models import NeedBoardRequest, NeedBoardResponse, ExtractedIntent, RankedResult
from database import get_db
from services.intent_extractor import extract_intent
from services.semantic_ranker import rank_listings
from services.gemini_client import GeminiAPIError, GeminiTimeoutError
from auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()

# Rate limiting: track last request time per IP
_last_request_time: Dict[str, float] = {}
RATE_LIMIT_SECONDS = 10  # 1 request per 10 seconds per IP
MAX_QUERY_LENGTH = 500  # Maximum query length

# Time constants
TWELVE_HOURS = 12 * 60 * 60
TWENTY_FOUR_HOURS = 24 * 60 * 60
MAX_SEARCHES_PER_PERIOD = 3


def get_user_profile_and_searches(db, user_id: str, current_time: float) -> Tuple[Any, List[Dict]]:
    """
    Get user profile and clean up old searches.
    Returns (profile_doc_ref, cleaned_searches)
    """
    profile_ref = db.collection('user_profiles').where('user_id', '==', user_id).limit(1)
    profile_docs = list(profile_ref.stream())
    
    if not profile_docs:
        return None, []
    
    profile_doc = profile_docs[0]
    profile_data = profile_doc.to_dict()
    need_board_searches = profile_data.get('need_board_searches', [])
    
    # Clean up searches older than 24 hours
    twenty_four_hours_ago = current_time - TWENTY_FOUR_HOURS
    cleaned_searches = [s for s in need_board_searches if s.get('timestamp', 0) > twenty_four_hours_ago]
    
    # Update profile if we cleaned anything
    if len(cleaned_searches) != len(need_board_searches):
        profile_doc.reference.update({
            'need_board_searches': cleaned_searches
        })
    
    return profile_doc.reference, cleaned_searches


def get_recent_searches(searches: List[Dict], current_time: float) -> List[Dict]:
    """Filter searches within last 12 hours."""
    twelve_hours_ago = current_time - TWELVE_HOURS
    return [s for s in searches if s.get('timestamp', 0) > twelve_hours_ago]


def calculate_searches_remaining(searches: List[Dict], current_time: float) -> int:
    """Calculate remaining searches based on recent searches."""
    recent_searches = get_recent_searches(searches, current_time)
    return max(0, MAX_SEARCHES_PER_PERIOD - len(recent_searches))


@router.get("/need-board/history")
async def get_search_history(current_user: str = Depends(get_current_user)):
    """
    Get user's Need Board search history (last 12 hours).
    Automatically cleans up searches older than 24 hours.
    """
    db = get_db()
    user_id = current_user
    current_time = time.time()
    
    profile_ref, cleaned_searches = get_user_profile_and_searches(db, user_id, current_time)
    
    if profile_ref is None:
        return {
            "searches": [],
            "searches_remaining": MAX_SEARCHES_PER_PERIOD
        }
    
    recent_searches = get_recent_searches(cleaned_searches, current_time)
    
    logger.info(f"Returning {len(recent_searches)} recent searches for user {user_id}")
    for i, search in enumerate(recent_searches):
        result_count = len(search.get('results', []))
        logger.debug(f"Search {i+1}: '{search.get('query', '')}' with {result_count} results")
    
    return {
        "searches": recent_searches,
        "searches_remaining": calculate_searches_remaining(cleaned_searches, current_time)
    }


@router.post("/need-board", response_model=NeedBoardResponse)
async def need_board(
    request: NeedBoardRequest, 
    req: Request,
    current_user: str = Depends(get_current_user)
):
    """
    AI-powered Need Board endpoint.
    Extracts intent from natural language and ranks matching products.
    
    Rate limited to 3 searches per 12 hours per user.
    """
    db = get_db()
    user_id = current_user
    current_time = time.time()
    
    # Get or create user profile and get cleaned searches
    profile_ref, need_board_searches = get_user_profile_and_searches(db, user_id, current_time)
    
    if profile_ref is None:
        # Create profile if it doesn't exist
        logger.info(f"Creating user profile for {user_id}")
        profile_data = {
            'user_id': user_id,
            'need_board_searches': [],
            'branch': None,
            'avatar': None,
            'cover_gradient': 'from-blue-600 to-purple-600',
            'bio': None,
            'trust_score': 0.0,
            'rating': 0.0,
            'review_count': 0,
            'member_since': str(datetime.now().year),
            'phone': None,
            'hostel_room': None,
            'branch_change_history': [],
            'photo_change_history': [],
            'dark_mode': False,
            'updated_at': datetime.now()
        }
        profile_ref = db.collection('user_profiles').document()
        profile_ref.set(profile_data)
        need_board_searches = []
    
    # Check if user has exceeded limit
    recent_searches = get_recent_searches(need_board_searches, current_time)
    
    if len(recent_searches) >= MAX_SEARCHES_PER_PERIOD:
        oldest_search_time = min(s.get('timestamp', 0) for s in recent_searches)
        time_until_reset = int((oldest_search_time + TWELVE_HOURS - current_time) / 60)
        hours = time_until_reset // 60
        minutes = time_until_reset % 60
        
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Search limit reached. You've used all {MAX_SEARCHES_PER_PERIOD} searches. Resets in {hours}h {minutes}m."
        )
    
    # Rate limiting check (per IP for additional protection)
    client_ip = req.client.host
    
    if client_ip in _last_request_time:
        time_since_last = current_time - _last_request_time[client_ip]
        if time_since_last < RATE_LIMIT_SECONDS:
            wait_time = int(RATE_LIMIT_SECONDS - time_since_last)
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many requests. Please wait {wait_time} seconds."
            )
    
    # Update last request time
    _last_request_time[client_ip] = current_time
    
    # Validate query
    if not request.query or not request.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query cannot be empty"
        )
    
    if len(request.query) > MAX_QUERY_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Query too long. Maximum {MAX_QUERY_LENGTH} characters."
        )
    
    try:
        logger.info(f"Processing need board query for user {user_id}: {request.query[:50]}...")
        
        # Extract intent FIRST to pre-filter products (OPTIMIZATION)
        intent = await extract_intent(request.query)
        logger.debug(f"Extracted intent: {intent}")
        
        # Fetch active products from database with pre-filtering
        products_ref = db.collection('products')
        query = products_ref.where('is_active', '==', True)
        
        # Pre-filter by category if extracted (reduces AI load)
        extracted_category = intent.get('category')
        if extracted_category and extracted_category != 'Other':
            logger.info(f"Pre-filtering by category: {extracted_category}")
            query = query.where('category', '==', extracted_category).limit(50)
        else:
            query = query.limit(100)
        
        # Pre-filter by price if max_price specified (reduces AI load)
        max_price = intent.get('max_price')
        if max_price and isinstance(max_price, (int, float)) and max_price > 0:
            logger.info(f"Pre-filtering by max price: {max_price}")
            # Note: Firestore doesn't support multiple inequality filters on different fields
            # So we'll filter in Python after fetching
        
        # Convert products to listing format
        listings = []
        for doc in query.stream():
            product_data = doc.to_dict()
            
            # Apply price filter in Python if needed
            if max_price and isinstance(max_price, (int, float)) and max_price > 0:
                product_price = product_data.get("price", 0)
                if product_price > max_price:
                    continue  # Skip products over budget
            
            listings.append({
                "id": doc.id,
                "title": product_data.get("title", ""),
                "description": product_data.get("description", ""),
                "price": product_data.get("price", 0),
                "condition": product_data.get("condition", ""),
                "category": product_data.get("category", ""),
                "images": product_data.get("images", []),
            })
        
        logger.debug(f"Fetched {len(listings)} active products after pre-filtering")
        
        # Rank listings against intent
        ranked = await rank_listings(request.query, intent, listings)
        logger.debug(f"Ranked {len(ranked)} listings")
        
        # Enrich results with listing details
        listing_map = {str(l["id"]): l for l in listings}
        enriched = []
        
        for r in ranked:
            listing = listing_map.get(str(r.get("id", "")), {})
            enriched.append(RankedResult(
                **r,
                title=listing.get("title"),
                price=listing.get("price"),
                images=listing.get("images", []),
            ))
        
        # Filter results: only keep matches >= 50% and limit to top 10
        filtered_enriched = [r for r in enriched if r.match_score >= 50][:10]
        
        logger.info(f"Successfully processed query with {len(enriched)} total results, {len(filtered_enriched)} results >= 50% (showing top 10)")
        
        # Record the search in user profile with filtered results (>= 50%, top 10)
        search_record = {
            'timestamp': int(current_time),
            'query': request.query[:100],  # Store first 100 chars
            'extracted': intent,
            'results': [
                {
                    'id': str(r.id),
                    'match_score': r.match_score,
                    'reason': r.reason,
                    'title': r.title if r.title else '',
                    'price': float(r.price) if r.price is not None else None,
                    'images': r.images if r.images else []
                }
                for r in filtered_enriched
            ]
        }
        need_board_searches.append(search_record)
        
        logger.info(f"Saving search record with {len(search_record['results'])} results (>= 50% match, top 10)")
        
        # Update user profile with cleaned and new search history
        logger.info(f"Updating profile with {len(need_board_searches)} total searches")
        profile_ref.update({
            'need_board_searches': need_board_searches
        })
        logger.info(f"Profile updated successfully")
        
        # Calculate remaining searches using helper function
        searches_remaining = calculate_searches_remaining(need_board_searches, current_time)
        logger.info(f"User has {searches_remaining} searches remaining")
        
        return NeedBoardResponse(
            extracted=ExtractedIntent(**intent),
            rankedResults=filtered_enriched,
            searches_remaining=searches_remaining,
        )
        
    except GeminiTimeoutError as exc:
        logger.error(f"Gemini API timeout: {exc}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI service timeout. Please try again."
        )
        
    except GeminiAPIError as exc:
        logger.error(f"Gemini API error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service temporarily unavailable. Please try again later."
        )
        
    except ValueError as exc:
        logger.error(f"Value error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )
        
    except Exception as exc:
        logger.error(f"Unexpected error in need_board: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again."
        )
