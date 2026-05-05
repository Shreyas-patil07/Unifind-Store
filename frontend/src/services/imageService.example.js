/**
 * Example usage of ImageService.uploadMultiple()
 * 
 * This demonstrates how to use the parallel upload feature
 * for uploading multiple product images concurrently.
 */

import imageService from './imageService.js';

/**
 * Example 1: Upload multiple product images
 */
async function uploadProductImages(files) {
  try {
    console.log(`Uploading ${files.length} images in parallel...`);
    
    // Upload all images concurrently
    const imageUrls = await imageService.uploadMultiple(files, 'product');
    
    console.log(`Successfully uploaded ${imageUrls.length} images`);
    console.log('Image URLs:', imageUrls);
    
    return imageUrls;
  } catch (error) {
    console.error('Upload failed:', error.message);
    throw error;
  }
}

/**
 * Example 2: Handle partial failures gracefully
 */
async function uploadWithGracefulFailure(files) {
  try {
    // Even if some uploads fail, successful ones are returned
    const imageUrls = await imageService.uploadMultiple(files, 'product');
    
    if (imageUrls.length === 0) {
      throw new Error('All uploads failed');
    }
    
    if (imageUrls.length < files.length) {
      console.warn(`Only ${imageUrls.length} of ${files.length} images uploaded successfully`);
    }
    
    return imageUrls;
  } catch (error) {
    console.error('Upload error:', error.message);
    throw error;
  }
}

/**
 * Example 3: Use in a product form submission
 */
async function handleProductFormSubmit(formData, imageFiles) {
  try {
    // Step 1: Upload images in parallel
    const imageUrls = await imageService.uploadMultiple(imageFiles, 'product');
    
    if (imageUrls.length === 0) {
      throw new Error('Failed to upload any images');
    }
    
    // Step 2: Create product with image URLs
    const productData = {
      ...formData,
      images: imageUrls,
    };
    
    // Step 3: Submit to backend API
    // const response = await api.post('/products', productData);
    
    console.log('Product created with images:', productData);
    return productData;
  } catch (error) {
    console.error('Product creation failed:', error.message);
    throw error;
  }
}

/**
 * Example 4: Upload with progress tracking
 */
async function uploadWithProgress(files, onProgress) {
  const total = files.length;
  let completed = 0;
  
  // Create upload promises with progress tracking
  const uploadPromises = files.map(async (file, index) => {
    try {
      const url = await imageService.upload(file, 'product');
      completed++;
      onProgress(completed, total);
      return url;
    } catch (error) {
      console.error(`File ${index + 1} failed:`, error.message);
      completed++;
      onProgress(completed, total);
      return null;
    }
  });
  
  // Wait for all uploads
  const results = await Promise.all(uploadPromises);
  
  // Filter out failed uploads (null values)
  return results.filter(url => url !== null);
}

// Export examples
export {
  uploadProductImages,
  uploadWithGracefulFailure,
  handleProductFormSubmit,
  uploadWithProgress,
};
