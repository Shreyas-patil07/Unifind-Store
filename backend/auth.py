"""
Authentication middleware for Firebase ID token verification.
"""
import logging
from typing import Optional
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
from functools import wraps

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer(auto_error=False)


async def verify_firebase_token(request: Request) -> str:
    """
    Verify Firebase ID token from Authorization header and extract user ID.
    
    Args:
        request: FastAPI request object
        
    Returns:
        str: User ID extracted from the verified token
        
    Raises:
        HTTPException: 401 if token is invalid or missing
    """
    # Extract Authorization header
    auth_header = request.headers.get("Authorization")
    
    if not auth_header:
        logger.warning("Missing Authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token"
        )
    
    # Parse Bearer token
    if not auth_header.startswith("Bearer "):
        logger.warning("Invalid Authorization header format")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token format"
        )
    
    token = auth_header.split("Bearer ")[1].strip()
    
    if not token:
        logger.warning("Empty token in Authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token"
        )
    
    try:
        # Verify the Firebase ID token
        decoded_token = auth.verify_id_token(token)
        user_id = decoded_token.get("uid")
        
        if not user_id:
            logger.error("Token verified but no uid found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID"
            )
        
        logger.debug(f"Token verified for user: {user_id}")
        return user_id
        
    except HTTPException:
        # Re-raise HTTPExceptions (like the missing uid case above)
        raise
    except auth.ExpiredIdTokenError as e:
        logger.warning(f"Expired ID token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired"
        )
    except auth.RevokedIdTokenError as e:
        logger.warning(f"Revoked ID token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has been revoked"
        )
    except auth.InvalidIdTokenError as e:
        logger.warning(f"Invalid ID token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    except Exception as e:
        logger.error(f"Unexpected error verifying token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to verify authentication token"
        )


async def get_current_user(request: Request) -> str:
    """
    Dependency function to get current authenticated user ID.
    
    Usage in route:
        @router.get("/protected")
        async def protected_route(user_id: str = Depends(get_current_user)):
            return {"user_id": user_id}
    
    Args:
        request: FastAPI request object
        
    Returns:
        str: Authenticated user ID
        
    Raises:
        HTTPException: 401 if authentication fails
    """
    return await verify_firebase_token(request)


async def get_optional_user(request: Request) -> Optional[str]:
    """
    Dependency function to get current user ID if authenticated, None otherwise.
    Use for endpoints that work with or without authentication.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Optional[str]: User ID if authenticated, None otherwise
    """
    try:
        return await verify_firebase_token(request)
    except HTTPException:
        return None
