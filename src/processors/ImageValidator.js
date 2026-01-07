/**
 * Image Validator
 * Validates image inputs, formats, sizes, and configurations
 * @module processors/ImageValidator
 */

import { readFile, stat } from 'fs/promises';
import { extname } from 'path';
import { ValidationError, ConfigurationError } from '../utils/errors.js';
import {
  SUPPORTED_IMAGE_FORMATS,
  MAX_IMAGE_SIZE,
} from '../utils/constants.js';
import { debug, warn } from '../utils/logger.js';

/**
 * Image input types
 */
export const INPUT_TYPES = {
  FILE_PATH: 'file_path',
  BUFFER: 'buffer',
  BASE64: 'base64',
};

/**
 * Image file signatures (magic numbers)
 */
const IMAGE_SIGNATURES = {
  jpg: [
    [0xff, 0xd8, 0xff, 0xe0],
    [0xff, 0xd8, 0xff, 0xe1],
    [0xff, 0xd8, 0xff, 0xdb],
  ],
  jpeg: [
    [0xff, 0xd8, 0xff, 0xe0],
    [0xff, 0xd8, 0xff, 0xe1],
    [0xff, 0xd8, 0xff, 0xdb],
  ],
  png: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  webp: [
    [0x52, 0x49, 0x46, 0x46], // RIFF
  ],
};

/**
 * Validate image input and determine its type
 * @param {string|Buffer|Object} input - Image input (file path, buffer, or base64)
 * @returns {Promise<Object>} Normalized input with type and data
 * @throws {ValidationError} If input is invalid
 */
export async function validateImageInput(input) {
  if (!input) {
    throw new ValidationError('Image input is required');
  }

  // Check if it's a file path (string that's not base64)
  if (typeof input === 'string') {
    // Check if it's base64
    if (input.startsWith('data:image/') || /^[A-Za-z0-9+/=]+$/.test(input)) {
      debug('Detected base64 input');
      return {
        type: INPUT_TYPES.BASE64,
        data: input,
      };
    }

    // Assume it's a file path
    debug('Detected file path input:', input);
    try {
      const stats = await stat(input);
      if (!stats.isFile()) {
        throw new ValidationError(`Path is not a file: ${input}`);
      }
      return {
        type: INPUT_TYPES.FILE_PATH,
        data: input,
      };
    } catch (err) {
      if (err instanceof ValidationError) {
        throw err;
      }
      throw new ValidationError(`File not found or inaccessible: ${input}`, err);
    }
  }

  // Check if it's a Buffer
  if (Buffer.isBuffer(input)) {
    debug('Detected buffer input');
    return {
      type: INPUT_TYPES.BUFFER,
      data: input,
    };
  }

  throw new ValidationError(
    'Invalid input type. Expected file path (string), Buffer, or base64 string'
  );
}

/**
 * Validate image format by file extension or buffer signature
 * @param {string|Buffer} filePathOrBuffer - File path or buffer
 * @returns {Promise<string>} Detected format (jpg, png, webp)
 * @throws {ValidationError} If format is invalid or unsupported
 */
export async function validateImageFormat(filePathOrBuffer) {
  let format = null;
  let buffer = null;

  // If it's a file path, read it
  if (typeof filePathOrBuffer === 'string') {
    try {
      buffer = await readFile(filePathOrBuffer);
      // Get format from extension as fallback
      const ext = extname(filePathOrBuffer).toLowerCase().slice(1);
      if (SUPPORTED_IMAGE_FORMATS.includes(ext)) {
        format = ext === 'jpeg' ? 'jpg' : ext;
      }
    } catch (err) {
      throw new ValidationError(
        `Failed to read file: ${filePathOrBuffer}`,
        err
      );
    }
  } else if (Buffer.isBuffer(filePathOrBuffer)) {
    buffer = filePathOrBuffer;
  } else {
    throw new ValidationError(
      'Invalid input: expected file path (string) or Buffer'
    );
  }

  // Validate buffer signature (magic numbers)
  const detectedFormat = _detectFormatFromBuffer(buffer);

  if (detectedFormat) {
    debug('Format detected from buffer signature:', detectedFormat);
    return detectedFormat;
  }

  // If we have format from extension, use it
  if (format) {
    warn(
      `Could not verify format from buffer signature, using extension: ${format}`
    );
    return format;
  }

  // No format detected
  throw new ValidationError(
    `Unsupported image format. Supported formats: ${SUPPORTED_IMAGE_FORMATS.join(', ')}`
  );
}

