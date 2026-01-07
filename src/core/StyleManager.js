/**
 * Style Manager
 * Manages interior design styles loaded from JSON
 * @module core/StyleManager
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { ValidationError, ConfigurationError } from '../utils/errors.js';
import { debug, info, error } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * StyleManager class
 * Loads and manages interior design styles
 */
class StyleManager {
  constructor() {
    this.styles = null;
    this.stylesPath = join(__dirname, '../data/styles.json');
  }

  /**
   * Load styles from JSON file
   * @private
   * @returns {Promise<Array>} Array of style objects
   */
  async _loadStyles() {
    if (this.styles !== null) {
      debug('Returning cached styles');
      return this.styles;
    }

    try {
      debug('Loading styles from file:', this.stylesPath);
      const fileContent = await readFile(this.stylesPath, 'utf-8');
      const data = JSON.parse(fileContent);

      if (!data.styles || !Array.isArray(data.styles)) {
        throw new ConfigurationError(
          'Invalid styles.json format: missing or invalid styles array'
        );
      }

      this.styles = data.styles;
      info('Styles loaded successfully', { count: this.styles.length });
      return this.styles;
    } catch (err) {
      if (err instanceof ConfigurationError) {
        throw err;
      }

      if (err.code === 'ENOENT') {
        throw new ConfigurationError(
          `Styles file not found: ${this.stylesPath}`,
          err
        );
      }

      if (err instanceof SyntaxError) {
        throw new ConfigurationError(
          `Invalid JSON in styles file: ${err.message}`,
          err
        );
      }

      error('Failed to load styles', err);
      throw new ConfigurationError('Failed to load styles', err);
    }
  }

  /**
   * Get all available styles
   * @returns {Promise<Array>} Array of all style objects
   */
  async getAvailableStyles() {
    const styles = await this._loadStyles();
    return [...styles]; // Return copy to prevent mutation
  }

  /**
   * Get style by ID
   * @param {string} id - Style ID (e.g., 'modern-minimalist')
   * @returns {Promise<Object|null>} Style object or null if not found
   */
  async getStyleById(id) {
    if (!id || typeof id !== 'string') {
      return null;
    }

    const styles = await this._loadStyles();
    const style = styles.find((s) => s.id === id);
    return style || null;
  }

  /**
   * Validate that a style exists
   * @param {string} id - Style ID to validate
   * @throws {ValidationError} If style doesn't exist
   * @returns {Promise<Object>} Style object if valid
   */
  async validateStyle(id) {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Style ID must be a non-empty string');
    }

    const style = await this.getStyleById(id);

    if (!style) {
      const styles = await this.getAvailableStyles();
      const availableIds = styles.map((s) => s.id).join(', ');
      throw new ValidationError(
        `Style '${id}' not found. Available styles: ${availableIds}`
      );
    }

    return style;
  }

  /**
   * Clear cached styles (useful for testing or reloading)
   */
  clearCache() {
    this.styles = null;
    debug('Style cache cleared');
  }
}

// Export singleton instance
export default new StyleManager();

