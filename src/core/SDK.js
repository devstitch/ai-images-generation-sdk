/**
 * Interior Design SDK
 * Main SDK class for AI interior design generation
 * @module core/SDK
 */

import StyleManager from './StyleManager.js';
import PromptBuilder from './PromptBuilder.js';
import ImageProcessor from '../processors/ImageProcessor.js';
import {
  validateImageInput,
  validateImageFormat,
  validateImageSize,
  validateConfig,
} from '../processors/ImageValidator.js';
import {
  ValidationError,
  AIProviderError,
  ConfigurationError,
  ImageProcessingError,
} from '../utils/errors.js';
import { debug, info, warn, error } from '../utils/logger.js';

/**
 * Interior Design SDK Main Class
 * Provides high-level API for AI interior design generation
 */
class InteriorDesignSDK {
  constructor() {
    this.provider = null;
    this.initialized = false;
  }

  /**
   * Initialize the SDK with AI provider
   * @param {Object} config - SDK configuration
   * @param {Object} config.provider - AI provider instance (must extend AIProvider)
   * @param {Object} config.providerConfig - Configuration for the provider
   * @param {string} config.providerConfig.apiKey - API key for the provider
   * @param {Object} [config.options] - Additional SDK options
   * @returns {Promise<void>}
   * @throws {ConfigurationError} If configuration is invalid
   */
  async initialize(config) {
    if (!config || typeof config !== 'object') {
      throw new ConfigurationError('Configuration object is required');
    }

    if (!config.provider) {
      throw new ConfigurationError('AI provider is required');
    }

    // Validate provider has required methods
    const requiredMethods = ['initialize', 'generateImage', 'validateConnection', 'getProviderInfo'];
    for (const method of requiredMethods) {
      if (typeof config.provider[method] !== 'function') {
        throw new ConfigurationError(
          `Provider must implement ${method}() method`
        );
      }
    }

    // Validate provider config
    if (!config.providerConfig || typeof config.providerConfig !== 'object') {
      throw new ConfigurationError('Provider configuration is required');
    }

    const validatedConfig = validateConfig(config.providerConfig);

    // Initialize provider
    try {
      await config.provider.initialize(validatedConfig);
      this.provider = config.provider;
      this.initialized = true;

      const providerInfo = this.provider.getProviderInfo();
      info('Interior Design SDK initialized', {
        provider: providerInfo.name,
        version: providerInfo.version,
      });
    } catch (err) {
      if (err instanceof ConfigurationError) {
        throw err;
      }
      throw new ConfigurationError('Failed to initialize provider', err);
    }
  }

