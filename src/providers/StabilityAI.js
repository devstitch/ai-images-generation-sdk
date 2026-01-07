/**
 * Stability AI Provider
 * Implementation of AIProvider for Stability AI's image-to-image API
 * @module providers/StabilityAI
 */

import AIProvider from './AIProvider.js';
import axios from 'axios';
import FormData from 'form-data';
import sharp from 'sharp';
import { AIProviderError, ConfigurationError } from '../utils/errors.js';
import { DEFAULT_TIMEOUT } from '../utils/constants.js';
import { debug, info, warn, error } from '../utils/logger.js';

/**
 * Stability AI Provider Implementation
 * Extends AIProvider base class
 */
class StabilityAI extends AIProvider {
  constructor() {
    super();
    this.name = 'StabilityAI';
    this.version = '1.0.0';
    this.baseURL = 'https://api.stability.ai';
    this.apiEndpoint = '/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image';
    
    // Allowed dimensions for SDXL models
    this.allowedDimensions = [
      { width: 1024, height: 1024 },
      { width: 1152, height: 896 },
      { width: 1216, height: 832 },
      { width: 1344, height: 768 },
      { width: 1536, height: 640 },
      { width: 640, height: 1536 },
      { width: 768, height: 1344 },
      { width: 832, height: 1216 },
      { width: 896, height: 1152 },
    ];
  }

  /**
   * Initialize the Stability AI provider
   * @param {Object} config - Provider configuration
   * @param {string} config.apiKey - Stability AI API key
   * @param {string} [config.baseURL] - Custom base URL (optional)
   * @param {number} [config.timeout] - Request timeout in milliseconds
   * @param {number} [config.maxRetries] - Maximum retry attempts (default: 3)
   * @returns {Promise<void>}
   */
  async initialize(config) {
    await super.initialize(config);

    // Override baseURL if provided
    if (config.baseURL) {
      this.baseURL = config.baseURL.trim();
    }

    // Set retry configuration
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000; // Initial delay in ms

    info('Stability AI provider initialized', {
      baseURL: this.baseURL,
      maxRetries: this.maxRetries,
    });
  }

  /**
   * Generate interior design image using Stability AI
   * @param {Object} options - Generation options
   * @param {string} options.imageBase64 - Input room image as base64 data URI
   * @param {string} options.prompt - Text prompt describing desired design
   * @param {string} [options.style] - Style ID (optional)
   * @param {number} [options.strength] - Image strength (0.0-1.0, default: 0.5)
   * @param {number} [options.cfgScale] - CFG scale (1-35, default: 7)
   * @param {number} [options.steps] - Number of steps (10-50, default: 30)
   * @returns {Promise<Object>} Generation result
   * @returns {string} imageBase64 - Generated image as base64 data URI
   * @returns {Object} metadata - Generation metadata
   */
  async generateImage(options) {
    this._ensureInitialized();
    this._validateGenerateOptions(options);

    debug('Generating image with Stability AI', {
      promptLength: options.prompt.length,
      hasStyle: !!options.style,
    });

    // Extract base64 data from data URI if needed
    const imageBase64 = this._extractBase64Data(options.imageBase64);
    let imageBuffer = Buffer.from(imageBase64, 'base64');

    // Resize image to match allowed dimensions
    debug('Resizing image to match Stability AI requirements');
    imageBuffer = await this._resizeToAllowedDimensions(imageBuffer);

    // Prepare request parameters
    // Lower image_strength (0.3-0.4) for more transformation, higher (0.6-0.8) for less
    const requestParams = {
      image: imageBuffer,
      prompt: options.prompt,
      strength: options.strength || 0.35, // Lower default for more transformation
      cfg_scale: options.cfgScale || 7,
      steps: options.steps || 30,
    };

    // Add negative prompt for better results
    requestParams.negative_prompt =
      'blurry, low quality, distorted, deformed, bad anatomy, watermark';

    debug('Request parameters', {
      promptLength: requestParams.prompt.length,
      strength: requestParams.strength,
      cfgScale: requestParams.cfg_scale,
      steps: requestParams.steps,
      imageSize: imageBuffer.length,
    });

    try {
      const response = await this._makeRequestWithRetry(requestParams);
      const resultImageBase64 = this._convertResponseToBase64(response);

      const metadata = {
        provider: this.name,
        model: 'stable-diffusion-xl-1024-v1-0',
        steps: requestParams.steps,
        cfgScale: requestParams.cfg_scale,
        strength: requestParams.strength,
        timestamp: new Date().toISOString(),
      };

      info('Image generated successfully with Stability AI');
      return {
        imageBase64: resultImageBase64,
        metadata,
      };
    } catch (err) {
      error('Failed to generate image with Stability AI', err);
      throw this._handleError(err);
    }
  }

