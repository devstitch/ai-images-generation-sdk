/**
 * AI Provider Base Class
 * Abstract base class for AI image generation providers
 * @module providers/AIProvider
 */

import { ConfigurationError, AIProviderError } from '../utils/errors.js';
import { debug, error } from '../utils/logger.js';

/**
 * Abstract base class for AI providers
 * All AI providers must extend this class and implement required methods
 */
class AIProvider {
  constructor() {
    this.config = null;
    this.initialized = false;
  }

  /**
   * Initialize the provider with configuration
   * Must be called before using other methods
   * @param {Object} config - Provider configuration
   * @param {string} config.apiKey - API key for the provider
   * @param {string} [config.baseURL] - Base URL for API (optional, provider-specific)
   * @param {number} [config.timeout] - Request timeout in milliseconds (optional)
   * @param {Object} [config.options] - Additional provider-specific options (optional)
   * @returns {Promise<void>} Resolves when initialization is complete
   * @throws {ConfigurationError} If configuration is invalid
   * @abstract
   */
  async initialize(config) {
    if (!config || typeof config !== 'object') {
      throw new ConfigurationError('Configuration object is required');
    }

    if (!config.apiKey || typeof config.apiKey !== 'string') {
      throw new ConfigurationError('API key is required');
    }

    this.config = {
      apiKey: config.apiKey.trim(),
      baseURL: config.baseURL?.trim(),
      timeout: config.timeout || 60000,
      options: config.options || {},
    };

    this.initialized = true;
    debug('AI Provider initialized');
  }

  /**
   * Generate interior design image from input image and prompt
   * @param {Object} options - Generation options
   * @param {string} options.imageBase64 - Input room image as base64 data URI
   * @param {string} options.prompt - Text prompt describing desired design
   * @param {string} [options.style] - Style ID (optional, can be included in prompt)
   * @param {Object} [options.metadata] - Additional metadata (optional)
   * @returns {Promise<Object>} Generation result
   * @returns {Promise<Object.imageBase64>} Generated image as base64 data URI
   * @returns {Promise<Object.metadata>} Generation metadata (provider-specific)
   * @throws {AIProviderError} If generation fails
   * @throws {ConfigurationError} If provider is not initialized
   * @abstract
   */
  async generateImage(options) {
    this._ensureInitialized();
    this._validateGenerateOptions(options);

    // This method must be implemented by subclasses
    throw new AIProviderError(
      'generateImage() must be implemented by provider subclass'
    );
  }

  /**
   * Validate API connection and credentials
   * Tests if the API key is valid and the service is accessible
   * @returns {Promise<boolean>} True if connection is valid, false otherwise
   * @throws {AIProviderError} If validation fails
   * @throws {ConfigurationError} If provider is not initialized
   * @abstract
   */
  async validateConnection() {
    this._ensureInitialized();

    // This method must be implemented by subclasses
    throw new AIProviderError(
      'validateConnection() must be implemented by provider subclass'
    );
  }

  /**
   * Get provider information
   * Returns provider name, version, and capabilities
   * @returns {Object} Provider information
   * @returns {string} Provider information.name - Provider name
   * @returns {string} Provider information.version - Provider version
   * @returns {Object} [Provider information.capabilities] - Provider capabilities (optional)
   * @abstract
   */
  getProviderInfo() {
    // This method must be implemented by subclasses
    throw new AIProviderError(
      'getProviderInfo() must be implemented by provider subclass'
    );
  }

  /**
   * Ensure provider is initialized before use
   * @private
   * @throws {ConfigurationError} If provider is not initialized
   */
  _ensureInitialized() {
    if (!this.initialized || !this.config) {
      throw new ConfigurationError(
        'Provider must be initialized before use. Call initialize() first.'
      );
    }
  }

  /**
   * Validate options for generateImage method
   * @private
   * @param {Object} options - Generation options
   * @throws {ConfigurationError} If options are invalid
   */
  _validateGenerateOptions(options) {
    if (!options || typeof options !== 'object') {
      throw new ConfigurationError('Generation options are required');
    }

    if (!options.imageBase64 || typeof options.imageBase64 !== 'string') {
      throw new ConfigurationError(
        'imageBase64 is required and must be a string'
      );
    }

    // Validate base64 format
    if (
      !options.imageBase64.startsWith('data:image/') &&
      !/^[A-Za-z0-9+/=]+$/.test(options.imageBase64)
    ) {
      throw new ConfigurationError(
        'imageBase64 must be a valid base64 string or data URI'
      );
    }

    if (!options.prompt || typeof options.prompt !== 'string') {
      throw new ConfigurationError('prompt is required and must be a string');
    }

    if (options.prompt.trim().length === 0) {
      throw new ConfigurationError('prompt cannot be empty');
    }

    // Optional style validation
    if (options.style !== undefined && typeof options.style !== 'string') {
      throw new ConfigurationError('style must be a string if provided');
    }
  }

  /**
   * Get current configuration (read-only)
   * @returns {Object|null} Current configuration or null if not initialized
   */
  getConfig() {
    return this.config ? { ...this.config } : null;
  }

  /**
   * Check if provider is initialized
   * @returns {boolean} True if initialized, false otherwise
   */
  isInitialized() {
    return this.initialized === true;
  }

  /**
   * Reset provider state
   * Clears configuration and resets initialized flag
   */
  reset() {
    this.config = null;
    this.initialized = false;
    debug('AI Provider reset');
  }
}

export default AIProvider;

