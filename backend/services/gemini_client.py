"""
Optimized Gemini AI client with proper async support and caching.
"""
import asyncio
import hashlib
import logging
from functools import lru_cache
from typing import Dict, List
import google.generativeai as genai
from config import settings

logger = logging.getLogger(__name__)

# In-memory cache for AI responses (production should use Redis)
_response_cache: Dict[str, str] = {}
MAX_CACHE_SIZE = 1000

# Model fallback list - will try each model in order if rate limited
MODEL_FALLBACK_LIST: List[str] = [
    "gemma-3-27b-it",
    "gemma-3-12b-it",
    "gemma-4-31b-it",
    "gemma-4-26b-a4b-it",
    "gemma-3-4b-it",
    "gemma-3n-e2b-it",
    "gemma-3-1b-it",
]

# Track current model index
_current_model_index = 0


class GeminiAPIError(Exception):
    """Raised when the AI API returns an error."""
    pass


class GeminiTimeoutError(Exception):
    """Raised when the AI API does not respond within the timeout."""
    pass


@lru_cache(maxsize=10)
def _get_configured_model(model_name: str = None):
    """Get configured Gemini model (cached)."""
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Use provided model or get from fallback list
        if model_name is None:
            model_name = MODEL_FALLBACK_LIST[_current_model_index]
        
        logger.info(f"Configuring model: {model_name}")
        
        return genai.GenerativeModel(
            model_name,
            generation_config={
                "max_output_tokens": 500,
                "temperature": 0.3,  # Lower for consistency
                "top_p": 0.8,
                "top_k": 40,
            }
        )
    except Exception as e:
        logger.error(f"Failed to configure Gemini model {model_name}: {e}")
        raise GeminiAPIError(f"Model configuration failed: {str(e)}")


def _is_rate_limit_error(error_message: str) -> bool:
    """Check if error is a rate limit error."""
    rate_limit_indicators = [
        "rate limit",
        "quota exceeded",
        "429",
        "resource exhausted",
        "too many requests"
    ]
    error_lower = str(error_message).lower()
    return any(indicator in error_lower for indicator in rate_limit_indicators)


def _switch_to_next_model() -> str:
    """Switch to the next model in the fallback list."""
    global _current_model_index
    _current_model_index = (_current_model_index + 1) % len(MODEL_FALLBACK_LIST)
    new_model = MODEL_FALLBACK_LIST[_current_model_index]
    logger.warning(f"Switching to fallback model: {new_model}")
    
    # Clear the cache to force new model configuration
    _get_configured_model.cache_clear()
    
    return new_model


def _get_cache_key(system_prompt: str, user_prompt: str) -> str:
    """Generate cache key from prompts."""
    combined = f"{system_prompt}||{user_prompt}"
    return hashlib.md5(combined.encode()).hexdigest()


def _manage_cache_size():
    """Remove oldest entries if cache is too large."""
    if len(_response_cache) > MAX_CACHE_SIZE:
        # Remove 20% of oldest entries
        to_remove = len(_response_cache) // 5
        for key in list(_response_cache.keys())[:to_remove]:
            del _response_cache[key]


async def generate_content(
    system_prompt: str, 
    user_prompt: str, 
    timeout: int = 30,
    use_cache: bool = True,
    max_retries: int = 3
) -> str:
    """
    Call Gemini API asynchronously with caching, error handling, and model fallback.
    
    Args:
        system_prompt: System instructions for the AI
        user_prompt: User query/request
        timeout: Maximum seconds to wait for response
        use_cache: Whether to use cached responses
        max_retries: Maximum number of model fallback attempts
        
    Returns:
        str: AI-generated response text
        
    Raises:
        GeminiTimeoutError: If API doesn't respond within timeout
        GeminiAPIError: On any API-level error after all retries
    """
    # Check cache first
    if use_cache:
        cache_key = _get_cache_key(system_prompt, user_prompt)
        if cache_key in _response_cache:
            logger.debug(f"Cache hit for key: {cache_key[:8]}...")
            return _response_cache[cache_key]
    
    last_error = None
    
    for attempt in range(max_retries):
        try:
            # Get model and generate content
            current_model = MODEL_FALLBACK_LIST[_current_model_index]
            model = _get_configured_model(current_model)
            combined_prompt = f"{system_prompt}\n\n{user_prompt}"
            
            logger.debug(f"Attempt {attempt + 1}/{max_retries} with model: {current_model}")
            
            # Run in thread pool to avoid blocking
            response = await asyncio.wait_for(
                asyncio.to_thread(model.generate_content, combined_prompt),
                timeout=timeout
            )
            
            if not response or not response.text:
                raise GeminiAPIError("Empty response from Gemini API")
            
            # Cache the response
            if use_cache:
                _manage_cache_size()
                _response_cache[cache_key] = response.text
                logger.debug(f"Cached response for key: {cache_key[:8]}...")
            
            return response.text
            
        except asyncio.TimeoutError:
            logger.error(f"Gemini API timeout after {timeout}s")
            raise GeminiTimeoutError(f"Gemini API did not respond within {timeout} seconds")
            
        except GeminiAPIError:
            raise
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Gemini API error on attempt {attempt + 1}: {error_msg}")
            last_error = e
            
            # Check if it's a rate limit error
            if _is_rate_limit_error(error_msg):
                if attempt < max_retries - 1:
                    new_model = _switch_to_next_model()
                    logger.info(f"Rate limit detected, switching to {new_model}")
                    continue
                else:
                    logger.error("All model fallbacks exhausted due to rate limits")
                    raise GeminiAPIError(f"Rate limit exceeded on all available models")
            else:
                # Non-rate-limit error, raise immediately
                raise GeminiAPIError(f"Unexpected error: {error_msg}")
    
    # If we get here, all retries failed
    raise GeminiAPIError(f"Failed after {max_retries} attempts. Last error: {str(last_error)}")


def clear_cache():
    """Clear the response cache. Useful for testing or memory management."""
    global _response_cache
    _response_cache.clear()
    logger.info("Gemini response cache cleared")


def get_current_model() -> str:
    """Get the currently active model name."""
    return MODEL_FALLBACK_LIST[_current_model_index]


def reset_model_index():
    """Reset to the first model in the fallback list."""
    global _current_model_index
    _current_model_index = 0
    _get_configured_model.cache_clear()
    logger.info(f"Reset to primary model: {MODEL_FALLBACK_LIST[0]}")
