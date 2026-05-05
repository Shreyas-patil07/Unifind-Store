"""
Rate limiting implementation using slowapi.
OWASP A05: Security Misconfiguration - Rate Limiting
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
import logging

logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200/minute"],
    storage_uri="memory://",
    strategy="fixed-window"
)

# Rate limit decorators for different endpoint types
GLOBAL_LIMIT = "200/minute"
AUTH_LIMIT = "10/minute"
UPLOAD_LIMIT = "5/minute"
AI_LIMIT = "3/12hour"  # Need Board AI searches

def get_user_identifier(request: Request) -> str:
    """
    Get user identifier for rate limiting.
    Uses user_id if authenticated, otherwise IP address.
    """
    # Try to get user_id from request state (set by auth middleware)
    user_id = getattr(request.state, "user_id", None)
    if user_id:
        return f"user:{user_id}"
    
    # Fallback to IP address
    return f"ip:{get_remote_address(request)}"
