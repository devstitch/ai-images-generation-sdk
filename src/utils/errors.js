/**
 * Custom Error Classes
 * @module utils/errors
 */

import { ERROR_CODES } from './constants.js';

/**
 * Base error class with serialization support
 */
class BaseError extends Error {
  constructor(message, code, originalError = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp,
      originalError: this.originalError
        ? {
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : null,
    };
  }
}

/**
 * ValidationError - for input validation failures
 */
export class ValidationError extends BaseError {
  constructor(message, originalError = null) {
    super(message, ERROR_CODES.VALIDATION_ERROR, originalError);
  }
}

/**
 * AIProviderError - for AI API issues
 */
export class AIProviderError extends BaseError {
  constructor(message, originalError = null) {
    super(message, ERROR_CODES.AI_PROVIDER_ERROR, originalError);
  }
}

/**
 * ConfigurationError - for setup problems
 */
export class ConfigurationError extends BaseError {
  constructor(message, originalError = null) {
    super(message, ERROR_CODES.CONFIGURATION_ERROR, originalError);
  }
}

/**
 * ImageProcessingError - for image handling issues
 */
export class ImageProcessingError extends BaseError {
  constructor(message, originalError = null) {
    super(message, ERROR_CODES.IMAGE_PROCESSING_ERROR, originalError);
  }
}

