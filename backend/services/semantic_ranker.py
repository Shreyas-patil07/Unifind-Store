"""
Optimized semantic ranking service for matching products to user intent.
"""
import json
import re
import logging
from typing import List, Dict
from services.gemini_client import generate_content, GeminiAPIError

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a product matching AI for a student marketplace.
Rank products by match quality (0-100 scale).

RULES:
1. Return ONLY a JSON array
2. No markdown, no explanations
3. Rank ALL products provided
4. Higher score = better match"""


async def rank_listings(query: str, intent: Dict, listings: List[Dict]) -> List[Dict]:
    """
    Rank product listings against user query and intent.
    
    Args:
        query: Original user query
        intent: Extracted intent dictionary
        listings: List of product listings to rank
        
    Returns:
        List[Dict]: Ranked results with id, match_score, reason
        Sorted by match_score descending
        
    Raises:
        ValueError: If ranking fails
        GeminiAPIError: If AI API fails
    """
    if not listings:
        return []
    
    try:
        # Optimize: Send only essential fields to reduce tokens
        simplified_listings = [
            {
                "id": listing["id"],
                "title": listing["title"],
                "category": listing.get("category", ""),
                "price": listing.get("price", 0),
                "condition": listing.get("condition", ""),
                "description": listing.get("description", "")[:80]  # Limit to 80 chars
            }
            for listing in listings[:20]  # Limit to top 20 to save tokens
        ]
        
        # Optimize: Simplify intent
        simplified_intent = {
            "category": intent.get("category", ""),
            "subject": intent.get("subject", ""),
            "max_price": intent.get("max_price"),
            "condition": intent.get("condition", "")
        }
        
        user_prompt = _build_ranking_prompt(query, simplified_intent, simplified_listings)
        raw_response = await generate_content(SYSTEM_PROMPT, user_prompt, timeout=25)
        
        results = _parse_json_array(raw_response)
        results = _apply_defaults(results)
        
        # Sort by match_score descending
        results.sort(key=lambda x: x.get("match_score", 0), reverse=True)
        
        logger.info(f"Ranked {len(results)} listings")
        return results
        
    except GeminiAPIError:
        logger.error("Gemini API error during ranking")
        raise
    except Exception as e:
        logger.error(f"Ranking failed: {e}")
        raise ValueError(f"Failed to rank listings: {str(e)}")


def _build_ranking_prompt(query: str, intent: Dict, listings: List[Dict]) -> str:
    """Build optimized ranking prompt."""
    # Truncate query to save tokens
    query = query[:150] if len(query) > 150 else query
    
    intent_json = json.dumps(intent, ensure_ascii=False)
    listings_json = json.dumps(listings, ensure_ascii=False)
    
    return (
        f"QUERY: {query}\n"
        f"INTENT: {intent_json}\n"
        f"PRODUCTS: {listings_json}\n\n"
        "Rank products by match quality:\n"
        "- 90-100: Perfect match\n"
        "- 70-89: Good match\n"
        "- 50-69: Decent match\n"
        "- 30-49: Weak match\n"
        "- 0-29: Poor match\n\n"
        "Return JSON array:\n"
        '[{"id": "1", "match_score": 85, "reason": "brief explanation"}, ...]\n\n'
        "Return ONLY the JSON array with ALL products."
    )


def _parse_json_array(text: str) -> List[Dict]:
    """
    Parse JSON array from AI response.
    
    Args:
        text: Raw AI response
        
    Returns:
        list: Parsed JSON array
        
    Raises:
        ValueError: If array cannot be extracted
    """
    # Try direct parse
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
    except json.JSONDecodeError:
        pass

    # Extract array substring
    match = re.search(r"\[.*\]", text, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group())
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            pass

    logger.error(f"Failed to parse JSON array from: {text[:200]}")
    raise ValueError("Could not extract valid JSON array from AI response")


def _apply_defaults(results: List[Dict]) -> List[Dict]:
    """Apply default values for missing fields."""
    for item in results:
        if "match_score" not in item or item["match_score"] is None:
            item["match_score"] = 0
        if "reason" not in item or not item["reason"]:
            item["reason"] = "No reason provided"
        # Ensure match_score is int
        item["match_score"] = int(item["match_score"])
    
    return results
