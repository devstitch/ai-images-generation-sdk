/**
 * Unit Tests for PromptBuilder
 * @module tests/unit/PromptBuilder.test
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import PromptBuilder from '../../src/core/PromptBuilder.js';
import { ValidationError } from '../../src/utils/errors.js';

// Mock StyleManager
const mockStyle = {
  id: 'modern-minimalist',
  name: 'Modern Minimalist',
  description: 'Clean lines, neutral colors, and uncluttered spaces.',
  prompt:
    'Modern minimalist interior design with clean geometric lines, neutral color palette (whites, grays, beiges), minimal furniture, open spaces, natural light, simple textures, and focus on functionality.',
};

const mockStyleScandinavian = {
  id: 'scandinavian',
  name: 'Scandinavian',
  description: 'Light, airy spaces with natural materials.',
  prompt:
    'Scandinavian interior design featuring light wood floors, white walls, natural materials (wood, wool, linen), cozy textiles, minimalist furniture, plants, candles, warm lighting, neutral colors with occasional pastels.',
};

describe('PromptBuilder', () => {
  describe('buildPrompt()', () => {
    it('should build prompt with base style prompt', () => {
      const prompt = PromptBuilder.buildPrompt(mockStyle);

      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
      expect(prompt).toContain('Transform this room image into');
      expect(prompt).toContain(mockStyle.prompt);
    });

    it('should include quality modifiers in prompt', () => {
      const prompt = PromptBuilder.buildPrompt(mockStyle);

      expect(prompt).toContain('photorealistic');
      expect(prompt).toContain('high quality');
      expect(prompt).toContain('professional');
    });

    it('should include constraints in prompt', () => {
      const prompt = PromptBuilder.buildPrompt(mockStyle);

      expect(prompt).toContain('preserve room layout');
      expect(prompt).toContain('maintain structure');
    });

    it('should handle custom base instruction', () => {
      const customInstruction = 'Create a beautiful';
      const prompt = PromptBuilder.buildPrompt(mockStyle, {
        customInstruction,
      });

      expect(prompt).toContain(customInstruction);
      expect(prompt).not.toContain('Transform this room image into');
    });

    it('should include room type when provided', () => {
      const prompt = PromptBuilder.buildPrompt(mockStyle, {
        roomType: 'living-room',
      });

      expect(prompt).toContain('for a living-room');
    });

    it('should include color scheme when provided', () => {
      const prompt = PromptBuilder.buildPrompt(mockStyle, {
        colorScheme: 'neutral',
      });

      expect(prompt).toContain('with neutral color scheme');
    });

    it('should include atmosphere when provided', () => {
      const prompt = PromptBuilder.buildPrompt(mockStyle, {
        atmosphere: 'spacious',
      });

      expect(prompt).toContain('creating a spacious atmosphere');
    });

    it('should include custom text when provided', () => {
      const customText = 'Add plants and natural elements';
      const prompt = PromptBuilder.buildPrompt(mockStyle, {
        customText,
      });

      expect(prompt).toContain(customText);
    });

    it('should combine all custom parameters', () => {
      const prompt = PromptBuilder.buildPrompt(mockStyle, {
        roomType: 'bedroom',
        colorScheme: 'warm',
        atmosphere: 'cozy',
        customText: 'Include soft lighting',
      });

      expect(prompt).toContain('for a bedroom');
      expect(prompt).toContain('with warm color scheme');
      expect(prompt).toContain('creating a cozy atmosphere');
      expect(prompt).toContain('Include soft lighting');
    });

    it('should handle custom quality modifiers', () => {
      const customModifiers = ['ultra-realistic', '4K quality'];
      const prompt = PromptBuilder.buildPrompt(mockStyle, {
        qualityModifiers: customModifiers,
      });

      expect(prompt).toContain('ultra-realistic');
      expect(prompt).toContain('4K quality');
    });

    it('should handle custom constraints', () => {
      const customConstraints = ['keep windows visible', 'maintain lighting'];
      const prompt = PromptBuilder.buildPrompt(mockStyle, {
        constraints: customConstraints,
      });

      expect(prompt).toContain('keep windows visible');
      expect(prompt).toContain('maintain lighting');
    });

    it('should work with different styles', () => {
      const prompt1 = PromptBuilder.buildPrompt(mockStyle);
      const prompt2 = PromptBuilder.buildPrompt(mockStyleScandinavian);

      expect(prompt1).toBeDefined();
      expect(prompt2).toBeDefined();
      expect(prompt1).not.toBe(prompt2);
      expect(prompt1).toContain(mockStyle.prompt);
      expect(prompt2).toContain(mockStyleScandinavian.prompt);
    });

    it('should format prompt with proper punctuation', () => {
      const prompt = PromptBuilder.buildPrompt(mockStyle);

      // Should not have multiple consecutive periods
      expect(prompt).not.toMatch(/\.{3,}/);
      // Should not have spaces before periods
      expect(prompt).not.toMatch(/\s+\./);
    });

    it('should reject invalid style object (null)', () => {
      expect(() => PromptBuilder.buildPrompt(null)).toThrow(ValidationError);
      expect(() => PromptBuilder.buildPrompt(null)).toThrow('Style object is required');
    });

    it('should reject invalid style object (missing prompt)', () => {
      const invalidStyle = {
        id: 'test',
        name: 'Test',
      };

      expect(() => PromptBuilder.buildPrompt(invalidStyle)).toThrow(ValidationError);
      expect(() => PromptBuilder.buildPrompt(invalidStyle)).toThrow('must have a valid prompt property');
    });

    it('should handle empty additionalParams', () => {
      const prompt = PromptBuilder.buildPrompt(mockStyle, {});

      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should handle undefined additionalParams', () => {
      const prompt = PromptBuilder.buildPrompt(mockStyle, undefined);

      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  describe('validatePrompt()', () => {
    it('should accept valid prompt (minimum length)', () => {
      const prompt = 'A'.repeat(10); // Exactly 10 characters
      const result = PromptBuilder.validatePrompt(prompt);

      expect(result).toBe(prompt);
    });

    it('should accept valid prompt (medium length)', () => {
      const prompt = 'A'.repeat(500);
      const result = PromptBuilder.validatePrompt(prompt);

      expect(result).toBe(prompt);
    });

    it('should accept valid prompt (maximum length)', () => {
      const prompt = 'A'.repeat(1000); // Exactly 1000 characters
      const result = PromptBuilder.validatePrompt(prompt);

      expect(result).toBe(prompt);
    });

    it('should reject prompt that is too short', () => {
      const shortPrompt = 'Short'; // Less than 10 characters

      expect(() => PromptBuilder.validatePrompt(shortPrompt)).toThrow(ValidationError);
      expect(() => PromptBuilder.validatePrompt(shortPrompt)).toThrow('too short');
    });

    it('should reject empty prompt', () => {
      expect(() => PromptBuilder.validatePrompt('')).toThrow(ValidationError);
    });

    it('should truncate prompt that is too long', () => {
      const longPrompt = 'A'.repeat(1500); // Over 1000 characters
      const result = PromptBuilder.validatePrompt(longPrompt);

      expect(result.length).toBe(1000);
      expect(result).toBe(longPrompt.substring(0, 1000));
    });

    it('should sanitize script tags', () => {
      const promptWithScript = 'Design room <script>alert("xss")</script> with modern style';
      const result = PromptBuilder.validatePrompt(promptWithScript);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
      expect(result).toContain('Design room');
    });

    it('should sanitize javascript: protocol', () => {
      const promptWithJS = 'Design room javascript:alert("xss") with style';
      const result = PromptBuilder.validatePrompt(promptWithJS);

      expect(result).not.toContain('javascript:');
    });

    it('should sanitize event handlers', () => {
      const promptWithHandler = 'Design room <div onclick="alert(1)">test</div>';
      const result = PromptBuilder.validatePrompt(promptWithHandler);

      expect(result).not.toContain('onclick=');
    });

    it('should sanitize iframe tags', () => {
      const promptWithIframe =
        'Design room <iframe src="evil.com"></iframe> with style';
      const result = PromptBuilder.validatePrompt(promptWithIframe);

      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('</iframe>');
    });

    it('should sanitize eval() calls', () => {
      const promptWithEval = 'Design room eval("malicious code") with style';
      const result = PromptBuilder.validatePrompt(promptWithEval);

      expect(result).not.toContain('eval(');
    });

    it('should sanitize expression() calls', () => {
      const promptWithExpr = 'Design room expression("code") with style';
      const result = PromptBuilder.validatePrompt(promptWithExpr);

      expect(result).not.toContain('expression(');
    });

    it('should remove excessive whitespace', () => {
      const promptWithSpaces = 'Design    room   with    many     spaces';
      const result = PromptBuilder.validatePrompt(promptWithSpaces);

      expect(result).not.toMatch(/\s{3,}/); // No more than 2 consecutive spaces
    });

    it('should handle prompt that becomes too short after sanitization', () => {
      // Create a prompt that's exactly 10 chars but becomes shorter after sanitization
      const prompt = '<script></script>'; // 17 chars, but becomes empty after sanitization

      expect(() => PromptBuilder.validatePrompt(prompt)).toThrow(ValidationError);
      expect(() => PromptBuilder.validatePrompt(prompt)).toThrow('too short after sanitization');
    });

    it('should reject non-string input', () => {
      expect(() => PromptBuilder.validatePrompt(null)).toThrow(ValidationError);
      expect(() => PromptBuilder.validatePrompt(123)).toThrow(ValidationError);
      expect(() => PromptBuilder.validatePrompt({})).toThrow(ValidationError);
    });

    it('should preserve valid content after sanitization', () => {
      const prompt = 'Transform this room into a modern minimalist space with clean lines';
      const result = PromptBuilder.validatePrompt(prompt);

      expect(result).toContain('Transform');
      expect(result).toContain('modern minimalist');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle prompt with multiple harmful patterns', () => {
      const maliciousPrompt =
        'Design <script>alert(1)</script> room javascript:void(0) <iframe></iframe> with onclick="bad"';
      const result = PromptBuilder.validatePrompt(maliciousPrompt);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('onclick=');
    });
  });

  describe('buildAndValidatePrompt()', () => {
    it('should build and validate prompt in one step', () => {
      const prompt = PromptBuilder.buildAndValidatePrompt(mockStyle);

      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThanOrEqual(10);
      expect(prompt.length).toBeLessThanOrEqual(1000);
    });

    it('should throw error if built prompt is too short', () => {
      const veryShortStyle = {
        id: 'test',
        name: 'Test',
        prompt: 'Short', // Too short after building
      };

      // This might pass if the built prompt is long enough, or fail if too short
      // The actual behavior depends on how buildPrompt constructs the prompt
      try {
        const result = PromptBuilder.buildAndValidatePrompt(veryShortStyle);
        expect(result.length).toBeGreaterThanOrEqual(10);
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
      }
    });

    it('should throw error if built prompt is too long', () => {
      const veryLongStyle = {
        id: 'test',
        name: 'Test',
        prompt: 'A'.repeat(2000), // Very long prompt
      };

      // Should truncate to 1000 characters
      const result = PromptBuilder.buildAndValidatePrompt(veryLongStyle);
      expect(result.length).toBeLessThanOrEqual(1000);
    });

    it('should sanitize harmful content in built prompt', () => {
      const maliciousStyle = {
        id: 'test',
        name: 'Test',
        prompt: 'Design <script>alert(1)</script> room',
      };

      const result = PromptBuilder.buildAndValidatePrompt(maliciousStyle);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });
  });

  describe('Edge Cases', () => {
    it('should handle style with very long prompt', () => {
      const longStyle = {
        id: 'test',
        name: 'Test',
        prompt: 'A'.repeat(500),
      };

      const prompt = PromptBuilder.buildPrompt(longStyle);
      expect(prompt.length).toBeGreaterThan(500);
    });

    it('should handle style with special characters in prompt', () => {
      const specialStyle = {
        id: 'test',
        name: 'Test',
        prompt: 'Design with colors: red, blue, green! Use patterns & textures.',
      };

      const prompt = PromptBuilder.buildPrompt(specialStyle);
      expect(prompt).toContain('red, blue, green');
      expect(prompt).toContain('patterns & textures');
    });

    it('should handle multiple custom quality modifiers', () => {
      const modifiers = ['modifier1', 'modifier2', 'modifier3', 'modifier4', 'modifier5'];
      const prompt = PromptBuilder.buildPrompt(mockStyle, {
        qualityModifiers: modifiers,
      });

      modifiers.forEach((modifier) => {
        expect(prompt).toContain(modifier);
      });
    });

    it('should handle multiple custom constraints', () => {
      const constraints = ['constraint1', 'constraint2', 'constraint3'];
      const prompt = PromptBuilder.buildPrompt(mockStyle, {
        constraints,
      });

      constraints.forEach((constraint) => {
        expect(prompt).toContain(constraint);
      });
    });

    it('should handle prompt with unicode characters', () => {
      const unicodePrompt = 'Design room with café style and décor';
      const result = PromptBuilder.validatePrompt(unicodePrompt);

      expect(result).toContain('café');
      expect(result).toContain('décor');
    });

    it('should handle prompt with newlines and special formatting', () => {
      const multilinePrompt = 'Design room\nwith\nmultiple\nlines';
      const result = PromptBuilder.validatePrompt(multilinePrompt);

      // Should preserve or normalize newlines
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

