"""
Security headers middleware.
OWASP A05: Security Misconfiguration - Security Headers
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from config import settings
import logging

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        
        # Get frontend URL for CSP
        origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]
        self.frontend_url = origins[0] if origins else "http://localhost:3000"
    
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        
        # Strict-Transport-Security (HSTS)
        response.headers["Strict-Transport-Security"] = (
            "max-age=63072000; includeSubDomains; preload"
        )
        
        # X-Content-Type-Options
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # X-Frame-Options
        response.headers["X-Frame-Options"] = "DENY"
        
        # Referrer-Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions-Policy
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )
        
        # Content-Security-Policy
        csp_directives = [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",  # Tailwind requires unsafe-inline
            "img-src 'self' data: https: blob:",
            f"connect-src 'self' {self.frontend_url} https://firebasestorage.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
            "font-src 'self' data:",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
            "upgrade-insecure-requests"
        ]
        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)
        
        # Remove Server header
        if "server" in response.headers:
            del response.headers["server"]
        if "Server" in response.headers:
            del response.headers["Server"]
        
        # X-XSS-Protection (legacy but still useful)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        return response
