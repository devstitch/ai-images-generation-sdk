/**
 * Basic Example - AI Interior Design SDK
 * 
 * This example demonstrates how to use the AI Interior Design SDK to generate
 * interior design images from room photos.
 * 
 * REQUIRED ENVIRONMENT VARIABLES:
 * - STABILITY_AI_API_KEY: Your Stability AI API key
 * 
 * REQUIRED FILES:
 * - room.png: Input room image in examples/ directory (or change the path below)
 * 
 * TO RUN:
 * 1. Install dependencies: npm install
 * 2. Set environment variable: export STABILITY_AI_API_KEY=your_key_here
 *    (or create .env file with STABILITY_AI_API_KEY=your_key_here)
 * 3. Add a room image named 'room.png' to the examples/ directory
 * 4. Run: node examples/basic.js
 * 
 * OUTPUT:
 * - Generated design image will be saved to: output/result.jpg
 */

import dotenv from 'dotenv';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import InteriorDesignSDK, {
  ValidationError,
  AIProviderError,
} from '../src/index.js';
import StabilityAI from '../src/providers/StabilityAI.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config();

/**
 * Main example function
 */
async function main() {
  try {
    console.log('🚀 Starting AI Interior Design SDK Example\n');

    // Step 1: Check for required environment variables
    console.log('📋 Step 1: Checking environment variables...');
    const apiKey = process.env.STABILITY_AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'STABILITY_AI_API_KEY environment variable is required.\n' +
          'Please set it in your .env file or export it before running.'
      );
    }
    console.log('✅ API key found\n');

    // Step 2: Initialize the SDK with Stability AI provider
    console.log('⚙️  Step 2: Initializing SDK with Stability AI provider...');
    const sdk = new InteriorDesignSDK();
    const provider = new StabilityAI();

    await sdk.initialize({
      provider,
      providerConfig: {
        apiKey: apiKey,
        timeout: 60000, // 60 seconds
      },
    });
    console.log('✅ SDK initialized successfully\n');

    // Step 3: Validate API connection
    console.log('🔌 Step 3: Validating API connection...');
    const isValid = await sdk.validateConnection();
    if (!isValid) {
      throw new Error('API connection validation failed');
    }
    console.log('✅ API connection validated\n');

    // Step 4: Load input image from file system
    console.log('📸 Step 4: Loading input image...');
    const inputImagePath = join(__dirname, 'room.png');
    console.log(`   Input path: ${inputImagePath}`);
    console.log('✅ Image loaded\n');

    // Step 5: Get available styles (optional - just for demonstration)
    console.log('🎨 Step 5: Getting available styles...');
    const styles = await sdk.getAvailableStyles();
    console.log(`   Found ${styles.length} available styles:`);
    styles.forEach((style) => {
      console.log(`   - ${style.name} (${style.id})`);
    });
    console.log('');

    // Step 6: Generate design with "modern-minimalist" style
    console.log('✨ Step 6: Generating interior design...');
    console.log('   Style: modern-minimalist');
    console.log('   This may take 30-60 seconds...\n');

    const result = await sdk.generateDesign({
      image: inputImagePath,
      style: 'modern-minimalist',
      promptParams: {
        roomType: 'living-room',
        atmosphere: 'spacious',
      },
      resizeImage: true,
      maxWidth: 1024,
    });

    console.log('✅ Design generated successfully!\n');

    // Step 7: Extract base64 data and save to file
    console.log('💾 Step 7: Saving result image...');
    const base64Data = result.imageBase64;

    // Extract base64 string from data URI
    const base64Match = base64Data.match(/^data:image\/[^;]+;base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid base64 data format');
    }

    const imageBuffer = Buffer.from(base64Match[1], 'base64');

    // Create output directory if it doesn't exist
    const outputDir = join(__dirname, 'output');
    try {
      await mkdir(outputDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, ignore error
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }
    const outputPath = join(outputDir, 'result.jpg');

    // Save image to file
    await writeFile(outputPath, imageBuffer);
    console.log(`✅ Image saved to: ${outputPath}\n`);

    // Step 8: Display metadata
    console.log('📊 Step 8: Generation Metadata:');
    console.log('   Provider:', result.metadata.provider);
    console.log('   Model:', result.metadata.model);
    console.log('   Steps:', result.metadata.steps);
    console.log('   CFG Scale:', result.metadata.cfgScale);
    console.log('   Strength:', result.metadata.strength);
    console.log('   Timestamp:', result.metadata.timestamp);
    console.log('');

    console.log('🎉 Example completed successfully!');
    console.log(`📁 Output saved to: ${outputPath}`);
  } catch (error) {
    console.error('\n❌ Error occurred:\n');

    // Handle specific error types
    if (error instanceof ValidationError) {
      console.error('Validation Error:', error.message);
      console.error('\nThis usually means:');
      console.error('- Invalid input image format or path');
      console.error('- Missing required parameters');
      console.error('- Invalid style ID');
    } else if (error instanceof AIProviderError) {
      console.error('AI Provider Error:', error.message);
      console.error('\nThis usually means:');
      console.error('- Network connectivity issues');
      console.error('- API rate limiting');
      console.error('- Invalid API response');
      console.error('- Request timeout');
    } else if (error.code === 'ENOENT') {
      console.error('File Not Found:', error.message);
      console.error('\nPlease ensure:');
      console.error('- Input image exists at: examples/room.png');
      console.error('- The image file is in the examples/ directory');
    } else {
      console.error('Error:', error.message);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    }

    process.exit(1);
  }
}

// Run the example
main();

