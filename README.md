# 🎨 AI Interior Design SDK

> Transform any room image into stunning interior designs using AI-powered style generation.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue)](LICENSE)
[![ES Modules](https://img.shields.io/badge/module-ESM-green)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

A powerful Node.js SDK that leverages AI image generation to transform room photos into professionally designed interior spaces. Choose from multiple design styles, customize parameters, and generate high-quality design visualizations.

## ✨ Key Features

- **🎯 Multiple Design Styles** - 8 pre-configured interior design styles (Modern Minimalist, Scandinavian, Industrial, and more)
- **🖼️ Image-to-Image Generation** - Transform existing room photos into redesigned spaces
- **⚙️ Flexible Configuration** - Customize prompts, room types, color schemes, and atmosphere
- **🛡️ Robust Error Handling** - Comprehensive error types with clear messages
- **📦 Provider Agnostic** - Extensible architecture supporting multiple AI providers (Stability AI included)

## 📦 Installation

```bash
npm install ai-interior-design-sdk
```

**Requirements:**
- Node.js >= 18.0.0
- npm or yarn

## 🚀 Quick Start

```javascript
import InteriorDesignSDK from 'ai-interior-design-sdk';
import StabilityAI from 'ai-interior-design-sdk/providers/StabilityAI';

const sdk = new InteriorDesignSDK();
const provider = new StabilityAI();

await sdk.initialize({
  provider,
  providerConfig: { apiKey: process.env.STABILITY_AI_API_KEY }
});

const result = await sdk.generateDesign({
  image: './room.jpg',
  style: 'modern-minimalist'
});
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `STABILITY_AI_API_KEY` | Stability AI API key | Yes | - |

### Provider Configuration

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `apiKey` | `string` | API key for the AI provider | Required |
| `timeout` | `number` | Request timeout in milliseconds | `60000` |
| `baseURL` | `string` | Custom API base URL | Provider default |
| `retry.maxAttempts` | `number` | Maximum retry attempts | `3` |

### SDK Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `resizeImage` | `boolean` | Whether to resize image before processing | `true` |
| `maxWidth` | `number` | Maximum image width for resizing | `1024` |

## 📚 API Reference

### `initialize(config)`

Initializes the SDK with an AI provider.

**Parameters:**
- `config.provider` (Object, required) - AI provider instance (must extend `AIProvider`)
- `config.providerConfig` (Object, required) - Provider configuration
  - `apiKey` (string, required) - API key for the provider
  - `timeout` (number, optional) - Request timeout in milliseconds
  - `baseURL` (string, optional) - Custom API base URL
  - `retry` (Object, optional) - Retry configuration

**Returns:** `Promise<void>`

**Throws:** `ConfigurationError` if configuration is invalid

**Example:**
```javascript
await sdk.initialize({
  provider: new StabilityAI(),
  providerConfig: {
    apiKey: process.env.STABILITY_AI_API_KEY,
    timeout: 30000
  }
});
```

---

### `generateDesign(options)`

Generates an interior design from an input room image.

**Parameters:**
- `options.image` (string|Buffer, required) - Input room image (file path, Buffer, or base64)
- `options.style` (string, required) - Style ID (e.g., 'modern-minimalist')
- `options.promptParams` (Object, optional) - Additional prompt parameters
  - `roomType` (string) - Room type (e.g., 'living-room', 'bedroom')
  - `colorScheme` (string) - Color scheme (e.g., 'neutral', 'warm', 'cool')
  - `atmosphere` (string) - Desired atmosphere (e.g., 'spacious', 'cozy')
  - `customText` (string) - Additional custom text for the prompt
- `options.generationParams` (Object, optional) - Provider-specific generation parameters
  - `strength` (number) - Image transformation strength (0-1)
  - `cfgScale` (number) - Guidance scale
  - `steps` (number) - Number of generation steps
- `options.resizeImage` (boolean, optional) - Whether to resize image (default: `true`)
- `options.maxWidth` (number, optional) - Maximum image width (default: `1024`)

**Returns:** `Promise<Object>`
- `imageBase64` (string) - Generated design image as base64 data URI
- `metadata` (Object) - Generation metadata
  - `provider` (string) - Provider name
  - `model` (string) - Model used
  - `steps` (number) - Generation steps
  - `cfgScale` (number) - Guidance scale
  - `strength` (number) - Transformation strength
  - `timestamp` (string) - Generation timestamp
  - `prompt` (string) - Generated prompt
  - `style` (string) - Style ID used

**Throws:** 
- `ValidationError` - If input validation fails
- `AIProviderError` - If AI generation fails
- `ConfigurationError` - If SDK is not initialized

**Example:**
```javascript
const result = await sdk.generateDesign({
  image: './room.jpg',
  style: 'scandinavian',
  promptParams: {
    roomType: 'living-room',
    colorScheme: 'neutral',
    atmosphere: 'spacious'
  },
  generationParams: {
    strength: 0.35,
    cfgScale: 7,
    steps: 30
  }
});

// Save the result
const fs = await import('fs/promises');
const imageBuffer = Buffer.from(
  result.imageBase64.split(',')[1], 
  'base64'
);
await fs.writeFile('output.jpg', imageBuffer);
```

---

### `getAvailableStyles()`

Retrieves all available interior design styles.

**Returns:** `Promise<Array<Object>>`
- Each style object contains:
  - `id` (string) - Style identifier
  - `name` (string) - Display name
  - `description` (string) - Style description
  - `prompt` (string) - Style-specific prompt

**Example:**
```javascript
const styles = await sdk.getAvailableStyles();
console.log(`Available styles: ${styles.map(s => s.name).join(', ')}`);
```

---

### `getStyleById(id)`

Retrieves a specific style by its ID.

**Parameters:**
- `id` (string, required) - Style identifier

**Returns:** `Promise<Object|null>` - Style object or `null` if not found

**Example:**
```javascript
const style = await sdk.getStyleById('modern-minimalist');
if (style) {
  console.log(style.name); // "Modern Minimalist"
}
```

---

### `validateConnection()`

Validates the API connection and credentials.

**Returns:** `Promise<boolean>` - `true` if connection is valid

**Throws:** `AIProviderError` if validation fails

**Example:**
```javascript
try {
  const isValid = await sdk.validateConnection();
  console.log('Connection valid:', isValid);
} catch (error) {
  console.error('Connection failed:', error.message);
}
```

---

### `getProviderInfo()`

Gets information about the current AI provider.

**Returns:** `Object|null`
- `name` (string) - Provider name
- `version` (string) - Provider version
- `capabilities` (Object) - Provider capabilities

**Example:**
```javascript
const info = sdk.getProviderInfo();
console.log(`Using provider: ${info.name} v${info.version}`);
```

## 🎨 Available Styles

| Style ID | Name | Description |
|----------|------|-------------|
| `modern-minimalist` | Modern Minimalist | Clean lines, neutral colors, and uncluttered spaces with a focus on functionality and simplicity |
| `scandinavian` | Scandinavian | Light, airy spaces with natural materials, cozy textiles, and hygge-inspired comfort |
| `industrial` | Industrial | Raw materials, exposed brick, metal accents, and urban loft aesthetic |
| `bohemian` | Bohemian | Eclectic mix of patterns, textures, colors, and global-inspired decor |
| `mid-century-modern` | Mid-Century Modern | Retro-inspired furniture, clean lines, organic shapes, and bold colors |
| `contemporary` | Contemporary | Current design trends, clean aesthetics, and modern materials |
| `traditional` | Traditional | Classic elegance, rich colors, ornate details, and timeless furniture |
| `coastal` | Coastal | Light colors, natural textures, beach-inspired elements, and airy atmosphere |

## ⚠️ Error Handling

The SDK uses custom error classes for better error handling:

### Error Types

| Error Class | When It's Thrown | Example |
|-------------|------------------|---------|
| `ValidationError` | Input validation fails | Invalid image format, missing required parameters |
| `AIProviderError` | AI provider API errors | Network failures, API rate limits, invalid responses |
| `ConfigurationError` | SDK configuration issues | Missing API key, invalid provider setup |
| `ImageProcessingError` | Image processing failures | Image loading errors, format conversion issues |

### Error Handling Example

```javascript
import { ValidationError, AIProviderError, ConfigurationError } from 'ai-interior-design-sdk';

try {
  const result = await sdk.generateDesign({
    image: './room.jpg',
    style: 'modern-minimalist'
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
    // Handle validation errors (e.g., invalid input)
  } else if (error instanceof AIProviderError) {
    console.error('AI provider error:', error.message);
    // Handle API errors (e.g., retry logic)
  } else if (error instanceof ConfigurationError) {
    console.error('Configuration error:', error.message);
    // Handle configuration errors (e.g., missing API key)
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Error Object Structure

All errors include:
- `message` (string) - Human-readable error message
- `code` (string) - Error code (e.g., 'VALIDATION_ERROR')
- `timestamp` (string) - ISO timestamp when error occurred
- `originalError` (Error|null) - Original error if available

## 📖 Examples

### Basic Usage

See [examples/basic.js](examples/basic.js) for a complete working example.

```javascript
import InteriorDesignSDK from 'ai-interior-design-sdk';
import StabilityAI from 'ai-interior-design-sdk/providers/StabilityAI';
import dotenv from 'dotenv';

dotenv.config();

const sdk = new InteriorDesignSDK();
const provider = new StabilityAI();

await sdk.initialize({
  provider,
  providerConfig: {
    apiKey: process.env.STABILITY_AI_API_KEY
  }
});

const result = await sdk.generateDesign({
  image: './room.png',
  style: 'modern-minimalist',
  promptParams: {
    roomType: 'living-room',
    atmosphere: 'spacious'
  }
});

// Save result
const fs = await import('fs/promises');
const imageBuffer = Buffer.from(
  result.imageBase64.split(',')[1],
  'base64'
);
await fs.writeFile('output/result.jpg', imageBuffer);
```

### Using Different Input Types

```javascript
// From file path
await sdk.generateDesign({
  image: './room.jpg',
  style: 'scandinavian'
});

// From Buffer
const fs = await import('fs/promises');
const imageBuffer = await fs.readFile('./room.jpg');
await sdk.generateDesign({
  image: imageBuffer,
  style: 'scandinavian'
});

// From base64
const base64Image = 'data:image/png;base64,iVBORw0KGgo...';
await sdk.generateDesign({
  image: base64Image,
  style: 'scandinavian'
});
```

### Custom Generation Parameters

```javascript
const result = await sdk.generateDesign({
  image: './room.jpg',
  style: 'industrial',
  generationParams: {
    strength: 0.3,      // Lower = more transformation
    cfgScale: 8,        // Higher = more adherence to prompt
    steps: 40           // More steps = higher quality (slower)
  }
});
```

### Batch Processing

```javascript
const styles = ['modern-minimalist', 'scandinavian', 'industrial'];

for (const style of styles) {
  const result = await sdk.generateDesign({
    image: './room.jpg',
    style
  });
  
  const fs = await import('fs/promises');
  const imageBuffer = Buffer.from(
    result.imageBase64.split(',')[1],
    'base64'
  );
  await fs.writeFile(`output/${style}.jpg`, imageBuffer);
}
```

## 💡 Best Practices

### 1. Image Quality
- **Use high-quality input images** - Better input = better output
- **Recommended resolution** - 1024x1024 or higher for best results
- **Supported formats** - JPG, PNG, WebP

### 2. Style Selection
- **Match style to room type** - Some styles work better for specific rooms
- **Experiment with different styles** - Try multiple styles to find the best match
- **Use style descriptions** - Check available styles to understand each one

### 3. Prompt Parameters
- **Be specific** - Use clear room types and atmospheres
- **Combine parameters** - Use multiple prompt parameters for better results
- **Custom text** - Add specific requirements via `customText`

### 4. Generation Parameters
- **Strength** - Lower values (0.3-0.4) for more transformation, higher (0.5-0.7) for subtle changes
- **Steps** - More steps (30-50) for higher quality but slower generation
- **CFG Scale** - Higher values (7-9) for better prompt adherence

### 5. Error Handling
- **Always use try-catch** - Wrap API calls in error handling
- **Check error types** - Use specific error classes for better handling
- **Retry logic** - Implement retry for transient errors (network issues)

### 6. Performance
- **Resize large images** - Use `resizeImage: true` for faster processing
- **Batch processing** - Process multiple images sequentially, not in parallel
- **Cache results** - Store generated images to avoid regeneration

### Common Pitfalls

❌ **Don't:**
- Use images smaller than 256x256 pixels
- Use unsupported image formats (GIF, SVG, etc.)
- Forget to initialize the SDK before use
- Use invalid style IDs
- Ignore error handling

✅ **Do:**
- Validate inputs before calling the SDK
- Use proper error handling
- Check available styles before using
- Test with small images first
- Monitor API rate limits

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-username/ai-interior-design-sdk.git

# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

### Code Style

- Use ES Modules (ESM)
- Follow ESLint rules
- Use Prettier for formatting
- Write tests for new features
- Update documentation

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Stability AI](https://stability.ai/) for image generation
- Uses [Sharp](https://sharp.pixelplumbing.com/) for image processing
- Inspired by modern interior design trends

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/ai-interior-design-sdk/issues)
- **Documentation**: [Full API Docs](docs/API.md)
- **Examples**: [Examples Directory](examples/)

---

Made with ❤️ for interior design enthusiasts