  /**
   * Validate API connection and credentials
   * @returns {Promise<boolean>} True if connection is valid
   */
  async validateConnection() {
    this._ensureInitialized();

    try {
      // Make a simple request to check API key validity
      // Using the account endpoint as a lightweight check
      const response = await axios.get(`${this.baseURL}/v1/user/account`, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          Accept: 'application/json',
        },
        timeout: this.config.timeout || DEFAULT_TIMEOUT,
      });

      if (response.status === 200) {
        debug('Stability AI connection validated successfully');
        return true;
      }

      return false;
    } catch (err) {
      if (err.response?.status === 401) {
        throw new ConfigurationError('Invalid Stability AI API key');
      }
      if (err.response?.status === 403) {
        throw new ConfigurationError('API key does not have required permissions');
      }
      throw new AIProviderError(
        `Failed to validate Stability AI connection: ${err.message}`,
        err
      );
    }
  }

  /**
   * Get provider information
   * @returns {Object} Provider information
   */
  getProviderInfo() {
    return {
      name: this.name,
      version: this.version,
      capabilities: {
        imageToImage: true,
        textToImage: false,
        inpainting: false,
        upscaling: false,
      },
      apiEndpoint: this.apiEndpoint,
      baseURL: this.baseURL,
    };
  }

  /**
   * Make HTTP request with retry logic
   * @private
   * @param {Object} params - Request parameters
   * @returns {Promise<Object>} API response
   */
  async _makeRequestWithRetry(params) {
    let lastError;
    let delay = this.retryDelay;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        debug(`Stability AI request attempt ${attempt}/${this.maxRetries}`);
        return await this._makeRequest(params);
      } catch (err) {
        lastError = err;

        // Don't retry on certain errors
        if (this._shouldNotRetry(err)) {
          throw err;
        }

        // If not last attempt, wait and retry
        if (attempt < this.maxRetries) {
          warn(
            `Request failed, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`,
            err.message
          );
          await this._sleep(delay);
          delay *= 2; // Exponential backoff
        }
      }
    }

    // All retries exhausted
    throw lastError;
  }

  /**
   * Make HTTP request to Stability AI API
   * @private
   * @param {Object} params - Request parameters
   * @returns {Promise<Object>} API response
   */
  async _makeRequest(params) {
    // Create form data
    const formData = new FormData();
    // Stability AI v1 API uses 'init_image' for image-to-image endpoint
    formData.append('init_image', params.image, {
      filename: 'input.jpg',
      contentType: 'image/jpeg',
    });
    // Text prompts format for v1 API
    formData.append('text_prompts[0][text]', params.prompt);
    formData.append('text_prompts[0][weight]', '1.0');
    if (params.negative_prompt) {
      formData.append('text_prompts[1][text]', params.negative_prompt);
      formData.append('text_prompts[1][weight]', '-1.0');
    }
    formData.append('image_strength', params.strength.toString());
    formData.append('cfg_scale', params.cfg_scale.toString());
    formData.append('steps', params.steps.toString());

    const url = `${this.baseURL}${this.apiEndpoint}`;

    try {
      const response = await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          Accept: 'application/json',
          ...formData.getHeaders(),
        },
        timeout: this.config.timeout || DEFAULT_TIMEOUT,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return response.data;
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        throw new AIProviderError(
          `Request timeout after ${this.config.timeout || DEFAULT_TIMEOUT}ms`,
          err
        );
      }
      throw err;
    }
  }

  /**
   * Check if error should not be retried
   * @private
   * @param {Error} err - Error object
   * @returns {boolean} True if should not retry
   */
  _shouldNotRetry(err) {
    // Don't retry on authentication errors
    if (err.response?.status === 401 || err.response?.status === 403) {
      return true;
    }

    // Don't retry on bad request (400)
    if (err.response?.status === 400) {
      return true;
    }

    // Don't retry on timeout (already handled)
    if (err.code === 'ECONNABORTED') {
      return false; // Retry timeouts
    }

    return false;
  }

  /**
   * Convert API response to base64 data URI
   * @private
   * @param {Object} response - API response
   * @returns {string} Base64 data URI
   */
  _convertResponseToBase64(response) {
    debug('Converting response to base64', {
      responseType: typeof response,
      hasArtifacts: !!response?.artifacts,
      artifactsLength: response?.artifacts?.length,
      responseKeys: response ? Object.keys(response) : [],
    });

    // Stability AI returns different response formats
    // Check for artifacts array (common format)
    if (response.artifacts && Array.isArray(response.artifacts) && response.artifacts.length > 0) {
      const artifact = response.artifacts[0];
      debug('Using artifact', {
        artifactKeys: Object.keys(artifact),
        hasBase64: !!artifact.base64,
        finishReason: artifact.finishReason,
      });

      if (artifact.base64) {
        const base64Length = artifact.base64.length;
        debug('Extracted base64 image', { base64Length });
        return `data:image/png;base64,${artifact.base64}`;
      }

      // Check if artifact has seed (indicates it was generated)
      if (artifact.seed !== undefined) {
        debug('Artifact has seed, indicating generated image', { seed: artifact.seed });
      }
    }

    // Check for direct base64 field
    if (response.base64) {
      debug('Using direct base64 field');
      return `data:image/png;base64,${response.base64}`;
    }

    // Check for image buffer
    if (Buffer.isBuffer(response)) {
      debug('Using buffer response');
      return `data:image/png;base64,${response.toString('base64')}`;
    }

    // Log full response for debugging
    error('Unexpected response format', { response: JSON.stringify(response).substring(0, 500) });
    throw new AIProviderError(
      'Invalid response format from Stability AI API. Expected artifacts array or base64 field.'
    );
  }

  /**
   * Extract base64 data from data URI
   * @private
   * @param {string} dataUri - Base64 data URI or plain base64
   * @returns {string} Plain base64 string
   */
  _extractBase64Data(dataUri) {
    if (dataUri.startsWith('data:image/')) {
      const match = dataUri.match(/^data:image\/[^;]+;base64,(.+)$/);
      if (match) {
        return match[1];
      }
    }
    return dataUri;
  }

  /**
   * Handle and transform errors
   * @private
   * @param {Error} err - Original error
   * @returns {AIProviderError} Transformed error
   */
  _handleError(err) {
    // Network errors
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return new AIProviderError(
        'Network error: Could not connect to Stability AI API',
        err
      );
    }

    // Timeout errors
    if (err.code === 'ECONNABORTED') {
      return new AIProviderError(
        `Request timeout: Stability AI API did not respond within ${this.config.timeout || DEFAULT_TIMEOUT}ms`,
        err
      );
    }

    // HTTP errors
    if (err.response) {
      const status = err.response.status;
      const statusText = err.response.statusText;

      if (status === 401) {
        return new ConfigurationError('Invalid Stability AI API key', err);
      }

      if (status === 403) {
        return new ConfigurationError(
          'API key does not have required permissions',
          err
        );
      }

      if (status === 429) {
        return new AIProviderError(
          'Rate limit exceeded: Too many requests to Stability AI API',
          err
        );
      }

      if (status === 400) {
        const message =
          err.response.data?.message ||
          err.response.data?.error ||
          'Invalid request to Stability AI API';
        return new AIProviderError(message, err);
      }

      if (status >= 500) {
        return new AIProviderError(
          `Stability AI API server error (${status} ${statusText})`,
          err
        );
      }

      return new AIProviderError(
        `Stability AI API error: ${status} ${statusText}`,
        err
      );
    }

    // Unknown errors
    return new AIProviderError(
      `Unexpected error from Stability AI: ${err.message}`,
      err
    );
  }

  /**
   * Resize image to one of the allowed dimensions
   * @private
   * @param {Buffer} imageBuffer - Image buffer
   * @returns {Promise<Buffer>} Resized image buffer
   */
  async _resizeToAllowedDimensions(imageBuffer) {
    try {
      // Get current image dimensions
      const metadata = await sharp(imageBuffer).metadata();
      const currentWidth = metadata.width;
      const currentHeight = metadata.height;

      debug('Current image dimensions', { width: currentWidth, height: currentHeight });

      // Check if already matches allowed dimensions
      const matchesAllowed = this.allowedDimensions.some(
        (dim) => dim.width === currentWidth && dim.height === currentHeight
      );

      if (matchesAllowed) {
        debug('Image already matches allowed dimensions');
        return imageBuffer;
      }

      // Find the closest allowed dimension that maintains aspect ratio
      const aspectRatio = currentWidth / currentHeight;
      let bestMatch = this.allowedDimensions[0];
      let minDifference = Infinity;

      for (const dim of this.allowedDimensions) {
        const dimAspectRatio = dim.width / dim.height;
        const difference = Math.abs(aspectRatio - dimAspectRatio);

        if (difference < minDifference) {
          minDifference = difference;
          bestMatch = dim;
        }
      }

      debug('Resizing to closest allowed dimension', {
        target: `${bestMatch.width}x${bestMatch.height}`,
        original: `${currentWidth}x${currentHeight}`,
      });

      // Resize image to exact dimensions (fit and pad if needed)
      const resizedBuffer = await sharp(imageBuffer)
        .resize(bestMatch.width, bestMatch.height, {
          fit: 'fill', // Fill exact dimensions
          background: { r: 255, g: 255, b: 255, alpha: 1 }, // White background for padding
        })
        .toBuffer();

      return resizedBuffer;
    } catch (err) {
      error('Failed to resize image to allowed dimensions', err);
      throw new AIProviderError('Failed to resize image to required dimensions', err);
    }
  }

  /**
   * Sleep utility for retry delays
   * @private
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default StabilityAI;

