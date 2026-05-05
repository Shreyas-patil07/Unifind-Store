from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from datetime import datetime, timezone
from google.cloud.firestore import Increment
from database import get_db
from models import Message, MessageCreate, ChatRoom
from auth import get_current_user

router = APIRouter()


@router.post("/chats/messages", response_model=Message)
async def send_message(message: MessageCreate, authenticated_user: str = Depends(get_current_user)):
    """Send a message and create/update chat room"""
    db = get_db()
    
    # SECURITY: Verify sender_id matches authenticated user
    if message.sender_id != authenticated_user:
        raise HTTPException(status_code=403, detail="Cannot send message as another user")
    
    # Find or create chat room
    chat_room_id = f"{min(message.sender_id, message.receiver_id)}_{max(message.sender_id, message.receiver_id)}"
    if message.product_id:
        chat_room_id += f"_{message.product_id}"
    
    print(f"[SEND_MESSAGE] Generated chat_room_id: {chat_room_id}")
    print(f"[SEND_MESSAGE] Message: sender={message.sender_id}, receiver={message.receiver_id}, product={message.product_id}")
    
    chat_room_ref = db.collection('chat_rooms').document(chat_room_id)
    chat_room = chat_room_ref.get()
    
    if not chat_room.exists:
        # Create new chat room
        chat_room_data = {
            'user1_id': min(message.sender_id, message.receiver_id),
            'user2_id': max(message.sender_id, message.receiver_id),
            'product_id': message.product_id,
            'last_message': message.text,
            'last_message_time': datetime.now(timezone.utc),
            'unread_count_user1': 1 if message.receiver_id == min(message.sender_id, message.receiver_id) else 0,
            'unread_count_user2': 1 if message.receiver_id == max(message.sender_id, message.receiver_id) else 0,
            'created_at': datetime.now(timezone.utc)
        }
        chat_room_ref.set(chat_room_data)
        print(f"[SEND_MESSAGE] Created new chat room: {chat_room_id}")
    else:
        # Update existing chat room with ATOMIC increment
        chat_data = chat_room.to_dict()
        unread_field = 'unread_count_user1' if message.receiver_id == chat_data['user1_id'] else 'unread_count_user2'
        chat_room_ref.update({
            'last_message': message.text,
            'last_message_time': datetime.now(timezone.utc),
            unread_field: Increment(1)  # Atomic increment - no race condition
        })
        print(f"[SEND_MESSAGE] Updated existing chat room: {chat_room_id}")
    
    # Create message with chat_room_id
    message_data = message.model_dump()
    message_data['timestamp'] = datetime.now(timezone.utc)
    message_data['is_read'] = False
    message_data['chat_room_id'] = chat_room_id
    
    print(f"[SEND_MESSAGE] Message data to store: {message_data}")
    
    # Add message to messages collection
    message_ref = db.collection('messages').document()
    message_ref.set(message_data)
    
    message_data['id'] = message_ref.id
    print(f"[SEND_MESSAGE] Created message with id: {message_ref.id}, chat_room_id: {chat_room_id}")
    
    return message_data


@router.get("/chats/{user_id}", response_model=List[ChatRoom])
async def get_user_chats(user_id: str, friends_only: bool = False, authenticated_user: str = Depends(get_current_user)):
    """Get all chat rooms for a user, optionally filtered to friends only"""
    db = get_db()
    
    # SECURITY: Verify user can only access their own chats
    if user_id != authenticated_user:
        raise HTTPException(status_code=403, detail="Cannot access other user's chats")
    
    print(f"[CHATS] Getting chats for user {user_id}, friends_only={friends_only}")
    
    # Get chat rooms where user is either user1 or user2
    chats1 = db.collection('chat_rooms').where('user1_id', '==', user_id).stream()
    chats2 = db.collection('chat_rooms').where('user2_id', '==', user_id).stream()
    
    chat_rooms = []
    
    # Load all friendships once (optimization - avoid N+1 queries)
    friend_ids = set()
    friendships = db.collection('friendships').where('user_id', '==', user_id).where('status', '==', 'active').stream()
    for friendship in friendships:
        friend_data = friendship.to_dict()
        friend_ids.add(friend_data.get('friend_id'))
    print(f"[CHATS] Found {len(friend_ids)} friends: {friend_ids}")
    
    for doc in list(chats1) + list(chats2):
        chat_data = doc.to_dict()
        chat_data['id'] = doc.id
        
        # Get the other user's ID
        other_user_id = chat_data['user2_id'] if chat_data['user1_id'] == user_id else chat_data['user1_id']
        
        print(f"[CHATS] Processing chat with user {other_user_id}")
        
        # Check if other user is a friend (optimized - single set lookup)
        is_friend = other_user_id in friend_ids
        print(f"[CHATS]   is_friend={is_friend}")
        
        # If friends_only filter is on, skip non-friends
        if friends_only and not is_friend:
            print(f"[CHATS]   Skipping non-friend")
            continue
        
        chat_data['is_friend'] = is_friend
        chat_rooms.append(chat_data)
        print(f"[CHATS]   Added to results")
    
    print(f"[CHATS] Returning {len(chat_rooms)} chats")
    
    # Sort by last message time
    chat_rooms.sort(key=lambda x: x.get('last_message_time', datetime.min), reverse=True)
    
    return chat_rooms


