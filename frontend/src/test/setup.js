/**
 * Test setup file for Vitest
 * Configures global test environment and mocks
 */

import { vi, beforeEach } from 'vitest';

// Mock environment variables using vi.stubEnv
beforeEach(() => {
  vi.stubEnv('VITE_CLOUDINARY_CLOUD_NAME', 'test-cloud-name');
  vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
});

// Mock canvas for image compression tests
class MockCanvasRenderingContext2D {
  drawImage() {}
  getImageData() {
    return { data: new Uint8ClampedArray(4) };
  }
}

class MockHTMLCanvasElement {
  constructor() {
    this.width = 0;
    this.height = 0;
  }

  getContext(contextType) {
    if (contextType === '2d') {
      return new MockCanvasRenderingContext2D();
    }
    return null;
  }

  toBlob(callback, type, quality) {
    // Simulate successful blob creation
    const blob = new Blob(['mock-image-data'], { type: type || 'image/jpeg' });
    setTimeout(() => callback(blob), 0);
  }

  toDataURL() {
    return 'data:image/jpeg;base64,mock-data';
  }
}

// Mock document.createElement for canvas
const originalCreateElement = document.createElement.bind(document);
document.createElement = (tagName) => {
  if (tagName === 'canvas') {
    return new MockHTMLCanvasElement();
  }
  return originalCreateElement(tagName);
};

// Mock FileReader
global.FileReader = class MockFileReader {
  readAsDataURL(file) {
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,mock-data';
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 0);
  }
};

// Mock Image
global.Image = class MockImage {
  constructor() {
    this.width = 1920;
    this.height = 1080;
  }

  set src(value) {
    this._src = value;
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }

  get src() {
    return this._src;
  }
};

// Mock fetch for Cloudinary API calls
global.fetch = vi.fn();
