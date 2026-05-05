"""
Need Matching Engine - Fast keyword-based matching for needs and listings.
Production-ready with efficient scoring algorithm.
"""
import re
from typing import List, Dict, Set
import logging

logger = logging.getLogger(__name__)

# Common stopwords to ignore
STOPWORDS = {
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'of', 'at', 'by', 'for', 'with',
    'about', 'against', 'between', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
    'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
    'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'i', 'need', 'want',
    'looking', 'buy', 'sell'
}


def normalize_text(text: str) -> str:
    """Normalize text: lowercase, remove special chars."""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def extract_keywords(text: str) -> Set[str]:
    """Extract meaningful keywords from text."""
    normalized = normalize_text(text)
    words = normalized.split()
    keywords = {w for w in words if w not in STOPWORDS and len(w) > 2}
    return keywords


def calculate_match_score(
    need_keywords: Set[str],
    need_tags: List[str],
    need_category: str,
    listing_title: str,
    listing_description: str,
    listing_tags: List[str],
    listing_category: str,
    listing_price: float,
    need_price_range: Dict[str, float] = None
) -> int:
    """
    Calculate match score (0-100) between a need and a listing.
    
    Scoring breakdown:
    - Category match: 30 points
    - Tag overlap: 25 points
    - Keyword overlap: 30 points
    - Price match: 15 points
    """
    score = 0
    
    # Category match (30 points)
    if need_category.lower() == listing_category.lower():
        score += 30
    
    # Tag overlap (25 points)
    need_tags_set = {t.lower() for t in need_tags}
    listing_tags_set = {t.lower() for t in listing_tags}
    tag_overlap = len(need_tags_set & listing_tags_set)
    if need_tags_set:
        tag_score = min(25, (tag_overlap / len(need_tags_set)) * 25)
        score += int(tag_score)
    
    # Keyword overlap (30 points)
    listing_keywords = extract_keywords(f"{listing_title} {listing_description}")
    keyword_overlap = len(need_keywords & listing_keywords)
    if need_keywords:
        keyword_score = min(30, (keyword_overlap / len(need_keywords)) * 30)
        score += int(keyword_score)
    
    # Price match (15 points)
    if need_price_range and listing_price:
        min_price = need_price_range.get('min', 0)
        max_price = need_price_range.get('max', float('inf'))
        if min_price <= listing_price <= max_price:
            score += 15
        elif listing_price < max_price * 1.2:  # Within 20% of max
            score += 8
    
    return min(100, score)


def match_need_to_listings(
    need: Dict,
    listings: List[Dict],
    limit: int = 10
) -> List[Dict]:
    """
    Match a need to relevant listings.
    
    Args:
        need: Need object with title, category, tags, price_range
        listings: List of listing objects
        limit: Maximum number of results to return
    
    Returns:
        List of matched listings with scores, sorted by relevance
    """
    need_keywords = extract_keywords(need.get('title', ''))
    need_tags = need.get('tags', [])
    need_category = need.get('category', '')
    need_price_range = need.get('price_range')
    
    matches = []
    
    for listing in listings:
        score = calculate_match_score(
            need_keywords=need_keywords,
            need_tags=need_tags,
            need_category=need_category,
            listing_title=listing.get('title', ''),
            listing_description=listing.get('description', ''),
            listing_tags=listing.get('tags', []),
            listing_category=listing.get('category', ''),
            listing_price=listing.get('price', 0),
            need_price_range=need_price_range
        )
        
        if score >= 30:  # Minimum threshold
            matches.append({
                'id': listing.get('id'),
                'match_score': score,
                'title': listing.get('title'),
                'price': listing.get('price'),
                'images': listing.get('images', []),
                'reason': _generate_match_reason(score, need_category, listing.get('category'))
            })
    
    # Sort by score descending
    matches.sort(key=lambda x: x['match_score'], reverse=True)
    
    return matches[:limit]


