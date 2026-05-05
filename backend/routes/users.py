from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime
from database import get_db
from models import (
    User, UserCreate, 
    UserProfile, UserProfileCreate, UserProfileBase,
    Transaction, TransactionCreate
)

router = APIRouter()


# ============= USER ROUTES (Core Authentication) =============

@router.get("/users", response_model=List[User])
async def get_users():
    """Get all users (core data only)"""
    db = get_db()
    users = []
    for doc in db.collection('users').stream():
        user_data = doc.to_dict()
        user_data['id'] = doc.id
        users.append(user_data)
    return users


@router.get("/users/search/{query}")
async def search_users(query: str):
    """Search users by name"""
    db = get_db()
    
    if not query or len(query) < 2:
        raise HTTPException(status_code=400, detail="Search query must be at least 2 characters")
    
    # Get all users and filter by name (case-insensitive)
    users = []
    query_lower = query.lower()
    
    for doc in db.collection('users').stream():
        user_data = doc.to_dict()
        user_name = user_data.get('name', '').lower()
        
        if query_lower in user_name:
            user_data['id'] = doc.id
            
            # Get profile data for avatar
            profiles = db.collection('user_profiles').where('user_id', '==', doc.id).limit(1).stream()
            for profile_doc in profiles:
                profile_data = profile_doc.to_dict()
                # Only use profile avatar if user doesn't have one
                if not user_data.get('avatar'):
                    user_data['avatar'] = profile_data.get('avatar')
                user_data['bio'] = profile_data.get('bio')
                break
            
            # Remove sensitive data
            user_data.pop('email', None)
            user_data.pop('firebase_uid', None)
            users.append(user_data)
    
    return users[:20]  # Limit to 20 results


