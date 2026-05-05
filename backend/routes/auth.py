"""
Authentication routes for email verification.
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from database import get_db
from services.email_service import email_service
from config import settings

router = APIRouter(tags=["auth"])


class SendVerificationRequest(BaseModel):
    email: EmailStr
    firebase_uid: str


class VerifyEmailRequest(BaseModel):
    token: str


@router.post("/send-verification")
async def send_verification_email(request: SendVerificationRequest):
    """Send email verification link to user"""
    db = get_db()
    
    # Check if user exists
    users = db.collection('users').where('firebase_uid', '==', request.firebase_uid).limit(1).stream()
    user_doc = next(users, None)
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_data = user_doc.to_dict()
    
    # Check if already verified
    if user_data.get('email_verified', False):
        return {"message": "Email already verified"}
    
    # Validate email service configuration
    if not settings.GMAIL_USER or not settings.GMAIL_APP_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service not configured"
        )
    
    # Generate verification token
    token = email_service.generate_verification_token(request.email)
    
    # Create verification URL (adjust based on your frontend URL)
    frontend_url = settings.CORS_ORIGINS.split(',')[0]  # Use first CORS origin
    verification_url = f"{frontend_url}/verify-email?token={token}"
    
    # Send email
    try:
        await email_service.send_verification_email(request.email, verification_url)
        return {"message": "Verification email sent successfully"}
    except Exception as e:
        import logging
        logging.error(f"Failed to send verification email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email. Please try again later."
        )


@router.post("/verify-email")
async def verify_email(request: VerifyEmailRequest):
    """Verify email using token"""
    db = get_db()
    
    # Verify token
    email = email_service.verify_token(request.token)
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    # Find user by email and update verification status
    users = db.collection('users').where('email', '==', email).limit(1).stream()
    user_doc = next(users, None)
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_data = user_doc.to_dict()
    firebase_uid = user_data.get('firebase_uid')
    
    # Update user verification status in Firestore
    user_ref = db.collection('users').document(user_doc.id)
    user_ref.update({
        'email_verified': True
    })
    
    # Also update Firebase Auth emailVerified status
    if firebase_uid:
        try:
            from firebase_admin import auth as admin_auth
            admin_auth.update_user(firebase_uid, email_verified=True)
        except Exception as e:
            # Log error but don't fail the request
            print(f"Warning: Could not update Firebase Auth emailVerified: {e}")
    
    # Invalidate token
    email_service.invalidate_token(request.token)
    
    return {"message": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification_email(request: SendVerificationRequest):
    """Resend verification email"""
    return await send_verification_email(request)