  /**
   * Generate interior design from room image
   * @param {Object} options - Generation options
   * @param {string|Buffer} options.image - Input room image (file path, Buffer, or base64)
   * @param {string} options.style - Style ID (e.g., 'modern-minimalist')
   * @param {Object} [options.promptParams] - Additional prompt parameters
   * @param {string} [options.promptParams.roomType] - Room type
   * @param {string} [options.promptParams.colorScheme] - Color scheme
   * @param {string} [options.promptParams.atmosphere] - Desired atmosphere
   * @param {Object} [options.generationParams] - Provider-specific generation parameters
   * @param {boolean} [options.resizeImage=true] - Whether to resize image before processing
   * @param {number} [options.maxWidth=1024] - Maximum image width for resizing
   * @returns {Promise<Object>} Generation result
   * @returns {string} imageBase64 - Generated design image as base64 data URI
   * @returns {Object} metadata - Generation metadata
   * @throws {ValidationError|AIProviderError|ImageProcessingError} If generation fails
   */
  async generateDesign(options) {
    this._ensureInitialized();

    if (!options || typeof options !== 'object') {
      throw new ValidationError('Generation options are required');
    }

    if (!options.image) {
      throw new ValidationError('Image is required');
    }

    if (!options.style || typeof options.style !== 'string') {
      throw new ValidationError('Style is required and must be a string');
    }

    try {
      info('Starting design generation', { style: options.style });

      // Step 1: Validate and load image
      debug('Validating and loading image');
      const normalizedInput = await validateImageInput(options.image);
      let imageBuffer;

      if (normalizedInput.type === 'file_path') {
        imageBuffer = await ImageProcessor.loadImage(normalizedInput.data);
      } else if (normalizedInput.type === 'buffer') {
        imageBuffer = normalizedInput.data;
      } else {
        // Base64 - convert to buffer
        imageBuffer = await ImageProcessor.loadImage(normalizedInput.data);
      }

      // Step 2: Validate image format
      debug('Validating image format');
      const format = await validateImageFormat(imageBuffer);
      debug('Image format validated', { format });

      // Step 3: Validate image size
      debug('Validating image size');
      validateImageSize(imageBuffer);
      debug('Image size validated');

      // Step 4: Resize if needed
      const shouldResize = options.resizeImage !== false;
      if (shouldResize) {
        const maxWidth = options.maxWidth || 1024;
        debug('Resizing image if needed', { maxWidth });
        imageBuffer = await ImageProcessor.resizeIfNeeded(imageBuffer, maxWidth);
      }

      // Step 5: Get style and build prompt
      debug('Loading style and building prompt');
      const style = await StyleManager.validateStyle(options.style);
      const promptParams = options.promptParams || {};
      const prompt = PromptBuilder.buildAndValidatePrompt(style, promptParams);
      debug('Prompt built', { promptLength: prompt.length });

      // Step 6: Convert image to base64
      debug('Converting image to base64');
      const imageBase64 = await ImageProcessor.convertToBase64(
        imageBuffer,
        format
      );

      // Step 7: Generate design with provider
      debug('Calling AI provider for generation');
      const generationParams = options.generationParams || {};
      const result = await this.provider.generateImage({
        imageBase64,
        prompt,
        style: options.style,
        ...generationParams,
      });

      info('Design generation completed successfully');
      return result;
    } catch (err) {
      error('Design generation failed', err);
      throw this._handleGenerationError(err);
    }
  }

  /**
   * Get available interior design styles
   * @returns {Promise<Array>} Array of available styles
   */
  async getAvailableStyles() {
    return await StyleManager.getAvailableStyles();
  }

  /**
   * Get style by ID
   * @param {string} id - Style ID
   * @returns {Promise<Object|null>} Style object or null if not found
   */
  async getStyleById(id) {
    return await StyleManager.getStyleById(id);
  }

  /**
   * Validate API connection
   * @returns {Promise<boolean>} True if connection is valid
   * @throws {ConfigurationError|AIProviderError} If validation fails
   */
  async validateConnection() {
    this._ensureInitialized();
    return await this.provider.validateConnection();
  }

  /**
   * Get provider information
   * @returns {Object} Provider information
   */
  getProviderInfo() {
    if (!this.provider) {
      return null;
    }
    return this.provider.getProviderInfo();
  }

  /**
   * Ensure SDK is initialized
   * @private
   * @throws {ConfigurationError} If SDK is not initialized
   */
  _ensureInitialized() {
    if (!this.initialized || !this.provider) {
      throw new ConfigurationError(
        'SDK must be initialized before use. Call initialize() first.'
      );
    }
  }

  /**
   * Handle and transform generation errors
   * @private
   * @param {Error} err - Original error
   * @returns {Error} Transformed error
   */
  _handleGenerationError(err) {
    // Re-throw known error types as-is
    if (
      err instanceof ValidationError ||
      err instanceof AIProviderError ||
      err instanceof ConfigurationError ||
      err instanceof ImageProcessingError
    ) {
      return err;
    }

    // Transform unknown errors
    if (err.message?.includes('network') || err.code === 'ECONNREFUSED') {
      return new AIProviderError('Network error during generation', err);
    }

    if (err.message?.includes('timeout') || err.code === 'ECONNABORTED') {
      return new AIProviderError('Request timeout during generation', err);
    }

    return new AIProviderError('Unexpected error during generation', err);
  }
}

export default InteriorDesignSDK;

