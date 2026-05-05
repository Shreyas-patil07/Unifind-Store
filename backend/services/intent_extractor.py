"""
Optimized intent extraction service for AI Need Board.
Extracts structured data from natural language queries.
"""
import json
import re
import logging
from typing import Dict
from services.gemini_client import generate_content, GeminiAPIError

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a precise data extraction AI for a student marketplace. 
Extract structured information from queries and return ONLY valid JSON.

RULES:
1. Return ONLY a JSON object, no other text
2. Do NOT use markdown code blocks
3. Extract information accurately"""

REQUIRED_KEYS = {"category", "subject", "semester", "max_price", "condition", "intent_summary"}


def _build_user_prompt(query: str) -> str:
    """Build optimized user prompt for intent extraction."""
    # Truncate very long queries to save tokens
    query = query[:300] if len(query) > 300 else query
    
    return (
        "Extract data from this query and return JSON:\n\n"
        f"QUERY: {query}\n\n"
        "OUTPUT FORMAT (JSON only):\n"
        "{\n"
        '  "category": "Electronics|Books|Stationery|Furniture|Clothing|Sports|Other",\n'
        '  "subject": "specific item name",\n'
        '  "semester": "1-8 or Not specified",\n'
        '  "max_price": number or null,\n'
        '  "condition": "New|Like New|Good|Fair|Any",\n'
        '  "intent_summary": "brief summary"\n'
        "}\n\n"
        "CATEGORY MAPPING:\n"
        "- laptop/phone/calculator → Electronics\n"
        "- textbook/novel/notes → Books\n"
        "- pen/notebook → Stationery\n"
        "- desk/chair → Furniture\n\n"
        "Return ONLY the JSON object."
    )


def _parse_json(text: str) -> Dict:
    """
    Parse JSON from AI response with fallback extraction.
    
    Args:
        text: Raw AI response text
        
    Returns:
        dict: Parsed JSON object
        
    Raises:
        ValueError: If JSON cannot be extracted
    """
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Extract JSON substring
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    logger.error(f"Failed to parse JSON from: {text[:200]}")
    raise ValueError("Could not extract valid JSON from AI response")


def _apply_defaults(parsed: Dict) -> Dict:
    """Apply default values for missing or None fields."""
    defaults = {
        "category": "Other",
        "subject": "Not specified",
        "semester": "Not specified",
        "max_price": None,
        "condition": "Any",
        "intent_summary": "User query"
    }
    
    for key, default_value in defaults.items():
        if key not in parsed or parsed[key] is None:
            parsed[key] = default_value
    
    return parsed


async def extract_intent(query: str) -> Dict:
    """
    Extract structured intent from natural language query.
    
    Args:
        query: Natural language query from user
        
    Returns:
        dict: Structured intent with keys:
            - category: Product category
            - subject: Specific item
            - semester: Academic semester (if applicable)
            - max_price: Maximum price (if specified)
            - condition: Desired condition
            - intent_summary: Brief summary
            
    Raises:
        ValueError: If intent cannot be extracted
        GeminiAPIError: If AI API fails
    """
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")
    
    try:
        user_prompt = _build_user_prompt(query)
        raw_response = await generate_content(SYSTEM_PROMPT, user_prompt, timeout=20)
        
        parsed = _parse_json(raw_response)
        parsed = _apply_defaults(parsed)
        
        logger.info(f"Extracted intent: {parsed.get('category')} - {parsed.get('subject')}")
        return parsed
        
    except GeminiAPIError:
        logger.error("Gemini API error during intent extraction")
        raise
    except Exception as e:
        logger.error(f"Intent extraction failed: {e}")
        raise ValueError(f"Failed to extract intent: {str(e)}")
