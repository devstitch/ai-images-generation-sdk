/**
 * Mock AI Provider for Testing
 * Mock implementation of AIProvider for unit and integration tests
 * @module tests/mocks/mockAIProvider
 */

import AIProvider from '../../src/providers/AIProvider.js';
import { AIProviderError, ConfigurationError } from '../../src/utils/errors.js';
import { GENERATED_DESIGN_IMAGE } from './mockImages.js';

/**
 * Mock AI Provider
 * Simulates AI provider behavior for testing
 */
class MockAIProvider extends AIProvider {
  constructor(options = {}) {
    super();
    this.name = 'MockAIProvider';
    this.version = '1.0.0-test';

    // Configuration options
    this.options = {
      simulateDelay: options.simulateDelay || false,
      delayMs: options.delayMs || 100,
      shouldFail: options.shouldFail || false,
      failOnCall: options.failOnCall || null, // 'initialize', 'generateImage', 'validateConnection'
      errorMessage: options.errorMessage || 'Mock error for testing',
      ...options,
    };

    // Track method calls for verification
    this.callHistory = {
      initialize: [],
      generateImage: [],
      validateConnection: [],
      getProviderInfo: [],
    };

    // Track call counts
    this.callCounts = {
      initialize: 0,
      generateImage: 0,
      validateConnection: 0,
      getProviderInfo: 0,
    };
  }

  /**
   * Initialize the mock provider
   * @param {Object} config - Provider configuration
   * @param {string} config.apiKey - API key (can be any string for mock)
   * @returns {Promise<void>}
   */
  async initialize(config) {
    this.callCounts.initialize++;
    this.callHistory.initialize.push({
      timestamp: new Date().toISOString(),
      config: { ...config },
    });

    // Simulate delay if enabled
    if (this.options.simulateDelay) {
      await this._sleep(this.options.delayMs);
    }

    // Check if should fail on initialize
    if (this.options.shouldFail && this.options.failOnCall === 'initialize') {
      throw new ConfigurationError(this.options.errorMessage);
    }

    // Call parent initialize
    await super.initialize(config);

    // Mock-specific: mark as initialized
    this.mockInitialized = true;
  }

  /**
   * Generate image (mock implementation)
   * Returns fake base64 image data instantly
   * @param {Object} options - Generation options
   * @param {string} options.imageBase64 - Input image (ignored in mock)
   * @param {string} options.prompt - Prompt text
   * @param {string} [options.style] - Style ID
   * @returns {Promise<Object>} Mock generation result
   */
  async generateImage(options) {
    this._ensureInitialized();
    this._validateGenerateOptions(options);

    this.callCounts.generateImage++;
    this.callHistory.generateImage.push({
      timestamp: new Date().toISOString(),
      options: {
        prompt: options.prompt,
        style: options.style,
        hasImage: !!options.imageBase64,
      },
    });

    // Simulate delay if enabled
    if (this.options.simulateDelay) {
      await this._sleep(this.options.delayMs);
    }

    // Check if should fail on generateImage
    if (this.options.shouldFail && this.options.failOnCall === 'generateImage') {
      throw new AIProviderError(this.options.errorMessage);
    }

    // Return mock generated image
    const metadata = {
      provider: this.name,
      model: 'mock-model-v1.0',
      steps: 30,
      cfgScale: 7,
      strength: 0.35,
      timestamp: new Date().toISOString(),
      prompt: options.prompt,
      style: options.style || null,
    };

    return {
      imageBase64: GENERATED_DESIGN_IMAGE.dataUri,
      metadata,
    };
  }

  /**
   * Validate connection (mock implementation)
   * Always returns true unless configured to fail
   * @returns {Promise<boolean>} Always true for mock
   */
  async validateConnection() {
    this._ensureInitialized();

    this.callCounts.validateConnection++;
    this.callHistory.validateConnection.push({
      timestamp: new Date().toISOString(),
    });

    // Simulate delay if enabled
    if (this.options.simulateDelay) {
      await this._sleep(this.options.delayMs);
    }

    // Check if should fail on validateConnection
    if (
      this.options.shouldFail &&
      this.options.failOnCall === 'validateConnection'
    ) {
      throw new AIProviderError(this.options.errorMessage);
    }

    return true;
  }

  /**
   * Get provider information
   * @returns {Object} Provider information
   */
  getProviderInfo() {
    this.callCounts.getProviderInfo++;
    this.callHistory.getProviderInfo.push({
      timestamp: new Date().toISOString(),
    });

    return {
      name: this.name,
      version: this.version,
      capabilities: {
        imageToImage: true,
        textToImage: false,
        inpainting: false,
        upscaling: false,
      },
      isMock: true,
    };
  }

  /**
   * Get call history for a specific method
   * @param {string} methodName - Method name to get history for
   * @returns {Array} Array of call records
   */
  getCallHistory(methodName) {
    return this.callHistory[methodName] || [];
  }

  /**
   * Get call count for a specific method
   * @param {string} methodName - Method name to get count for
   * @returns {number} Number of times method was called
   */
  getCallCount(methodName) {
    return this.callCounts[methodName] || 0;
  }

  /**
   * Get all call history
   * @returns {Object} All call history
   */
  getAllCallHistory() {
    return { ...this.callHistory };
  }

  /**
   * Get all call counts
   * @returns {Object} All call counts
   */
  getAllCallCounts() {
    return { ...this.callCounts };
  }

  /**
   * Reset call tracking
   * Clears all call history and counts
   */
  resetCallTracking() {
    this.callHistory = {
      initialize: [],
      generateImage: [],
      validateConnection: [],
      getProviderInfo: [],
    };
    this.callCounts = {
      initialize: 0,
      generateImage: 0,
      validateConnection: 0,
      getProviderInfo: 0,
    };
  }

  /**
   * Configure mock behavior
   * @param {Object} options - Mock options
   * @param {boolean} [options.shouldFail] - Whether to fail on next call
   * @param {string} [options.failOnCall] - Which method should fail
   * @param {string} [options.errorMessage] - Error message to throw
   * @param {boolean} [options.simulateDelay] - Whether to simulate delay
   * @param {number} [options.delayMs] - Delay in milliseconds
   */
  configure(options) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  /**
   * Sleep utility for simulating delays
   * @private
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default MockAIProvider;

