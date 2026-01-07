/**
 * SDK Constants
 * @module utils/constants
 */

// Supported image formats
export const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];

// Max image size: 5MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Default timeout: 60 seconds
export const DEFAULT_TIMEOUT = 60000; // milliseconds

// API endpoints constants
export const API_ENDPOINTS = {
  GENERATE: '/api/v1/generate',
  ENHANCE: '/api/v1/enhance',
  STYLES: '/api/v1/styles',
  HEALTH: '/api/v1/health',
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  IMAGE_PROCESSING_ERROR: 'IMAGE_PROCESSING_ERROR',
};

