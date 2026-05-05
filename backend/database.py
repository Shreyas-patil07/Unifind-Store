"""
Firebase Firestore database initialization and connection management.
"""
import firebase_admin
from firebase_admin import credentials, firestore
from functools import lru_cache
import logging
from config import settings

logger = logging.getLogger(__name__)

_db_instance = None


def init_firebase() -> firestore.Client:
    """
    Initialize Firebase Admin SDK and return Firestore client.
    This should be called once during application startup.
    
    Returns:
        firestore.Client: Initialized Firestore client
        
    Raises:
        Exception: If Firebase initialization fails
    """
    global _db_instance
    
    if _db_instance is not None:
        return _db_instance
    
    try:
        # Build credentials from environment variables
        firebase_config = {
            "type": settings.FIREBASE_TYPE,
            "project_id": settings.FIREBASE_PROJECT_ID,
            "private_key_id": settings.FIREBASE_PRIVATE_KEY_ID,
            "private_key": settings.FIREBASE_PRIVATE_KEY.replace('\\n', '\n'),
            "client_email": settings.FIREBASE_CLIENT_EMAIL,
            "client_id": settings.FIREBASE_CLIENT_ID,
            "auth_uri": settings.FIREBASE_AUTH_URI,
            "token_uri": settings.FIREBASE_TOKEN_URI,
            "auth_provider_x509_cert_url": settings.FIREBASE_AUTH_PROVIDER_CERT_URL,
            "client_x509_cert_url": settings.FIREBASE_CLIENT_CERT_URL
        }
        
        cred = credentials.Certificate(firebase_config)
        firebase_admin.initialize_app(cred)
        
        _db_instance = firestore.client()
        logger.info("Firebase initialized successfully")
        
        return _db_instance
        
    except Exception as e:
        logger.error(f"Failed to initialize Firebase: {e}")
        raise


@lru_cache()
def get_db() -> firestore.Client:
    """
    Get Firestore database instance.
    Uses caching to return the same instance across calls.
    
    Returns:
        firestore.Client: Firestore client instance
    """
    if _db_instance is None:
        raise RuntimeError("Firebase not initialized. Call init_firebase() first.")
    return _db_instance
