"""
Simple in-memory cache with TTL for frequently accessed data.
Production should use Redis, but this reduces load immediately.
"""
import time
from typing import Any, Optional
from functools import wraps
import logging

logger = logging.getLogger(__name__)

# Cache storage: {key: (value, expiry_time)}
_cache = {}
_cache_hits = 0
_cache_misses = 0

# Default TTLs (in seconds)
DEFAULT_TTL = 300  # 5 minutes
USER_PROFILE_TTL = 3600  # 1 hour
PRODUCT_LIST_TTL = 60  # 1 minute
SELLER_INFO_TTL = 1800  # 30 minutes


def get(key: str) -> Optional[Any]:
    """Get value from cache if not expired."""
    global _cache_hits, _cache_misses
    
    if key not in _cache:
        _cache_misses += 1
        return None
    
    value, expiry = _cache[key]
    
    if time.time() > expiry:
        # Expired, remove it
        del _cache[key]
        _cache_misses += 1
        return None
    
    _cache_hits += 1
    return value


def set(key: str, value: Any, ttl: int = DEFAULT_TTL):
    """Set value in cache with TTL."""
    expiry = time.time() + ttl
    _cache[key] = (value, expiry)


def delete(key: str):
    """Delete key from cache."""
    if key in _cache:
        del _cache[key]


def delete_pattern(pattern: str):
    """Delete all keys matching pattern (simple prefix match)."""
    keys_to_delete = [k for k in _cache.keys() if k.startswith(pattern)]
    for key in keys_to_delete:
        del _cache[key]


def clear():
    """Clear entire cache."""
    global _cache, _cache_hits, _cache_misses
    _cache = {}
    _cache_hits = 0
    _cache_misses = 0


def get_stats():
    """Get cache statistics."""
    total = _cache_hits + _cache_misses
    hit_rate = (_cache_hits / total * 100) if total > 0 else 0
    
    return {
        'size': len(_cache),
        'hits': _cache_hits,
        'misses': _cache_misses,
        'hit_rate': f"{hit_rate:.1f}%"
    }


def cached(ttl: int = DEFAULT_TTL, key_prefix: str = ""):
    """
    Decorator to cache function results.
    
    Usage:
        @cached(ttl=300, key_prefix="user_profile")
        def get_user_profile(user_id):
            # expensive operation
            return profile
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Build cache key from function name and arguments
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            cached_value = get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache HIT: {cache_key}")
                return cached_value
            
            # Cache miss, call function
            logger.debug(f"Cache MISS: {cache_key}")
            result = func(*args, **kwargs)
            
            # Store in cache
            set(cache_key, result, ttl)
            
            return result
        
        return wrapper
    return decorator


# Cleanup old entries periodically
def cleanup_expired():
    """Remove expired entries from cache."""
    current_time = time.time()
    expired_keys = [
        key for key, (_, expiry) in _cache.items()
        if current_time > expiry
    ]
    
    for key in expired_keys:
        del _cache[key]
    
    if expired_keys:
        logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")
