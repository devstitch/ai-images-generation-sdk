/**
 * AI Interior Design SDK
 * Main entry point for the SDK
 * 
 * @example
 * ```javascript
 * import InteriorDesignSDK, { ValidationError, AIProviderError } from 'ai-interior-design-sdk';
 * import StabilityAI from 'ai-interior-design-sdk/providers/StabilityAI';
 * 
 * // Initialize SDK
 * const sdk = new InteriorDesignSDK();
 * const provider = new StabilityAI();
 * 
 * await sdk.initialize({
 *   provider,
 *   providerConfig: {
 *     apiKey: process.env.STABILITY_AI_API_KEY
 *   }
 * });
 * 
 * // Generate design
 * try {
 *   const result = await sdk.generateDesign({
 *     image: './room.jpg',
 *     style: 'modern-minimalist',
 *     promptParams: {
 *       roomType: 'living-room',
 *       atmosphere: 'spacious'
 *     }
 *   });
 * 
 *   console.log('Generated image:', result.imageBase64);
 *   console.log('Metadata:', result.metadata);
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.error('Validation error:', error.message);
 *   } else if (error instanceof AIProviderError) {
 *     console.error('AI provider error:', error.message);
 *   }
 * }
 * ```
 * 
 * @module index
 */

import InteriorDesignSDK from './core/SDK.js';
import { ValidationError, AIProviderError } from './utils/errors.js';

// Default export
export default InteriorDesignSDK;

// Named exports
export { InteriorDesignSDK, ValidationError, AIProviderError };
