/**
 * Mock Images for Testing
 * Sample base64 encoded test images and invalid data
 * @module tests/mocks/mockImages
 */

/**
 * Small test image (1x1 pixel PNG) - minimal size for testing
 */
export const SMALL_TEST_IMAGE = {
  base64:
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  width: 1,
  height: 1,
  format: 'png',
  size: 95, // bytes
  description: '1x1 pixel PNG - minimal test image',
};

/**
 * Medium test image (100x100 pixel PNG) - typical test size
 */
export const MEDIUM_TEST_IMAGE = {
  base64:
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  width: 100,
  height: 100,
  format: 'png',
  size: 95, // bytes (placeholder - actual would be larger)
  description: '100x100 pixel PNG - typical test size',
};

/**
 * Large test image (1024x1024 pixel PNG) - full size test
 */
export const LARGE_TEST_IMAGE = {
  base64:
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  width: 1024,
  height: 1024,
  format: 'png',
  size: 95, // bytes (placeholder - actual would be much larger)
  description: '1024x1024 pixel PNG - full size test',
};

/**
 * JPEG test image (small JPEG)
 */
export const JPEG_TEST_IMAGE = {
  base64:
    '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==',
  dataUri: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==',
  width: 1,
  height: 1,
  format: 'jpg',
  size: 200, // bytes
  description: '1x1 pixel JPEG - minimal JPEG test',
};

/**
 * Invalid image data - not a valid image format
 */
export const INVALID_IMAGE_DATA = {
  base64: 'dGhpcyBpcyBub3QgYW4gaW1hZ2U=',
  dataUri: 'data:text/plain;base64,dGhpcyBpcyBub3QgYW4gaW1hZ2U=',
  description: 'Invalid image - plain text base64 encoded',
  error: 'Not a valid image format',
};

/**
 * Empty image data
 */
export const EMPTY_IMAGE_DATA = {
  base64: '',
  dataUri: 'data:image/png;base64,',
  description: 'Empty image data',
  error: 'Empty image buffer',
};

/**
 * Oversized image data (simulated - larger than MAX_IMAGE_SIZE)
 * Note: This is a placeholder - actual oversized data would be much larger
 */
export const OVERSIZED_IMAGE_DATA = {
  base64: 'A'.repeat(6 * 1024 * 1024), // 6MB of 'A' characters
  dataUri: `data:image/png;base64,${'A'.repeat(6 * 1024 * 1024)}`,
  size: 6 * 1024 * 1024, // 6MB
  description: 'Oversized image - exceeds MAX_IMAGE_SIZE (5MB)',
  error: 'Image size exceeds maximum allowed size',
};

/**
 * Generated design image (mock output from AI)
 */
export const GENERATED_DESIGN_IMAGE = {
  base64:
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  dataUri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  width: 1024,
  height: 1024,
  format: 'png',
  size: 95,
  description: 'Mock generated design image - simulates AI output',
};

/**
 * Get a test image by name
 * @param {string} name - Image name (small, medium, large, jpeg, invalid, empty, oversized, generated)
 * @returns {Object|null} Test image object or null if not found
 */
export function getTestImage(name) {
  const images = {
    small: SMALL_TEST_IMAGE,
    medium: MEDIUM_TEST_IMAGE,
    large: LARGE_TEST_IMAGE,
    jpeg: JPEG_TEST_IMAGE,
    invalid: INVALID_IMAGE_DATA,
    empty: EMPTY_IMAGE_DATA,
    oversized: OVERSIZED_IMAGE_DATA,
    generated: GENERATED_DESIGN_IMAGE,
  };

  return images[name.toLowerCase()] || null;
}

/**
 * Get all test images
 * @returns {Object} Object with all test images
 */
export function getAllTestImages() {
  return {
    small: SMALL_TEST_IMAGE,
    medium: MEDIUM_TEST_IMAGE,
    large: LARGE_TEST_IMAGE,
    jpeg: JPEG_TEST_IMAGE,
    invalid: INVALID_IMAGE_DATA,
    empty: EMPTY_IMAGE_DATA,
    oversized: OVERSIZED_IMAGE_DATA,
    generated: GENERATED_DESIGN_IMAGE,
  };
}

