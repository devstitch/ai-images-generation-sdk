/**
 * Prompt Builder
 * Builds and validates prompts for AI interior design generation
 * @module core/PromptBuilder
 */

import { ValidationError } from '../utils/errors.js';
import { debug, warn } from '../utils/logger.js';

/**
 * Prompt configuration constants
 */
const PROMPT_CONFIG = {
  MIN_LENGTH: 10,
  MAX_LENGTH: 1000,
  BASE_INSTRUCTION: 'Transform this room image into',
  QUALITY_MODIFIERS: [
    'photorealistic',
    'high quality',
    'professional',
    'detailed',
    'realistic',
  ],
  CONSTRAINTS: [
    'preserve room layout',
    'maintain structure',
    'keep architectural elements',
    'maintain perspective',
  ],
};

/**
 * Potentially harmful content patterns to remove
 */
const HARMFUL_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers like onclick=
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /eval\s*\(/gi,
  /expression\s*\(/gi,
];

/**
 * Prompt Builder class
 */
class PromptBuilder {
  /**
   * Build comprehensive prompt for AI interior design generation
   * @param {Object} style - Style object from StyleManager
   * @param {Object} [additionalParams={}] - Optional custom parameters
   * @param {string} [additionalParams.customInstruction] - Custom base instruction
   * @param {string[]} [additionalParams.qualityModifiers] - Additional quality modifiers
   * @param {string[]} [additionalParams.constraints] - Additional constraints
   * @param {string} [additionalParams.roomType] - Room type (e.g., "living room")
   * @param {string} [additionalParams.colorScheme] - Color scheme preference
   * @param {string} [additionalParams.atmosphere] - Desired atmosphere
   * @param {string} [additionalParams.customText] - Additional custom text
   * @returns {string} Complete prompt string
   * @throws {ValidationError} If style is invalid
   */
  buildPrompt(style, additionalParams = {}) {
    if (!style || typeof style !== 'object') {
      throw new ValidationError('Style object is required');
    }

    if (!style.prompt || typeof style.prompt !== 'string') {
      throw new ValidationError('Style must have a valid prompt property');
    }

    debug('Building prompt for style:', style.id);

    // Start with base instruction
    const baseInstruction =
      additionalParams.customInstruction || PROMPT_CONFIG.BASE_INSTRUCTION;

    // Get style-specific prompt from styles.json
    const stylePrompt = style.prompt.trim();

    // Build quality modifiers section
    const qualityModifiers = this._buildQualityModifiers(
      additionalParams.qualityModifiers
    );

    // Build constraints section
    const constraints = this._buildConstraints(additionalParams.constraints);

    // Build additional context from params
    const additionalContext = this._buildAdditionalContext(additionalParams);

    // Combine all parts
    const promptParts = [
      baseInstruction,
      stylePrompt,
      qualityModifiers,
      constraints,
      additionalContext,
    ].filter(Boolean); // Remove empty strings

    const fullPrompt = promptParts.join('. ').trim();

    // Clean up multiple spaces and periods
    const cleanedPrompt = fullPrompt
      .replace(/\s+/g, ' ')
      .replace(/\.{2,}/g, '.')
      .replace(/\s+\./g, '.')
      .trim();

    debug('Prompt built successfully', { length: cleanedPrompt.length });

    return cleanedPrompt;
  }

  /**
   * Build quality modifiers section
   * @private
   * @param {string[]} [customModifiers] - Custom quality modifiers
   * @returns {string} Quality modifiers text
   */
  _buildQualityModifiers(customModifiers = []) {
    const modifiers = [...PROMPT_CONFIG.QUALITY_MODIFIERS];

    // Add custom modifiers if provided
    if (Array.isArray(customModifiers) && customModifiers.length > 0) {
      customModifiers.forEach((modifier) => {
        if (typeof modifier === 'string' && modifier.trim()) {
          modifiers.push(modifier.trim());
        }
      });
    }

    // Remove duplicates and join
    const uniqueModifiers = [...new Set(modifiers)];
    return uniqueModifiers.join(', ');
  }

  /**
   * Build constraints section
   * @private
   * @param {string[]} [customConstraints] - Custom constraints
   * @returns {string} Constraints text
   */
  _buildConstraints(customConstraints = []) {
    const constraints = [...PROMPT_CONFIG.CONSTRAINTS];

    // Add custom constraints if provided
    if (Array.isArray(customConstraints) && customConstraints.length > 0) {
      customConstraints.forEach((constraint) => {
        if (typeof constraint === 'string' && constraint.trim()) {
          constraints.push(constraint.trim());
        }
      });
    }

    // Remove duplicates and join
    const uniqueConstraints = [...new Set(constraints)];
    return uniqueConstraints.join(', ');
  }

  /**
   * Build additional context from parameters
   * @private
   * @param {Object} params - Additional parameters
   * @returns {string} Additional context text
   */
  _buildAdditionalContext(params) {
    const contextParts = [];

    if (params.roomType && typeof params.roomType === 'string') {
      contextParts.push(`for a ${params.roomType}`);
    }

    if (params.colorScheme && typeof params.colorScheme === 'string') {
      contextParts.push(`with ${params.colorScheme} color scheme`);
    }

    if (params.atmosphere && typeof params.atmosphere === 'string') {
      contextParts.push(`creating a ${params.atmosphere} atmosphere`);
    }

    if (params.customText && typeof params.customText === 'string') {
      contextParts.push(params.customText.trim());
    }

    return contextParts.length > 0 ? contextParts.join(', ') : '';
  }

  /**
   * Validate and sanitize prompt
   * @param {string} prompt - Prompt string to validate
   * @returns {string} Sanitized prompt
   * @throws {ValidationError} If prompt is invalid
   */
  validatePrompt(prompt) {
    if (typeof prompt !== 'string') {
      throw new ValidationError('Prompt must be a string');
    }

    // Check minimum length
    if (prompt.length < PROMPT_CONFIG.MIN_LENGTH) {
      throw new ValidationError(
        `Prompt is too short. Minimum length: ${PROMPT_CONFIG.MIN_LENGTH} characters`
      );
    }

    // Check maximum length
    if (prompt.length > PROMPT_CONFIG.MAX_LENGTH) {
      warn(
        `Prompt exceeds maximum length (${PROMPT_CONFIG.MAX_LENGTH} chars). Truncating...`
      );
      prompt = prompt.substring(0, PROMPT_CONFIG.MAX_LENGTH);
    }

    // Sanitize harmful content
    let sanitized = prompt;
    HARMFUL_PATTERNS.forEach((pattern) => {
      const before = sanitized;
      sanitized = sanitized.replace(pattern, '');
      if (before !== sanitized) {
        warn('Removed potentially harmful content from prompt');
      }
    });

    // Remove excessive whitespace
    sanitized = sanitized
      .replace(/\s+/g, ' ')
      .replace(/\s+\./g, '.')
      .trim();

    // Final length check after sanitization
    if (sanitized.length < PROMPT_CONFIG.MIN_LENGTH) {
      throw new ValidationError(
        'Prompt became too short after sanitization. Please provide more content.'
      );
    }

    debug('Prompt validated and sanitized', {
      originalLength: prompt.length,
      sanitizedLength: sanitized.length,
    });

    return sanitized;
  }

  /**
   * Build and validate prompt in one step
   * @param {Object} style - Style object from StyleManager
   * @param {Object} [additionalParams={}] - Optional custom parameters
   * @returns {string} Validated and sanitized prompt
   * @throws {ValidationError} If prompt is invalid
   */
  buildAndValidatePrompt(style, additionalParams = {}) {
    const prompt = this.buildPrompt(style, additionalParams);
    return this.validatePrompt(prompt);
  }
}

// Export singleton instance
export default new PromptBuilder();

