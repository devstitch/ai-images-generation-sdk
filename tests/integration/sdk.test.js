/**
 * Integration Tests for Interior Design SDK
 * Tests complete SDK workflow using mock AI provider
 * @module tests/integration/sdk.test
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import InteriorDesignSDK from '../../src/core/SDK.js';
import MockAIProvider from '../mocks/mockAIProvider.js';
import {
  SMALL_TEST_IMAGE,
  MEDIUM_TEST_IMAGE,
  GENERATED_DESIGN_IMAGE,
  INVALID_IMAGE_DATA,
} from '../mocks/mockImages.js';
import {
  ValidationError,
  AIProviderError,
  ConfigurationError,
} from '../../src/utils/errors.js';
import StyleManager from '../../src/core/StyleManager.js';

describe('InteriorDesignSDK Integration Tests', () => {
  let sdk;
  let mockProvider;

  beforeEach(() => {
    // Create fresh SDK instance for each test
    sdk = new InteriorDesignSDK();
    // Create fresh mock provider for each test
    mockProvider = new MockAIProvider({
      simulateDelay: false, // Fast tests
      shouldFail: false,
    });
  });

  afterEach(() => {
    // Clean up after each test
    if (sdk) {
      sdk = null;
    }
    if (mockProvider) {
      mockProvider.resetCallTracking();
      mockProvider.reset();
    }
  });

  describe('SDK Initialization', () => {
    it('should initialize successfully with valid config', async () => {
      await sdk.initialize({
        provider: mockProvider,
        providerConfig: {
          apiKey: 'test-api-key-12345',
        },
      });

      expect(sdk.initialized).toBe(true);
      const providerInfo = sdk.getProviderInfo();
      expect(providerInfo).toBeDefined();
      expect(providerInfo.name).toBe('MockAIProvider');
    });

    it('should initialize with optional timeout', async () => {
      await sdk.initialize({
        provider: mockProvider,
        providerConfig: {
          apiKey: 'test-api-key',
          timeout: 30000,
        },
      });

      expect(sdk.initialized).toBe(true);
    });

    it('should initialize with optional baseURL', async () => {
      await sdk.initialize({
        provider: mockProvider,
        providerConfig: {
          apiKey: 'test-api-key',
          baseURL: 'https://custom-api.example.com',
        },
      });

      expect(sdk.initialized).toBe(true);
    });

    it('should fail initialization without provider', async () => {
      await expect(
        sdk.initialize({
          providerConfig: {
            apiKey: 'test-api-key',
          },
        })
      ).rejects.toThrow(ConfigurationError);

      await expect(
        sdk.initialize({
          providerConfig: {
            apiKey: 'test-api-key',
          },
        })
      ).rejects.toThrow('AI provider is required');
    });

    it('should fail initialization without providerConfig', async () => {
      await expect(
        sdk.initialize({
          provider: mockProvider,
        })
      ).rejects.toThrow(ConfigurationError);

      await expect(
        sdk.initialize({
          provider: mockProvider,
        })
      ).rejects.toThrow('Provider configuration is required');
    });

    it('should fail initialization without API key', async () => {
      await expect(
        sdk.initialize({
          provider: mockProvider,
          providerConfig: {},
        })
      ).rejects.toThrow(ConfigurationError);

      await expect(
        sdk.initialize({
          provider: mockProvider,
          providerConfig: {},
        })
      ).rejects.toThrow('API key is required');
    });

    it('should fail initialization with invalid provider (missing methods)', async () => {
      const invalidProvider = {
        // Missing required methods
        name: 'InvalidProvider',
      };

      await expect(
        sdk.initialize({
          provider: invalidProvider,
          providerConfig: {
            apiKey: 'test-api-key',
          },
        })
      ).rejects.toThrow(ConfigurationError);

      await expect(
        sdk.initialize({
          provider: invalidProvider,
          providerConfig: {
            apiKey: 'test-api-key',
          },
        })
      ).rejects.toThrow('must implement');
    });
  });

  describe('Full Generation Flow', () => {
    beforeEach(async () => {
      // Initialize SDK before each generation test
      await sdk.initialize({
        provider: mockProvider,
        providerConfig: {
          apiKey: 'test-api-key',
        },
      });
    });

    it('should generate design with valid inputs', async () => {
      const result = await sdk.generateDesign({
        image: SMALL_TEST_IMAGE.dataUri,
        style: 'modern-minimalist',
      });

      expect(result).toBeDefined();
      expect(result.imageBase64).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should return correct structure', async () => {
      const result = await sdk.generateDesign({
        image: SMALL_TEST_IMAGE.dataUri,
        style: 'modern-minimalist',
      });

      // Check structure
      expect(result).toHaveProperty('imageBase64');
      expect(result).toHaveProperty('metadata');
      expect(typeof result.imageBase64).toBe('string');
      expect(typeof result.metadata).toBe('object');
    });

    it('should return valid base64 data URI format', async () => {
      const result = await sdk.generateDesign({
        image: SMALL_TEST_IMAGE.dataUri,
        style: 'modern-minimalist',
      });

      // Check base64 format
      expect(result.imageBase64).toMatch(/^data:image\/[^;]+;base64,.+$/);
    });

    it('should include correct metadata', async () => {
      const result = await sdk.generateDesign({
        image: SMALL_TEST_IMAGE.dataUri,
        style: 'modern-minimalist',
      });

      expect(result.metadata).toHaveProperty('provider');
      expect(result.metadata).toHaveProperty('model');
      expect(result.metadata).toHaveProperty('steps');
      expect(result.metadata).toHaveProperty('cfgScale');
      expect(result.metadata).toHaveProperty('strength');
      expect(result.metadata).toHaveProperty('timestamp');

      expect(result.metadata.provider).toBe('MockAIProvider');
      expect(result.metadata.model).toBe('mock-model-v1.0');
    });

    it('should generate design with Buffer input', async () => {
      const imageBuffer = Buffer.from(SMALL_TEST_IMAGE.base64, 'base64');
      const result = await sdk.generateDesign({
        image: imageBuffer,
        style: 'scandinavian',
      });

      expect(result).toBeDefined();
      expect(result.imageBase64).toBeDefined();
    });

    it('should generate design with prompt parameters', async () => {
      const result = await sdk.generateDesign({
        image: SMALL_TEST_IMAGE.dataUri,
        style: 'modern-minimalist',
        promptParams: {
          roomType: 'living-room',
          colorScheme: 'neutral',
          atmosphere: 'spacious',
        },
      });

      expect(result).toBeDefined();
      expect(result.metadata).toHaveProperty('prompt');
      expect(result.metadata.prompt).toBeDefined();
      expect(typeof result.metadata.prompt).toBe('string');
      expect(result.metadata.prompt.length).toBeGreaterThan(0);
    });

    it('should track provider method calls', async () => {
      await sdk.generateDesign({
        image: SMALL_TEST_IMAGE.dataUri,
        style: 'modern-minimalist',
      });

      // Verify provider was called
      expect(mockProvider.getCallCount('generateImage')).toBe(1);
      expect(mockProvider.getCallCount('initialize')).toBe(1);
    });
  });

  describe('Error Scenarios', () => {
    beforeEach(async () => {
      await sdk.initialize({
        provider: mockProvider,
        providerConfig: {
          apiKey: 'test-api-key',
        },
      });
    });

    it('should throw ValidationError for invalid style ID', async () => {
      await expect(
        sdk.generateDesign({
          image: SMALL_TEST_IMAGE.dataUri,
          style: 'non-existent-style',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        sdk.generateDesign({
          image: SMALL_TEST_IMAGE.dataUri,
          style: 'non-existent-style',
        })
      ).rejects.toThrow('not found');
    });

    it('should throw ValidationError for missing image', async () => {
      await expect(
        sdk.generateDesign({
          style: 'modern-minimalist',
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        sdk.generateDesign({
          style: 'modern-minimalist',
        })
      ).rejects.toThrow('Image is required');
    });

    it('should throw ValidationError for missing style', async () => {
      await expect(
        sdk.generateDesign({
          image: SMALL_TEST_IMAGE.dataUri,
        })
      ).rejects.toThrow(ValidationError);

      await expect(
        sdk.generateDesign({
          image: SMALL_TEST_IMAGE.dataUri,
        })
      ).rejects.toThrow('Style is required');
    });

    it('should throw ValidationError for invalid image format', async () => {
      await expect(
        sdk.generateDesign({
          image: INVALID_IMAGE_DATA.dataUri,
          style: 'modern-minimalist',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should handle AI provider errors', async () => {
      // Configure mock to fail on generateImage
      const failingProvider = new MockAIProvider({
        shouldFail: true,
        failOnCall: 'generateImage',
        errorMessage: 'Mock API error for testing',
      });

      await sdk.initialize({
        provider: failingProvider,
        providerConfig: {
          apiKey: 'test-api-key',
        },
      });

      await expect(
        sdk.generateDesign({
          image: SMALL_TEST_IMAGE.dataUri,
          style: 'modern-minimalist',
        })
      ).rejects.toThrow(AIProviderError);
    });

    it('should throw ConfigurationError when SDK not initialized', async () => {
      const uninitializedSDK = new InteriorDesignSDK();

      await expect(
        uninitializedSDK.generateDesign({
          image: SMALL_TEST_IMAGE.dataUri,
          style: 'modern-minimalist',
        })
      ).rejects.toThrow(ConfigurationError);

      await expect(
        uninitializedSDK.generateDesign({
          image: SMALL_TEST_IMAGE.dataUri,
          style: 'modern-minimalist',
        })
      ).rejects.toThrow('must be initialized');
    });

    it('should handle network-like errors from provider', async () => {
      const networkErrorProvider = new MockAIProvider({
        shouldFail: true,
        failOnCall: 'generateImage',
        errorMessage: 'Network error: Connection timeout',
      });

      await sdk.initialize({
        provider: networkErrorProvider,
        providerConfig: {
          apiKey: 'test-api-key',
        },
      });

      await expect(
        sdk.generateDesign({
          image: SMALL_TEST_IMAGE.dataUri,
          style: 'modern-minimalist',
        })
      ).rejects.toThrow(AIProviderError);
    });
  });

  describe('Multiple Generations', () => {
    beforeEach(async () => {
      await sdk.initialize({
        provider: mockProvider,
        providerConfig: {
          apiKey: 'test-api-key',
        },
      });
    });

    it('should generate design with different styles', async () => {
      const styles = ['modern-minimalist', 'scandinavian', 'industrial'];

      for (const style of styles) {
        const result = await sdk.generateDesign({
          image: SMALL_TEST_IMAGE.dataUri,
          style,
        });

        expect(result).toBeDefined();
        expect(result.imageBase64).toBeDefined();
        expect(result.metadata).toBeDefined();
        expect(result.metadata.style).toBe(style);
      }
    });

    it('should maintain consistency across multiple generations', async () => {
      const results = [];

      // Generate 3 designs with same inputs
      for (let i = 0; i < 3; i++) {
        const result = await sdk.generateDesign({
          image: SMALL_TEST_IMAGE.dataUri,
          style: 'modern-minimalist',
        });
        results.push(result);
      }

      // All should have same structure
      results.forEach((result) => {
        expect(result).toHaveProperty('imageBase64');
        expect(result).toHaveProperty('metadata');
        expect(result.metadata.provider).toBe('MockAIProvider');
        expect(result.metadata.style).toBe('modern-minimalist');
      });
    });

    it('should handle sequential generations with different parameters', async () => {
      const result1 = await sdk.generateDesign({
        image: SMALL_TEST_IMAGE.dataUri,
        style: 'modern-minimalist',
        promptParams: {
          roomType: 'living-room',
        },
      });

      const result2 = await sdk.generateDesign({
        image: MEDIUM_TEST_IMAGE.dataUri,
        style: 'scandinavian',
        promptParams: {
          atmosphere: 'cozy',
        },
      });

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.metadata.style).toBe('modern-minimalist');
      expect(result2.metadata.style).toBe('scandinavian');
    });

    it('should track all generation calls', async () => {
      await sdk.generateDesign({
        image: SMALL_TEST_IMAGE.dataUri,
        style: 'modern-minimalist',
      });

      await sdk.generateDesign({
        image: SMALL_TEST_IMAGE.dataUri,
        style: 'scandinavian',
      });

      await sdk.generateDesign({
        image: SMALL_TEST_IMAGE.dataUri,
        style: 'industrial',
      });

      expect(mockProvider.getCallCount('generateImage')).toBe(3);
      const history = mockProvider.getCallHistory('generateImage');
      expect(history.length).toBe(3);
    });
  });

  describe('SDK Utility Methods', () => {
    beforeEach(async () => {
      await sdk.initialize({
        provider: mockProvider,
        providerConfig: {
          apiKey: 'test-api-key',
        },
      });
    });

    it('should get available styles', async () => {
      const styles = await sdk.getAvailableStyles();

      expect(styles).toBeDefined();
      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);
      expect(styles[0]).toHaveProperty('id');
      expect(styles[0]).toHaveProperty('name');
      expect(styles[0]).toHaveProperty('prompt');
    });

    it('should get style by ID', async () => {
      const style = await sdk.getStyleById('modern-minimalist');

      expect(style).toBeDefined();
      expect(style.id).toBe('modern-minimalist');
      expect(style.name).toBe('Modern Minimalist');
    });

    it('should return null for non-existent style', async () => {
      const style = await sdk.getStyleById('non-existent-style');

      expect(style).toBeNull();
    });

    it('should validate connection', async () => {
      const isValid = await sdk.validateConnection();

      expect(isValid).toBe(true);
      expect(mockProvider.getCallCount('validateConnection')).toBe(1);
    });

    it('should get provider info', () => {
      const info = sdk.getProviderInfo();

      expect(info).toBeDefined();
      expect(info.name).toBe('MockAIProvider');
      expect(info.version).toBe('1.0.0-test');
      expect(info.capabilities).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      await sdk.initialize({
        provider: mockProvider,
        providerConfig: {
          apiKey: 'test-api-key',
        },
      });
    });

    it('should handle generation with all optional parameters', async () => {
      const result = await sdk.generateDesign({
        image: SMALL_TEST_IMAGE.dataUri,
        style: 'modern-minimalist',
        promptParams: {
          roomType: 'bedroom',
          colorScheme: 'warm',
          atmosphere: 'cozy',
        },
        generationParams: {
          strength: 0.3,
          cfgScale: 8,
          steps: 40,
        },
        resizeImage: false,
        maxWidth: 2048,
      });

      expect(result).toBeDefined();
      expect(result.imageBase64).toBeDefined();
    });

    it('should handle generation with minimal parameters', async () => {
      const result = await sdk.generateDesign({
        image: SMALL_TEST_IMAGE.dataUri,
        style: 'modern-minimalist',
      });

      expect(result).toBeDefined();
      expect(result.imageBase64).toBeDefined();
    });

    it('should handle rapid sequential calls', async () => {
      const promises = [];

      for (let i = 0; i < 5; i++) {
        promises.push(
          sdk.generateDesign({
            image: SMALL_TEST_IMAGE.dataUri,
            style: 'modern-minimalist',
          })
        );
      }

      const results = await Promise.all(promises);

      expect(results.length).toBe(5);
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(result.imageBase64).toBeDefined();
      });
    });
  });
});