def match_need_to_sellers(
    need: Dict,
    sellers: List[Dict],
    limit: int = 20
) -> List[str]:
    """
    Find sellers who might be able to fulfill a need.
    
    Args:
        need: Need object with category, tags
        sellers: List of seller objects with their listings
        limit: Maximum number of sellers to return
    
    Returns:
        List of seller user IDs, sorted by relevance
    """
    need_keywords = extract_keywords(need.get('title', ''))
    need_tags_set = {t.lower() for t in need.get('tags', [])}
    need_category = need.get('category', '').lower()
    
    seller_scores = []
    
    for seller in sellers:
        seller_id = seller.get('user_id')
        listings = seller.get('listings', [])
        
        if not listings:
            continue
        
        # Calculate aggregate score across all seller's listings
        total_score = 0
        category_matches = 0
        
        for listing in listings:
            listing_category = listing.get('category', '').lower()
            listing_tags = {t.lower() for t in listing.get('tags', [])}
            listing_keywords = extract_keywords(
                f"{listing.get('title', '')} {listing.get('description', '')}"
            )
            
            # Category match
            if need_category == listing_category:
                category_matches += 1
                total_score += 30
            
            # Tag overlap
            tag_overlap = len(need_tags_set & listing_tags)
            if need_tags_set:
                total_score += (tag_overlap / len(need_tags_set)) * 20
            
            # Keyword overlap
            keyword_overlap = len(need_keywords & listing_keywords)
            if need_keywords:
                total_score += (keyword_overlap / len(need_keywords)) * 10
        
        if total_score > 0:
            # Normalize by number of listings (but favor sellers with more relevant items)
            avg_score = total_score / len(listings)
            bonus = min(20, category_matches * 5)  # Bonus for multiple category matches
            final_score = avg_score + bonus
            
            seller_scores.append({
                'user_id': seller_id,
                'score': final_score
            })
    
    # Sort by score descending
    seller_scores.sort(key=lambda x: x['score'], reverse=True)
    
    return [s['user_id'] for s in seller_scores[:limit]]


def rank_needs_for_seller(
    seller_listings: List[Dict],
    needs: List[Dict],
    limit: int = 10
) -> List[Dict]:
    """
    Rank needs by relevance to a seller's listings.
    
    Args:
        seller_listings: List of seller's active listings
        needs: List of open needs
        limit: Maximum number of needs to return
    
    Returns:
        List of needs with relevance scores, sorted by relevance
    """
    if not seller_listings:
        return []
    
    # Extract seller's categories and keywords
    seller_categories = {l.get('category', '').lower() for l in seller_listings}
    seller_keywords = set()
    seller_tags = set()
    
    for listing in seller_listings:
        seller_keywords.update(extract_keywords(
            f"{listing.get('title', '')} {listing.get('description', '')}"
        ))
        seller_tags.update({t.lower() for t in listing.get('tags', [])})
    
    ranked_needs = []
    
    for need in needs:
        need_category = need.get('category', '').lower()
        need_keywords = extract_keywords(need.get('title', ''))
        need_tags = {t.lower() for t in need.get('tags', [])}
        
        score = 0
        
        # Category match (40 points)
        if need_category in seller_categories:
            score += 40
        
        # Tag overlap (30 points)
        tag_overlap = len(need_tags & seller_tags)
        if need_tags:
            score += int((tag_overlap / len(need_tags)) * 30)
        
        # Keyword overlap (30 points)
        keyword_overlap = len(need_keywords & seller_keywords)
        if need_keywords:
            score += int((keyword_overlap / len(need_keywords)) * 30)
        
        if score >= 30:  # Minimum threshold
            ranked_needs.append({
                **need,
                'relevance_score': score
            })
    
    # Sort by score descending
    ranked_needs.sort(key=lambda x: x['relevance_score'], reverse=True)
    
    return ranked_needs[:limit]


def _generate_match_reason(score: int, need_category: str, listing_category: str) -> str:
    """Generate human-readable match reason."""
    if score >= 80:
        return f"Excellent match! This {listing_category} item closely matches your requirements."
    elif score >= 60:
        return f"Good match in the {listing_category} category with relevant features."
    elif score >= 40:
        return f"Potential match - this {listing_category} item has some relevant features."
    else:
        return f"Partial match in {listing_category} category."

