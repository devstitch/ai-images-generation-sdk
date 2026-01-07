/**
 * Image Processor
 * Handles image loading, conversion, resizing, and metadata extraction
 * @module processors/ImageProcessor
 */

import { readFile } from 'fs/promises';
import sharp from 'sharp';
import { ImageProcessingError, ValidationError } from '../utils/errors.js';
import { SUPPORTED_IMAGE_FORMATS } from '../utils/constants.js';
import { debug, error } from '../utils/logger.js';

/**
 * Image Processor class
 */
class ImageProcessor {
  /**
   * Load image from file path, Buffer, or base64 string
   * @param {string|Buffer} input - File path, Buffer, or base64 string
   * @returns {Promise<Buffer>} Image buffer
   * @throws {ImageProcessingError|ValidationError} If loading fails
   */
  async loadImage(input) {
    if (!input) {
      throw new ValidationError('Image input is required');
    }

    try {
      // If it's already a Buffer, return it
      if (Buffer.isBuffer(input)) {
        debug('Input is already a Buffer');
        return input;
      }

      // If it's a string, check if it's base64 or file path
      if (typeof input === 'string') {
        // Check if it's base64 (data URI or plain base64)
        if (input.startsWith('data:image/')) {
          debug('Loading image from base64 data URI');
          return this._loadFromBase64(input);
        }

        // Check if it's plain base64 string (no data URI prefix)
        if (/^[A-Za-z0-9+/=]+$/.test(input)) {
          debug('Loading image from plain base64 string');
          return Buffer.from(input, 'base64');
        }

        // Assume it's a file path
        debug('Loading image from file path:', input);
        return await this._loadFromFile(input);
      }

      throw new ValidationError(
        'Invalid input type. Expected file path (string), Buffer, or base64 string'
      );
    } catch (err) {
      if (err instanceof ValidationError || err instanceof ImageProcessingError) {
        throw err;
      }

      error('Failed to load image', err);
      throw new ImageProcessingError('Failed to load image', err);
    }
  }

  /**
   * Load image from base64 data URI
   * @private
   * @param {string} dataUri - Base64 data URI (data:image/[type];base64,[data])
   * @returns {Buffer} Image buffer
   */
  _loadFromBase64(dataUri) {
    try {
      // Extract base64 data from data URI
      const base64Match = dataUri.match(/^data:image\/[^;]+;base64,(.+)$/);
      if (!base64Match) {
        throw new ValidationError('Invalid base64 data URI format');
      }

      const base64Data = base64Match[1];
      return Buffer.from(base64Data, 'base64');
    } catch (err) {
      if (err instanceof ValidationError) {
        throw err;
      }
      throw new ImageProcessingError('Failed to parse base64 data URI', err);
    }
  }

