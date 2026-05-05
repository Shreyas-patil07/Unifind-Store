/**
 * Utility functions for tracking product views
 * Prevents duplicate view tracking using localStorage
 */

const VIEWED_PRODUCTS_KEY = 'unifind_viewed_products';

/**
 * Get all viewed product IDs for current user/session
 * @returns {string[]} Array of product IDs
 */
export const getViewedProducts = () => {
  try {
    const viewed = localStorage.getItem(VIEWED_PRODUCTS_KEY);
    return viewed ? JSON.parse(viewed) : [];
  } catch (error) {
    console.error('Error reading viewed products:', error);
    return [];
  }
};

/**
 * Check if a product has been viewed in this session
 * @param {string} productId - The product's ID
 * @returns {boolean} True if already viewed
 */
export const hasViewedProduct = (productId) => {
  const viewedProducts = getViewedProducts();
  return viewedProducts.includes(productId);
};

/**
 * Mark a product as viewed
 * @param {string} productId - The product's ID
 */
export const markProductAsViewed = (productId) => {
  if (!productId) return;
  
  try {
    const viewedProducts = getViewedProducts();
    
    if (!viewedProducts.includes(productId)) {
      viewedProducts.push(productId);
      localStorage.setItem(VIEWED_PRODUCTS_KEY, JSON.stringify(viewedProducts));
      return true; // New view
    }
    
    return false; // Already viewed
  } catch (error) {
    console.error('Error marking product as viewed:', error);
    return false;
  }
};

/**
 * Clear all viewed products (useful for testing or logout)
 */
export const clearViewedProducts = () => {
  try {
    localStorage.removeItem(VIEWED_PRODUCTS_KEY);
  } catch (error) {
    console.error('Error clearing viewed products:', error);
  }
};
