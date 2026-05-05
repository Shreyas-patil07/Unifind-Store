/**
 * Utility functions for managing liked products
 */

/**
 * Get all liked product IDs for a user
 * @param {string} userId - The user's ID
 * @returns {string[]} Array of product IDs
 */
export const getLikedProducts = (userId) => {
  if (!userId) return [];
  const liked = localStorage.getItem(`liked_products_${userId}`);
  return liked ? JSON.parse(liked) : [];
};

/**
 * Check if a product is liked by a user
 * @param {string} userId - The user's ID
 * @param {string} productId - The product's ID
 * @returns {boolean} True if liked
 */
export const isProductLiked = (userId, productId) => {
  const likedProducts = getLikedProducts(userId);
  return likedProducts.includes(productId);
};

/**
 * Add a product to liked list
 * @param {string} userId - The user's ID
 * @param {string} productId - The product's ID
 */
export const likeProduct = (userId, productId) => {
  if (!userId || !productId) return;
  const likedProducts = getLikedProducts(userId);
  if (!likedProducts.includes(productId)) {
    likedProducts.push(productId);
    localStorage.setItem(`liked_products_${userId}`, JSON.stringify(likedProducts));
  }
};

/**
 * Remove a product from liked list
 * @param {string} userId - The user's ID
 * @param {string} productId - The product's ID
 */
export const unlikeProduct = (userId, productId) => {
  if (!userId || !productId) return;
  const likedProducts = getLikedProducts(userId);
  const updated = likedProducts.filter(id => id !== productId);
  localStorage.setItem(`liked_products_${userId}`, JSON.stringify(updated));
};

/**
 * Clear all liked products for a user
 * @param {string} userId - The user's ID
 */
export const clearLikedProducts = (userId) => {
  if (!userId) return;
  localStorage.removeItem(`liked_products_${userId}`);
};