  /**
   * Load image from file path
   * @private
   * @param {string} filePath - Path to image file
   * @returns {Promise<Buffer>} Image buffer
   */
  async _loadFromFile(filePath) {
    try {
      const buffer = await readFile(filePath);
      return buffer;
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new ImageProcessingError(`Image file not found: ${filePath}`, err);
      }
      if (err.code === 'EACCES') {
        throw new ImageProcessingError(
          `Permission denied reading file: ${filePath}`,
          err
        );
      }
      throw new ImageProcessingError(
        `Failed to read image file: ${filePath}`,
        err
      );
    }
  }

  /**
   * Convert Buffer to base64 data URI
   * @param {Buffer} buffer - Image buffer
   * @param {string} [format] - Image format (jpg, png, webp). Auto-detected if not provided
   * @returns {Promise<string>} Base64 data URI string
   * @throws {ImageProcessingError|ValidationError} If conversion fails
   */
  async convertToBase64(buffer, format = null) {
    if (!Buffer.isBuffer(buffer)) {
      throw new ValidationError('Expected Buffer for base64 conversion');
    }

    if (buffer.length === 0) {
      throw new ValidationError('Buffer is empty');
    }

    try {
      // Auto-detect format if not provided
      let imageFormat = format;
      if (!imageFormat) {
        debug('Auto-detecting image format');
        const metadata = await this.getImageMetadata(buffer);
        imageFormat = metadata.format;
      }

      // Normalize format (jpeg -> jpg)
      if (imageFormat === 'jpeg') {
        imageFormat = 'jpg';
      }

      // Validate format
      if (!SUPPORTED_IMAGE_FORMATS.includes(imageFormat)) {
        throw new ValidationError(
          `Unsupported image format: ${imageFormat}. Supported: ${SUPPORTED_IMAGE_FORMATS.join(', ')}`
        );
      }

      // Convert to base64
      const base64String = buffer.toString('base64');
      const dataUri = `data:image/${imageFormat};base64,${base64String}`;

      debug('Converted buffer to base64 data URI', { format: imageFormat });
      return dataUri;
    } catch (err) {
      if (err instanceof ValidationError || err instanceof ImageProcessingError) {
        throw err;
      }

      error('Failed to convert image to base64', err);
      throw new ImageProcessingError('Failed to convert image to base64', err);
    }
  }

  /**
   * Resize image if it's larger than maxWidth
   * @param {Buffer} buffer - Image buffer
   * @param {number} [maxWidth=1024] - Maximum width in pixels
   * @returns {Promise<Buffer>} Resized image buffer (or original if no resize needed)
   * @throws {ImageProcessingError|ValidationError} If resizing fails
   */
  async resizeIfNeeded(buffer, maxWidth = 1024) {
    if (!Buffer.isBuffer(buffer)) {
      throw new ValidationError('Expected Buffer for resizing');
    }

    if (buffer.length === 0) {
      throw new ValidationError('Buffer is empty');
    }

    if (typeof maxWidth !== 'number' || maxWidth <= 0) {
      throw new ValidationError('maxWidth must be a positive number');
    }

    try {
      // Get current image dimensions
      const metadata = await this.getImageMetadata(buffer);
      const { width, height } = metadata;

      // Check if resize is needed
      if (width <= maxWidth) {
        debug('Image does not need resizing', { width, maxWidth });
        return buffer;
      }

      // Calculate new height maintaining aspect ratio
      const aspectRatio = height / width;
      const newHeight = Math.round(maxWidth * aspectRatio);

      debug('Resizing image', {
        original: { width, height },
        new: { width: maxWidth, height: newHeight },
      });

      // Resize using sharp
      const resizedBuffer = await sharp(buffer)
        .resize(maxWidth, newHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toBuffer();

      debug('Image resized successfully');
      return resizedBuffer;
    } catch (err) {
      if (err instanceof ValidationError || err instanceof ImageProcessingError) {
        throw err;
      }

      error('Failed to resize image', err);
      throw new ImageProcessingError('Failed to resize image', err);
    }
  }

  /**
   * Get image metadata
   * @param {Buffer} buffer - Image buffer
   * @returns {Promise<Object>} Image metadata object
   * @throws {ImageProcessingError|ValidationError} If metadata extraction fails
   */
  async getImageMetadata(buffer) {
    if (!Buffer.isBuffer(buffer)) {
      throw new ValidationError('Expected Buffer for metadata extraction');
    }

    if (buffer.length === 0) {
      throw new ValidationError('Buffer is empty');
    }

    try {
      const sharpInstance = sharp(buffer);
      const metadata = await sharpInstance.metadata();

      const result = {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
        size: buffer.length,
        channels: metadata.channels || null,
        hasAlpha: metadata.hasAlpha || false,
        orientation: metadata.orientation || null,
      };

      // Normalize format (jpeg -> jpg)
      if (result.format === 'jpeg') {
        result.format = 'jpg';
      }

      debug('Image metadata extracted', {
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.size,
      });

      return result;
    } catch (err) {
      if (err instanceof ValidationError || err instanceof ImageProcessingError) {
        throw err;
      }

      error('Failed to extract image metadata', err);
      throw new ImageProcessingError('Failed to extract image metadata', err);
    }
  }
}

// Export singleton instance
export default new ImageProcessor();

