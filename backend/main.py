"""
UNIFIND Backend API - FastAPI Application
Production-ready with comprehensive security hardening.
"""
import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from slowapi.errors import RateLimitExceeded
from config import settings
from database import init_firebase
from routes import products, users, chats, reviews, need_board, uploads, auth, needs, transactions
from security.headers import SecurityHeadersMiddleware
from security.rate_limiter import limiter, _rate_limit_exceeded_handler

# Configure structured logging
logging.basicConfig(
    level=logging.INFO if settings.ENVIRONMENT == "production" else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Security: Never log sensitive data
class SensitiveDataFilter(logging.Filter):
    """Filter to scrub sensitive data from logs."""
    SENSITIVE_PATTERNS = [
        'password', 'token', 'api_key', 'secret', 'authorization',
        'credit_card', 'ssn', 'private_key'
    ]
    
    def filter(self, record):
        message = record.getMessage().lower()
        for pattern in self.SENSITIVE_PATTERNS:
            if pattern in message:
                record.msg = "[REDACTED - Sensitive Data]"
                record.args = ()
        return True

# Add filter to all loggers
for handler in logging.root.handlers:
    handler.addFilter(SensitiveDataFilter())


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown events."""
    # Startup
    logger.info("Starting UNIFIND API...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    
    try:
        init_firebase()
        logger.info("Firebase initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        raise
    
    # Validate security configuration
    if settings.ENVIRONMENT == "production":
        if "*" in settings.CORS_ORIGINS:
            raise ValueError("CORS wildcard (*) not allowed in production")
        if not settings.CORS_ORIGINS.startswith("https://"):
            logger.warning("Production CORS origins should use HTTPS")
    
    yield
    
    # Shutdown
    logger.info("Shutting down UNIFIND API...")


# Initialize FastAPI app
app = FastAPI(
    title="UNIFIND API",
    description="College marketplace platform API with AI-powered matching",
    version="2.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# Add rate limiter state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security Headers Middleware (MUST be first)
app.add_middleware(SecurityHeadersMiddleware)

# CORS Configuration - Strict in production
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]
logger.info(f"CORS ORIGINS CONFIGURED: {origins}")

# Validate CORS configuration
if settings.ENVIRONMENT == "production":
    for origin in origins:
        if not origin.startswith("https://"):
            logger.warning(f"Non-HTTPS origin in production: {origin}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin"],
    expose_headers=["Content-Length", "Content-Type"],
    max_age=3600,
)

# GZip Compression - compress responses > 1KB
app.add_middleware(GZipMiddleware, minimum_size=1000)


# Security: Request logging middleware (DO NOT log request bodies)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Log all requests with method, path, status code, and duration.
    SECURITY: Never log request bodies (may contain passwords/tokens).
    """
    start_time = time.time()
    
    # Get client IP (considering proxy headers)
    client_ip = request.client.host if request.client else "unknown"
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
    
    # Log request (without body)
    logger.info(f"→ {request.method} {request.url.path} from {client_ip}")
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Add cache headers for GET requests
    if request.method == "GET" and response.status_code == 200:
        # Cache for 5 minutes for most GET requests
        response.headers["Cache-Control"] = "public, max-age=300"
    
    # Log response
    log_level = logging.INFO
    if response.status_code >= 500:
        log_level = logging.ERROR
    elif response.status_code >= 400:
        log_level = logging.WARNING
    
    logger.log(
        log_level,
        f"← {request.method} {request.url.path} "
        f"[{response.status_code}] {duration:.3f}s"
    )
    
    # Log authentication failures for security monitoring
    if response.status_code == 401:
        logger.warning(f"Authentication failure: {request.method} {request.url.path} from {client_ip}")
    elif response.status_code == 403:
        logger.warning(f"Authorization failure: {request.method} {request.url.path} from {client_ip}")
    
    return response


# Global exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle validation errors with detailed messages.
    SECURITY: Don't expose internal validation details in production.
    """
    logger.warning(f"Validation error on {request.url}: {exc.errors()}")
    
    if settings.ENVIRONMENT == "production":
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "Validation Error",
                "detail": "Invalid request data"
            }
        )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "detail": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Handle unexpected errors gracefully.
    SECURITY: Never expose stack traces or internal errors in production.
    """
    logger.error(f"Unexpected error on {request.url}: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "detail": "An unexpected error occurred. Please try again later."
        }
    )


# Include routers with /api prefix (standard)
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(products.router, prefix="/api", tags=["products"])
app.include_router(uploads.router, prefix="/api", tags=["uploads"])
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(chats.router, prefix="/api", tags=["chats"])
app.include_router(reviews.router, prefix="/api", tags=["reviews"])
app.include_router(need_board.router, prefix="/api", tags=["need-board"])
app.include_router(needs.router, prefix="/api", tags=["needs"])
app.include_router(transactions.router, prefix="/api", tags=["transactions"])

# Include routers without /api prefix (fallback for misconfigured clients)
app.include_router(auth.router, prefix="/auth", tags=["auth-fallback"])
app.include_router(products.router, tags=["products-fallback"])
app.include_router(uploads.router, tags=["uploads-fallback"])
app.include_router(users.router, tags=["users-fallback"])
app.include_router(chats.router, tags=["chats-fallback"])
app.include_router(reviews.router, tags=["reviews-fallback"])
app.include_router(need_board.router, tags=["need-board-fallback"])
app.include_router(needs.router, tags=["needs-fallback"])
app.include_router(transactions.router, tags=["transactions-fallback"])


# Health check endpoints
@app.get("/")
@app.head("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "UNIFIND API",
        "version": "2.1.0",
        "status": "ok",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs" if settings.ENVIRONMENT != "production" else "disabled"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and load balancers."""
    return {
        "status": "ok",
        "version": "2.1.0"
    }


@app.get("/api/health")
async def api_health_check():
    """API health check endpoint for monitoring."""
    return {
        "status": "ok",
        "version": "2.1.0",
        "environment": settings.ENVIRONMENT
    }


@app.get("/api/ready")
async def readiness_check():
    """Readiness check for load balancers."""
    try:
        from database import get_db
        db = get_db()
        # Simple check to verify Firebase connection
        _ = db.collection("_health_check").limit(1).get()
        return {"status": "ready"}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not ready", "error": "Service unavailable"}
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info" if settings.ENVIRONMENT == "production" else "debug"
    )
