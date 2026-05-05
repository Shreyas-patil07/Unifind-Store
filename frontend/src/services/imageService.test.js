/**
 * Unit Tests for imageService.js
 * 
 * Tests cover:
 * - Image compression with mock canvas
 * - File validation (size, type)
 * - Cloudinary URL optimization
 * - Thumbnail/medium URL generation
 * - Parallel upload with mocked Cloudinary API
 * 
 * Requirements: 3.1, 3.2, 3.6, 3.7, 3.8, 8.3, 8.4, 8.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import imageService from './imageService';

describe('ImageService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Reset fetch mock
    global.fetch = vi.fn();
  });

  describe('File Validation', () => {
    it('should accept valid JPEG files', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      expect(() => imageService.validateFile(file)).not.toThrow();
    });

    it('should accept valid PNG files', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      expect(() => imageService.validateFile(file)).not.toThrow();
    });

    it('should accept valid WebP files', () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });
      expect(() => imageService.validateFile(file)).not.toThrow();
    });

    it('should reject invalid file types', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      expect(() => imageService.validateFile(file)).toThrow(
        'Only JPEG, PNG, and WebP images are supported'
      );
    });

    it('should reject files larger than 5MB', () => {
      // Create a file larger than 5MB
      const largeData = new Array(6 * 1024 * 1024).fill('a').join('');
      const file = new File([largeData], 'large.jpg', { type: 'image/jpeg' });
      
      expect(() => imageService.validateFile(file)).toThrow(
        'Image must be less than 5MB'
      );
    });

    it('should accept files exactly at 5MB limit', () => {
      // Create a file exactly 5MB
      const data = new Array(5 * 1024 * 1024).fill('a').join('');
      const file = new File([data], 'exact.jpg', { type: 'image/jpeg' });
      
      expect(() => imageService.validateFile(file)).not.toThrow();
    });

    it('should handle case-insensitive file types', () => {
      const file = new File(['test'], 'test.JPG', { type: 'image/JPEG' });
      expect(() => imageService.validateFile(file)).not.toThrow();
    });
  });

  describe('Image Compression', () => {
    it('should compress image successfully', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      const compressed = await imageService.compressImage(file);
      
      expect(compressed).toBeInstanceOf(File);
      expect(compressed.type).toBe('image/jpeg');
      expect(compressed.name).toBe('test.jpg');
    });

    it('should handle compression errors gracefully', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock FileReader to fail
      const originalFileReader = global.FileReader;
      global.FileReader = class {
        readAsDataURL() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Read failed'));
            }
          }, 0);
        }
      };
      
      await expect(imageService.compressImage(file)).rejects.toThrow('Failed to read file');
      
      // Restore FileReader
      global.FileReader = originalFileReader;
    });

    it('should handle image load errors', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock Image to fail loading
      const originalImage = global.Image;
      global.Image = class {
        set src(value) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Load failed'));
            }
          }, 0);
        }
      };
      
      await expect(imageService.compressImage(file)).rejects.toThrow('Failed to load image');
      
      // Restore Image
      global.Image = originalImage;
    });

    it('should resize images larger than MAX_DIMENSION', async () => {
      const file = new File(['test'], 'large.jpg', { type: 'image/jpeg' });
      
      // Mock Image with large dimensions
      const originalImage = global.Image;
      global.Image = class {
        constructor() {
          this.width = 3840; // 4K width
          this.height = 2160; // 4K height
        }
        set src(value) {
          setTimeout(() => {
            if (this.onload) {
              this.onload();
            }
          }, 0);
        }
      };
      
      const compressed = await imageService.compressImage(file);
      
      expect(compressed).toBeInstanceOf(File);
      
      // Restore Image
      global.Image = originalImage;
    });

    it('should handle canvas toBlob failure', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock canvas toBlob to return null
      const originalCreateElement = document.createElement;
      document.createElement = (tagName) => {
        if (tagName === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: () => ({
              drawImage: () => {},
            }),
            toBlob: (callback) => {
              setTimeout(() => callback(null), 0);
            },
          };
        }
        return originalCreateElement.call(document, tagName);
      };
      
      await expect(imageService.compressImage(file)).rejects.toThrow('Failed to compress image');
      
      // Restore createElement
      document.createElement = originalCreateElement;
    });
  });

  describe('Cloudinary URL Optimization', () => {
    it('should optimize Cloudinary URLs with specified width', () => {
      const url = 'https://res.cloudinary.com/test/image/upload/v1234/sample.jpg';
      const optimized = imageService.optimizeUrl(url, 800);
      
      expect(optimized).toBe(
        'https://res.cloudinary.com/test/image/upload/f_auto,q_auto:good,w_800,c_limit/v1234/sample.jpg'
      );
    });

    it('should use default width of 800 if not specified', () => {
      const url = 'https://res.cloudinary.com/test/image/upload/v1234/sample.jpg';
      const optimized = imageService.optimizeUrl(url);
      
      expect(optimized).toContain('w_800');
    });

    it('should return original URL if not a Cloudinary URL', () => {
      const url = 'https://example.com/image.jpg';
      const optimized = imageService.optimizeUrl(url, 800);
      
      expect(optimized).toBe(url);
    });

    it('should return original URL if URL is null or undefined', () => {
      expect(imageService.optimizeUrl(null, 800)).toBeNull();
      expect(imageService.optimizeUrl(undefined, 800)).toBeUndefined();
    });

    it('should handle URLs with existing transformations', () => {
      const url = 'https://res.cloudinary.com/test/image/upload/v1234/sample.jpg';
      const optimized = imageService.optimizeUrl(url, 400);
      
      expect(optimized).toContain('w_400');
      expect(optimized).toContain('f_auto');
      expect(optimized).toContain('q_auto:good');
      expect(optimized).toContain('c_limit');
    });
  });

  describe('Thumbnail URL Generation', () => {
    it('should generate thumbnail URL with 200px width', () => {
      const url = 'https://res.cloudinary.com/test/image/upload/v1234/sample.jpg';
      const thumbnail = imageService.getThumbnailUrl(url);
      
      expect(thumbnail).toContain('w_200');
      expect(thumbnail).toContain('f_auto');
      expect(thumbnail).toContain('q_auto:good');
    });

    it('should return original URL for non-Cloudinary URLs', () => {
      const url = 'https://example.com/image.jpg';
      const thumbnail = imageService.getThumbnailUrl(url);
      
      expect(thumbnail).toBe(url);
    });
  });

  describe('Medium URL Generation', () => {
    it('should generate medium URL with 800px width', () => {
      const url = 'https://res.cloudinary.com/test/image/upload/v1234/sample.jpg';
      const medium = imageService.getMediumUrl(url);
      
      expect(medium).toContain('w_800');
      expect(medium).toContain('f_auto');
      expect(medium).toContain('q_auto:good');
    });

    it('should return original URL for non-Cloudinary URLs', () => {
      const url = 'https://example.com/image.jpg';
      const medium = imageService.getMediumUrl(url);
      
      expect(medium).toBe(url);
    });
  });

  describe('Cloudinary Upload', () => {
    it('should upload to Cloudinary successfully', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockUrl = 'https://res.cloudinary.com/test/image/upload/v1234/sample.jpg';
      
      // Mock successful fetch response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ secure_url: mockUrl }),
      });
      
      const url = await imageService.uploadToCloudinary(file);
      
      expect(url).toBe(mockUrl);
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      // Verify fetch was called with correct URL pattern
      const fetchCall = global.fetch.mock.calls[0];
      expect(fetchCall[0]).toContain('/image/upload');
      expect(fetchCall[0]).toMatch(/cloudinary\.com/);
    });

    it('should throw error if cloud name is not configured', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Temporarily remove cloud name
      vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', '');
      
      // The error is wrapped in the catch block
      await expect(imageService.uploadToCloudinary(file)).rejects.toThrow(
        'Failed to upload to Cloudinary'
      );
      
      // Restore cloud name
      vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'test-cloud-name');
    });

    it('should throw error if upload fails', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock failed fetch response
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });
      
      await expect(imageService.uploadToCloudinary(file)).rejects.toThrow(
        'Failed to upload to Cloudinary'
      );
    });

    it('should throw error if network request fails', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock network error
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      await expect(imageService.uploadToCloudinary(file)).rejects.toThrow(
        'Failed to upload to Cloudinary'
      );
    });

    it('should include correct form data in upload request', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockUrl = 'https://res.cloudinary.com/test/image/upload/v1234/sample.jpg';
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ secure_url: mockUrl }),
      });
      
      await imageService.uploadToCloudinary(file);
      
      const fetchCall = global.fetch.mock.calls[0];
      const formData = fetchCall[1].body;
      
      expect(formData).toBeInstanceOf(FormData);
    });
  });

  describe('Parallel Upload', () => {
    it('should upload multiple files in parallel', async () => {
      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
      const file3 = new File(['test3'], 'test3.jpg', { type: 'image/jpeg' });
      
      const mockUrl1 = 'https://res.cloudinary.com/test/image/upload/v1234/sample1.jpg';
      const mockUrl2 = 'https://res.cloudinary.com/test/image/upload/v1234/sample2.jpg';
      const mockUrl3 = 'https://res.cloudinary.com/test/image/upload/v1234/sample3.jpg';
      
      // Mock successful responses for all uploads
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ secure_url: mockUrl1 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ secure_url: mockUrl2 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ secure_url: mockUrl3 }),
        });
      
      const urls = await imageService.uploadMultiple([file1, file2, file3], 'product');
      
      expect(urls).toHaveLength(3);
      expect(urls).toContain(mockUrl1);
      expect(urls).toContain(mockUrl2);
      expect(urls).toContain(mockUrl3);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should handle individual upload failures gracefully', async () => {
      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
      const file3 = new File(['test3'], 'test3.jpg', { type: 'image/jpeg' });
      
      const mockUrl1 = 'https://res.cloudinary.com/test/image/upload/v1234/sample1.jpg';
      const mockUrl3 = 'https://res.cloudinary.com/test/image/upload/v1234/sample3.jpg';
      
      // Mock: first succeeds, second fails, third succeeds
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ secure_url: mockUrl1 }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ secure_url: mockUrl3 }),
        });
      
      const urls = await imageService.uploadMultiple([file1, file2, file3], 'product');
      
      // Should return only successful uploads
      expect(urls).toHaveLength(2);
      expect(urls).toContain(mockUrl1);
      expect(urls).toContain(mockUrl3);
      expect(urls).not.toContain(undefined);
    });

    it('should throw error if files array is empty', async () => {
      await expect(imageService.uploadMultiple([], 'product')).rejects.toThrow(
        'Files must be a non-empty array'
      );
    });

    it('should throw error if files is not an array', async () => {
      await expect(imageService.uploadMultiple(null, 'product')).rejects.toThrow(
        'Files must be a non-empty array'
      );
    });

    it('should return empty array if all uploads fail', async () => {
      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
      
      // Mock all uploads to fail
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
        });
      
      const urls = await imageService.uploadMultiple([file1, file2], 'product');
      
      expect(urls).toHaveLength(0);
    });

    it('should handle validation errors in parallel uploads', async () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const invalidFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      const mockUrl = 'https://res.cloudinary.com/test/image/upload/v1234/sample.jpg';
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ secure_url: mockUrl }),
      });
      
      const urls = await imageService.uploadMultiple([validFile, invalidFile], 'product');
      
      // Should only return URL for valid file
      expect(urls).toHaveLength(1);
      expect(urls[0]).toBe(mockUrl);
    });
  });

  describe('Upload Method Routing', () => {
    it('should route to Cloudinary for product type', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockUrl = 'https://res.cloudinary.com/test/image/upload/v1234/sample.jpg';
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ secure_url: mockUrl }),
      });
      
      const url = await imageService.upload(file, 'product');
      
      expect(url).toBe(mockUrl);
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should default to product type if not specified', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockUrl = 'https://res.cloudinary.com/test/image/upload/v1234/sample.jpg';
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ secure_url: mockUrl }),
      });
      
      const url = await imageService.upload(file);
      
      expect(url).toBe(mockUrl);
    });

    it('should validate file before upload', async () => {
      const invalidFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      await expect(imageService.upload(invalidFile, 'product')).rejects.toThrow(
        'Only JPEG, PNG, and WebP images are supported'
      );
      
      // Fetch should not be called
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small files', async () => {
      const tinyFile = new File(['x'], 'tiny.jpg', { type: 'image/jpeg' });
      
      const compressed = await imageService.compressImage(tinyFile);
      
      expect(compressed).toBeInstanceOf(File);
    });

    it('should handle files with special characters in name', () => {
      const file = new File(['test'], 'test image (1).jpg', { type: 'image/jpeg' });
      
      expect(() => imageService.validateFile(file)).not.toThrow();
    });

    it('should handle concurrent uploads correctly', async () => {
      const file1 = new File(['test1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['test2'], 'test2.jpg', { type: 'image/jpeg' });
      
      const mockUrl1 = 'https://res.cloudinary.com/test/image/upload/v1234/sample1.jpg';
      const mockUrl2 = 'https://res.cloudinary.com/test/image/upload/v1234/sample2.jpg';
      
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ secure_url: mockUrl1 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ secure_url: mockUrl2 }),
        });
      
      // Start both uploads concurrently
      const [url1, url2] = await Promise.all([
        imageService.upload(file1, 'product'),
        imageService.upload(file2, 'product'),
      ]);
      
      expect(url1).toBe(mockUrl1);
      expect(url2).toBe(mockUrl2);
    });
  });
});