@router.post("/users", response_model=Dict[str, Any])
async def create_user(user: UserCreate):
    """Create a new user with profile"""
    db = get_db()
    
    # Check if user with firebase_uid already exists
    existing_users = db.collection('users').where('firebase_uid', '==', user.firebase_uid).limit(1).stream()
    if any(existing_users):
        raise HTTPException(status_code=400, detail="User with this Firebase UID already exists")
    
    # Create user (core data)
    user_data = user.model_dump()
    user_data['email_verified'] = False
    user_data['created_at'] = datetime.now()
    
    user_ref = db.collection('users').document()
    user_ref.set(user_data)
    user_id = user_ref.id
    
    # Create user profile (extended data)
    profile_data = {
        'user_id': user_id,
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
    
    user_data['id'] = user_id
    profile_data['id'] = profile_ref.id
    
    return {
        'user': user_data,
        'profile': profile_data
    }


@router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get a specific user by ID (core data only)"""
    db = get_db()
    doc = db.collection('users').document(user_id).get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = doc.to_dict()
    user_data['id'] = doc.id
    return user_data


@router.get("/users/firebase/{firebase_uid}", response_model=User)
async def get_user_by_firebase_uid(firebase_uid: str):
    """Get a user by Firebase UID"""
    db = get_db()
    users = db.collection('users').where('firebase_uid', '==', firebase_uid).limit(1).stream()
    
    for doc in users:
        user_data = doc.to_dict()
        user_data['id'] = doc.id
        return user_data
    
    raise HTTPException(status_code=404, detail="User not found")


@router.put("/users/{user_id}")
async def update_user(user_id: str, updates: Dict[str, Any]):
    """Update user core data (name, email, college)"""
    db = get_db()
    doc_ref = db.collection('users').document(user_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Only allow updating specific fields
    allowed_fields = ['name', 'email', 'college', 'email_verified']
    filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
    
    if filtered_updates:
        doc_ref.update(filtered_updates)
    
    updated_doc = doc_ref.get()
    user_data = updated_doc.to_dict()
    user_data['id'] = user_id
    
    return user_data


# ============= USER PROFILE ROUTES (Extended Information) =============

@router.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str, include_private: bool = False):
    """Get user profile with user data (public data by default)"""
    db = get_db()
    
    # Verify user exists and get user data
    user_doc = db.collection('users').document(user_id).get()
    if not user_doc.exists:
        # Return minimal profile for deleted/missing users
        return {
            'id': user_id,
            'user_id': user_id,
            'name': 'Unknown User',
            'email': None,
            'college': None,
            'avatar': None,
            'branch': None,
            'bio': None,
            'trust_score': 0.0,
            'rating': 0.0,
            'review_count': 0,
            'member_since': str(datetime.now().year),
            'cover_gradient': 'from-gray-600 to-gray-600',
            '_deleted': True  # Flag to indicate user doesn't exist
        }
    
    user_data = user_doc.to_dict()
    user_data['id'] = user_doc.id
    
    # Get profile (if exists)
    profiles = db.collection('user_profiles').where('user_id', '==', user_id).limit(1).stream()
    
    profile_data = None
    for doc in profiles:
        profile_data = doc.to_dict()
        profile_data['id'] = doc.id
        break
    
    # If no profile exists, create default profile data
    if not profile_data:
        profile_data = {
            'user_id': user_id,
            'branch': None,
            'avatar': None,
            'cover_gradient': 'from-blue-600 to-purple-600',
            'bio': None,
            'trust_score': 0.0,
            'rating': 0.0,
            'review_count': 0,
            'member_since': user_data.get('created_at', '').split('T')[0].split('-')[0] if user_data.get('created_at') else str(datetime.now().year),
            'phone': None,
            'hostel_room': None,
            'branch_change_history': [],
            'photo_change_history': [],
            'dark_mode': False
        }
    
    # Extract avatar from photo_change_history if not already set
    if not user_data.get('avatar') and not profile_data.get('avatar'):
        photo_history = user_data.get('photo_change_history', [])
        if photo_history and len(photo_history) > 0:
            # Get the most recent photo
            latest_photo = photo_history[-1]
            if isinstance(latest_photo, dict) and 'url' in latest_photo:
                user_data['avatar'] = latest_photo['url']
    
    # Remove private fields if not requested
    if not include_private:
        private_fields = ['phone', 'hostel_room', 'branch_change_history', 'photo_change_history', 'dark_mode']
        for field in private_fields:
            profile_data.pop(field, None)
            user_data.pop(field, None)
        # Also hide email from user data for public view
        user_data.pop('email', None)
    
    # Combine user and profile data
    # IMPORTANT: User data takes precedence over profile data for avatar
    # because EditProfilePage saves avatar to users collection
    combined_data = {
        **profile_data,  # Profile data first (base)
        **user_data,     # User data second (overrides profile)
        'user_id': user_id
    }
    
    return combined_data


@router.put("/users/{user_id}/profile")
async def update_user_profile(user_id: str, updates: Dict[str, Any]):
    """Update user profile"""
    db = get_db()
    
    # Verify user exists
    user_doc = db.collection('users').document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get profile
    profiles = db.collection('user_profiles').where('user_id', '==', user_id).limit(1).stream()
    
    for doc in profiles:
        profile_ref = db.collection('user_profiles').document(doc.id)
        updates['updated_at'] = datetime.now()
        profile_ref.update(updates)
        
        updated_doc = profile_ref.get()
        profile_data = updated_doc.to_dict()
        profile_data['id'] = doc.id
        
        return profile_data
    
    raise HTTPException(status_code=404, detail="User profile not found")


# ============= TRANSACTION HISTORY ROUTES =============

@router.get("/users/{user_id}/transactions", response_model=List[Transaction])
async def get_user_transactions(user_id: str, transaction_type: str = None):
    """Get user's transaction history (buy/sell)"""
    db = get_db()
    
    # Verify user exists
    user_doc = db.collection('users').document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    query = db.collection('transaction_history').where('user_id', '==', user_id)
    
    if transaction_type in ['buy', 'sell']:
        query = query.where('transaction_type', '==', transaction_type)
    
    transactions = []
    for doc in query.order_by('created_at', direction='DESCENDING').stream():
        transaction_data = doc.to_dict()
        transaction_data['id'] = doc.id
        transactions.append(transaction_data)
    
    return transactions


@router.post("/users/{user_id}/transactions", response_model=Transaction)
async def create_transaction(user_id: str, transaction: TransactionCreate):
    """Create a new transaction record"""
    db = get_db()
    
    # Verify user exists
    user_doc = db.collection('users').document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    if transaction.user_id != user_id:
        raise HTTPException(status_code=400, detail="User ID mismatch")
    
    transaction_data = transaction.model_dump()
    transaction_data['created_at'] = datetime.now()
    transaction_data['completed_at'] = None
    
    doc_ref = db.collection('transaction_history').document()
    doc_ref.set(transaction_data)
    
    transaction_data['id'] = doc_ref.id
    return transaction_data


@router.put("/transactions/{transaction_id}")
async def update_transaction(transaction_id: str, updates: Dict[str, Any]):
    """Update transaction status"""
    db = get_db()
    doc_ref = db.collection('transaction_history').document(transaction_id)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if 'status' in updates and updates['status'] == 'completed':
        updates['completed_at'] = datetime.now()
    
    doc_ref.update(updates)
    
    updated_doc = doc_ref.get()
    transaction_data = updated_doc.to_dict()
    transaction_data['id'] = transaction_id
    
    return transaction_data


# ============= FRIEND MANAGEMENT ROUTES =============

# IMPORTANT: More specific routes must come BEFORE generic parameterized routes
# Otherwise FastAPI will match the wrong route

@router.get("/users/{user_id}/friends/requests/pending")
async def get_pending_friend_requests(user_id: str):
    """Get pending friend requests for a user"""
    db = get_db()
    
    # Get pending requests where user is the recipient (no user verification for speed)
    requests = list(db.collection('friendships').where('friend_id', '==', user_id).where('status', '==', 'pending').stream())
    
    if not requests:
        return []
    
    # Track seen requester IDs to avoid duplicates
    seen_requesters = set()
    pending_requests = []
    
    for doc in requests:
        request_data = doc.to_dict()
        requester_id = request_data['user_id']
        
        # Skip if we've already seen this requester (duplicate request)
        if requester_id in seen_requesters:
            print(f"[PENDING_REQUESTS] Skipping duplicate request from {requester_id}")
            # Delete the duplicate
            doc.reference.delete()
            continue
        
        seen_requesters.add(requester_id)
        
        # Get requester's user data
        requester_doc = db.collection('users').document(requester_id).get()
        if requester_doc.exists:
            requester_data = requester_doc.to_dict()
            requester_data['id'] = requester_id
            requester_data['request_id'] = doc.id
            requester_data['created_at'] = request_data.get('created_at')
            
            # Get requester's profile for avatar (optimized - single query)
            profiles = list(db.collection('user_profiles').where('user_id', '==', requester_id).limit(1).stream())
            if profiles:
                profile_data = profiles[0].to_dict()
                if not requester_data.get('avatar'):
                    requester_data['avatar'] = profile_data.get('avatar')
                requester_data['bio'] = profile_data.get('bio')
            
            # Remove sensitive data
            requester_data.pop('email', None)
            requester_data.pop('firebase_uid', None)
            pending_requests.append(requester_data)
    
    return pending_requests


@router.get("/users/{user_id}/friends/check/{friend_id}")
async def check_friendship(user_id: str, friend_id: str):
    """Check friendship status between two users"""
    db = get_db()
    
    # Check if they are friends (active)
    active_friendship = db.collection('friendships').where('user_id', '==', user_id).where('friend_id', '==', friend_id).where('status', '==', 'active').limit(1).stream()
    if any(active_friendship):
        return {"status": "friends"}
    
    # Check if current user sent a pending request
    sent_request = db.collection('friendships').where('user_id', '==', user_id).where('friend_id', '==', friend_id).where('status', '==', 'pending').limit(1).stream()
    if any(sent_request):
        return {"status": "request_sent"}
    
    # Check if current user received a pending request
    received_request = db.collection('friendships').where('user_id', '==', friend_id).where('friend_id', '==', user_id).where('status', '==', 'pending').limit(1).stream()
    if any(received_request):
        return {"status": "request_received"}
    
    return {"status": "none"}


@router.get("/users/{user_id}/friends")
async def get_friends(user_id: str):
    """Get user's friends list (only active friendships)"""
    db = get_db()
    
    # Verify user exists
    user_doc = db.collection('users').document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get active friendships
    friendships = db.collection('friendships').where('user_id', '==', user_id).where('status', '==', 'active').stream()
    
    friends = []
    for doc in friendships:
        friendship_data = doc.to_dict()
        friend_id = friendship_data['friend_id']
        
        # Get friend's user data
        friend_doc = db.collection('users').document(friend_id).get()
        if friend_doc.exists:
            friend_data = friend_doc.to_dict()
            friend_data['id'] = friend_id
            
            # Get friend's profile for avatar
            profiles = db.collection('user_profiles').where('user_id', '==', friend_id).limit(1).stream()
            for profile_doc in profiles:
                profile_data = profile_doc.to_dict()
                # Only use profile avatar if user doesn't have one
                if not friend_data.get('avatar'):
                    friend_data['avatar'] = profile_data.get('avatar')
                friend_data['bio'] = profile_data.get('bio')
                break
            
            # Remove sensitive data
            friend_data.pop('email', None)
            friend_data.pop('firebase_uid', None)
            friends.append(friend_data)
    
    return friends


@router.post("/users/{user_id}/friends/{friend_id}")
async def add_friend(user_id: str, friend_id: str):
    """Send a friend request"""
    db = get_db()
    
    print(f"[ADD_FRIEND] Request: {user_id} -> {friend_id}")
    
    if user_id == friend_id:
        print(f"[ADD_FRIEND] Error: Same user")
        raise HTTPException(status_code=400, detail="Cannot add yourself as a friend")
    
    # Verify both users exist
    user_doc = db.collection('users').document(user_id).get()
    friend_doc = db.collection('users').document(friend_id).get()
    
    print(f"[ADD_FRIEND] User exists: {user_doc.exists}, Friend exists: {friend_doc.exists}")
    
    if not user_doc.exists:
        print(f"[ADD_FRIEND] Error: User {user_id} not found")
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    
    if not friend_doc.exists:
        print(f"[ADD_FRIEND] Error: Friend {friend_id} not found")
        raise HTTPException(status_code=404, detail=f"Friend {friend_id} not found")
    
    # Check if friendship already exists (any status)
    existing = list(db.collection('friendships').where('user_id', '==', user_id).where('friend_id', '==', friend_id).stream())
    for doc in existing:
        friendship_data = doc.to_dict()
        if friendship_data.get('status') == 'pending':
            print(f"[ADD_FRIEND] Error: Friend request already pending")
            raise HTTPException(status_code=400, detail="Friend request already sent")
        elif friendship_data.get('status') == 'active':
            print(f"[ADD_FRIEND] Error: Already friends")
            raise HTTPException(status_code=400, detail="Already friends")
    
    # Check if there's a pending request from the other user
    reverse_request = db.collection('friendships').where('user_id', '==', friend_id).where('friend_id', '==', user_id).where('status', '==', 'pending').limit(1).stream()
    for doc in reverse_request:
        # If the other user already sent a request, accept it automatically
        original_data = doc.to_dict()
        original_created_at = original_data.get('created_at', datetime.now())
        
        doc.reference.update({'status': 'active', 'accepted_at': datetime.now()})
        
        # Create reciprocal friendship with SAME created_at as original
        friendship_data = {
            'user_id': user_id,
            'friend_id': friend_id,
            'created_at': original_created_at,  # Use original timestamp
            'status': 'active',
            'accepted_at': datetime.now()
        }
        doc_ref = db.collection('friendships').document()
        doc_ref.set(friendship_data)
        
        print(f"[ADD_FRIEND] Auto-accepted mutual request, created_at: {original_created_at}")
        return {"message": "Friend request accepted", "friendship_id": doc_ref.id, "status": "active"}
    
    # Create friend request with pending status
    friendship_data = {
        'user_id': user_id,
        'friend_id': friend_id,
        'created_at': datetime.now(),
        'status': 'pending'
    }
    
    doc_ref = db.collection('friendships').document()
    doc_ref.set(friendship_data)
    
    return {"message": "Friend request sent", "friendship_id": doc_ref.id, "status": "pending"}


@router.put("/users/{user_id}/friends/{friend_id}/accept")
async def accept_friend_request(user_id: str, friend_id: str):
    """Accept a friend request"""
    db = get_db()
    
    print(f"[ACCEPT_FRIEND] Accepting request: {friend_id} -> {user_id}")
    
    # Find the pending request
    requests = list(db.collection('friendships').where('user_id', '==', friend_id).where('friend_id', '==', user_id).where('status', '==', 'pending').limit(1).stream())
    
    if not requests:
        print(f"[ACCEPT_FRIEND] Error: No pending request found from {friend_id} to {user_id}")
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    doc = requests[0]
    original_data = doc.to_dict()
    original_created_at = original_data.get('created_at', datetime.now())
    accepted_at = datetime.now()
    
    # Batch update for atomic operation
    batch = db.batch()
    
    # Update original request to active
    batch.update(doc.reference, {
        'status': 'active',
        'accepted_at': accepted_at
    })
    
    # Check if reciprocal friendship already exists (any status)
    existing_reciprocal = list(db.collection('friendships').where('user_id', '==', user_id).where('friend_id', '==', friend_id).limit(1).stream())
    
    if existing_reciprocal:
        print(f"[ACCEPT_FRIEND] Updating existing reciprocal friendship")
        # Update existing reciprocal to active
        batch.update(existing_reciprocal[0].reference, {
            'status': 'active',
            'accepted_at': accepted_at
        })
    else:
        print(f"[ACCEPT_FRIEND] Creating new reciprocal friendship")
        # Create reciprocal friendship with SAME created_at as original
        reciprocal_ref = db.collection('friendships').document()
        batch.set(reciprocal_ref, {
            'user_id': user_id,
            'friend_id': friend_id,
            'created_at': original_created_at,
            'status': 'active',
            'accepted_at': accepted_at
        })
    
    # Commit all changes atomically
    batch.commit()
    
    print(f"[ACCEPT_FRIEND] Successfully accepted friend request")
    return {"message": "Friend request accepted", "status": "success"}


@router.put("/users/{user_id}/friends/{friend_id}/reject")
async def reject_friend_request(user_id: str, friend_id: str):
    """Reject a friend request"""
    db = get_db()
    
    # Find and delete the pending request
    requests = list(db.collection('friendships').where('user_id', '==', friend_id).where('friend_id', '==', user_id).where('status', '==', 'pending').limit(1).stream())
    
    if not requests:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    # Delete the request
    requests[0].reference.delete()
    
    return {"message": "Friend request rejected", "status": "success"}


@router.delete("/users/{user_id}/friends/{friend_id}")
async def remove_friend(user_id: str, friend_id: str):
    """Remove a friend or cancel friend request"""
    db = get_db()
    
    # Find and delete both directions of friendship
    friendships1 = db.collection('friendships').where('user_id', '==', user_id).where('friend_id', '==', friend_id).stream()
    friendships2 = db.collection('friendships').where('user_id', '==', friend_id).where('friend_id', '==', user_id).stream()
    
    deleted = False
    for doc in list(friendships1) + list(friendships2):
        doc.reference.delete()
        deleted = True
    
    if not deleted:
        raise HTTPException(status_code=404, detail="Friendship not found")
    
    return {"message": "Friend removed successfully"}