/**
 * Detect image format from buffer signature
 * @private
 * @param {Buffer} buffer - Image buffer
 * @returns {string|null} Detected format or null
 */
function _detectFormatFromBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 8) {
    return null;
  }

  // Check PNG
  const pngSignature = IMAGE_SIGNATURES.png[0];
  if (_matchesSignature(buffer, pngSignature)) {
    return 'png';
  }

  // Check JPEG
  const jpegSignatures = IMAGE_SIGNATURES.jpg;
  for (const sig of jpegSignatures) {
    if (_matchesSignature(buffer, sig)) {
      return 'jpg';
    }
  }

  // Check WebP (RIFF...WEBP)
  const webpSignature = IMAGE_SIGNATURES.webp[0];
  if (_matchesSignature(buffer, webpSignature, 0)) {
    // Check for WEBP at position 8
    if (buffer.length >= 12) {
      const webpString = buffer.slice(8, 12).toString('ascii');
      if (webpString === 'WEBP') {
        return 'webp';
      }
    }
  }

  return null;
}

/**
 * Check if buffer matches signature at start
 * @private
 * @param {Buffer} buffer - Buffer to check
 * @param {Array<number>} signature - Signature bytes
 * @param {number} offset - Offset to start checking
 * @returns {boolean} True if matches
 */
function _matchesSignature(buffer, signature, offset = 0) {
  if (buffer.length < signature.length + offset) {
    return false;
  }

  for (let i = 0; i < signature.length; i++) {
    if (buffer[i + offset] !== signature[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Validate image size
 * @param {Buffer} buffer - Image buffer
 * @throws {ValidationError} If image is too large
 * @returns {number} Image size in bytes
 */
export function validateImageSize(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new ValidationError('Expected Buffer for size validation');
  }

  const size = buffer.length;

  if (size === 0) {
    throw new ValidationError('Image buffer is empty');
  }

  if (size > MAX_IMAGE_SIZE) {
    const maxSizeMB = (MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(2);
    const actualSizeMB = (size / (1024 * 1024)).toFixed(2);
    throw new ValidationError(
      `Image size (${actualSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
    );
  }

  debug('Image size validated', { size, maxSize: MAX_IMAGE_SIZE });
  return size;
}

/**
 * Validate configuration object
 * @param {Object} config - Configuration object
 * @param {string} config.apiKey - Required API key
 * @param {Object} config.options - Optional configuration options
 * @returns {Object} Validated and normalized config
 * @throws {ValidationError|ConfigurationError} If validation fails
 */
export function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new ValidationError('Configuration must be an object');
  }

  // Validate required fields
  if (!config.apiKey || typeof config.apiKey !== 'string') {
    throw new ConfigurationError(
      'API key is required and must be a non-empty string'
    );
  }

  if (config.apiKey.trim().length === 0) {
    throw new ConfigurationError('API key cannot be empty');
  }

  // Validate optional fields
  const validatedConfig = {
    apiKey: config.apiKey.trim(),
  };

  // Optional timeout
  if (config.timeout !== undefined) {
    if (
      typeof config.timeout !== 'number' ||
      config.timeout <= 0 ||
      !Number.isInteger(config.timeout)
    ) {
      throw new ValidationError(
        'Timeout must be a positive integer (milliseconds)'
      );
    }
    validatedConfig.timeout = config.timeout;
  }

  // Optional base URL
  if (config.baseURL !== undefined) {
    if (typeof config.baseURL !== 'string' || config.baseURL.trim().length === 0) {
      throw new ValidationError('Base URL must be a non-empty string');
    }
    validatedConfig.baseURL = config.baseURL.trim();
  }

  // Optional retry settings
  if (config.retry !== undefined) {
    if (
      typeof config.retry !== 'object' ||
      (config.retry.maxAttempts !== undefined &&
        (typeof config.retry.maxAttempts !== 'number' ||
          config.retry.maxAttempts < 1 ||
          !Number.isInteger(config.retry.maxAttempts)))
    ) {
      throw new ValidationError(
        'Retry config must be an object with optional maxAttempts (positive integer)'
      );
    }
    validatedConfig.retry = config.retry;
  }

  debug('Configuration validated successfully');
  return validatedConfig;
}