@router.get("/chats/room/{chat_room_id}/messages", response_model=List[Message])
async def get_chat_messages(chat_room_id: str, authenticated_user: str = Depends(get_current_user)):
    """Get all messages in a chat room"""
    db = get_db()
    
    print(f"[GET_MESSAGES] Fetching messages for chat_room_id: {chat_room_id}")
    
    # SECURITY: Verify user is a participant in this chat room
    chat_room_ref = db.collection('chat_rooms').document(chat_room_id)
    chat_room = chat_room_ref.get()
    
    if not chat_room.exists:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    chat_data = chat_room.to_dict()
    
    # Check if authenticated user is either user1 or user2
    if authenticated_user not in [chat_data.get('user1_id'), chat_data.get('user2_id')]:
        raise HTTPException(status_code=403, detail="Not authorized to view this chat")
    
    messages = []
    for doc in db.collection('messages').where('chat_room_id', '==', chat_room_id).stream():
        message_data = doc.to_dict()
        message_data['id'] = doc.id
        messages.append(message_data)
    
    # Sort by timestamp in Python instead of Firestore to avoid index requirement
    messages.sort(key=lambda x: x.get('timestamp', datetime.min))
    
    print(f"[GET_MESSAGES] Found {len(messages)} messages for chat_room_id: {chat_room_id}")
    
    return messages


@router.get("/chats/between/{user1_id}/{user2_id}")
async def get_or_create_chat_room(user1_id: str, user2_id: str, product_id: str = None, authenticated_user: str = Depends(get_current_user)):
    """Get or create a chat room between two users"""
    db = get_db()
    
    # SECURITY: Verify authenticated user is one of the participants
    if authenticated_user not in [user1_id, user2_id]:
        raise HTTPException(status_code=403, detail="Cannot create/access chat room for other users")
    
    # Generate consistent chat room ID
    chat_room_id = f"{min(user1_id, user2_id)}_{max(user1_id, user2_id)}"
    if product_id:
        chat_room_id += f"_{product_id}"
    
    chat_room_ref = db.collection('chat_rooms').document(chat_room_id)
    chat_room = chat_room_ref.get()
    
    if not chat_room.exists:
        # Create new chat room
        chat_room_data = {
            'user1_id': min(user1_id, user2_id),
            'user2_id': max(user1_id, user2_id),
            'product_id': product_id,
            'last_message': '',
            'last_message_time': datetime.now(timezone.utc),
            'unread_count_user1': 0,
            'unread_count_user2': 0,
            'created_at': datetime.now(timezone.utc)
        }
        chat_room_ref.set(chat_room_data)
        chat_room_data['id'] = chat_room_id
        return chat_room_data
    
    chat_data = chat_room.to_dict()
    chat_data['id'] = chat_room_id
    return chat_data


@router.put("/chats/{chat_room_id}/mark-read/{user_id}")
async def mark_messages_read(chat_room_id: str, user_id: str, authenticated_user: str = Depends(get_current_user)):
    """Mark all messages in a chat room as read for a user"""
    db = get_db()
    
    # SECURITY: Verify user can only mark their own messages as read
    if user_id != authenticated_user:
        raise HTTPException(status_code=403, detail="Cannot mark messages as read for another user")
    
    chat_room_ref = db.collection('chat_rooms').document(chat_room_id)
    chat_room = chat_room_ref.get()
    
    if not chat_room.exists:
        raise HTTPException(status_code=404, detail="Chat room not found")
    
    chat_data = chat_room.to_dict()
    
    # SECURITY: Verify user is a participant
    if user_id not in [chat_data.get('user1_id'), chat_data.get('user2_id')]:
        raise HTTPException(status_code=403, detail="Not authorized to access this chat")
    
    unread_field = 'unread_count_user1' if user_id == chat_data['user1_id'] else 'unread_count_user2'
    
    # Reset unread count in chat room
    chat_room_ref.update({unread_field: 0})
    
    # Mark all messages in this chat room as read where user is the receiver
    messages_query = db.collection('messages').where('chat_room_id', '==', chat_room_id).where('receiver_id', '==', user_id).where('is_read', '==', False)
    
    batch = db.batch()
    messages_to_update = messages_query.stream()
    
    for msg_doc in messages_to_update:
        batch.update(msg_doc.reference, {'is_read': True})
    
    batch.commit()
    
    return {"message": "Messages marked as read", "chat_room_id": chat_room_id}


@router.put("/chats/messages/{message_id}/read")
async def mark_single_message_read(message_id: str, user_data: Dict[str, Any]):
    """Mark a single message as read"""
    db = get_db()
    user_id = user_data.get('user_id')
    
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    # Get the message
    message_ref = db.collection('messages').document(message_id)
    message_doc = message_ref.get()
    
    if not message_doc.exists:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message_data = message_doc.to_dict()
    
    # Only mark as read if the user is the receiver and it's not already read
    if message_data.get('receiver_id') != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to mark this message as read")
    
    if message_data.get('is_read'):
        return {"message": "Message already marked as read", "message_id": message_id}
    
    # Mark message as read
    message_ref.update({'is_read': True})
    
    # Decrement unread count in chat room
    chat_room_id = message_data.get('chat_room_id')
    if chat_room_id:
        chat_room_ref = db.collection('chat_rooms').document(chat_room_id)
        chat_room = chat_room_ref.get()
        
        if chat_room.exists:
            chat_data = chat_room.to_dict()
            unread_field = 'unread_count_user1' if user_id == chat_data['user1_id'] else 'unread_count_user2'
            current_count = chat_data.get(unread_field, 0)
            
            if current_count > 0:
                chat_room_ref.update({unread_field: current_count - 1})
    
    return {"message": "Message marked as read", "message_id": message_id}

