// Utility functions for managing recently viewed products

const RECENTLY_VIEWED_KEY = 'unifind_recently_viewed';
const MAX_RECENT_ITEMS = 10;

export const addToRecentlyViewed = (product) => {
  try {
    const existing = getRecentlyViewedIds();
    
    // Remove if already exists to avoid duplicates
    const filtered = existing.filter(id => id !== product.id);
    
    // Add to beginning (store only IDs)
    const updated = [product.id, ...filtered].slice(0, MAX_RECENT_ITEMS);
    
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving to recently viewed:', error);
  }
};

export const getRecentlyViewedIds = () => {
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const data = stored ? JSON.parse(stored) : [];
    
    // Handle migration from old format (array of objects) to new format (array of IDs)
    if (data.length > 0 && typeof data[0] === 'object') {
      const ids = data.map(item => item.id);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids));
      return ids;
    }
    
    return data;
  } catch (error) {
    console.error('Error reading recently viewed:', error);
    return [];
  }
};

// Deprecated: kept for backward compatibility
export const getRecentlyViewed = () => {
  return getRecentlyViewedIds();
};

export const clearRecentlyViewed = () => {
  try {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  } catch (error) {
    console.error('Error clearing recently viewed:', error);
  }
};
