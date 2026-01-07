# API Reference

Complete API documentation for the AI Interior Design SDK.

## Table of Contents

- [Type Definitions](#type-definitions)
- [InteriorDesignSDK Class](#interiordesignsdk-class)
  - [constructor()](#constructor)
  - [initialize()](#initializeconfig)
  - [generateDesign()](#generatedesignoptions)
  - [getAvailableStyles()](#getavailablestyles)
  - [getStyleById()](#getstylebyidid)
  - [validateConnection()](#validateconnection)
  - [getProviderInfo()](#getproviderinfo)
- [Error Classes](#error-classes)
- [Common Patterns](#common-patterns)
- [Advanced Usage](#advanced-usage)

---

## Type Definitions

### Configuration Types

```typescript
interface ProviderConfig {
  apiKey: string;              // Required: API key for the provider
  timeout?: number;            // Optional: Request timeout in milliseconds (default: 60000)
  baseURL?: string;           // Optional: Custom API base URL
  retry?: {                   // Optional: Retry configuration
    maxAttempts?: number;     // Maximum retry attempts (default: 3)
  };
}

interface SDKConfig {
  provider: AIProvider;        // Required: AI provider instance
  providerConfig: ProviderConfig; // Required: Provider configuration
  options?: {                  // Optional: Additional SDK options
    resizeImage?: boolean;     // Whether to resize image (default: true)
    maxWidth?: number;         // Maximum image width (default: 1024)
  };
}

interface PromptParams {
  roomType?: string;           // Room type (e.g., 'living-room', 'bedroom')
  colorScheme?: string;        // Color scheme (e.g., 'neutral', 'warm', 'cool')
  atmosphere?: string;         // Desired atmosphere (e.g., 'spacious', 'cozy')
  customText?: string;         // Additional custom text for the prompt
  qualityModifiers?: string[]; // Custom quality modifiers
  constraints?: string[];      // Custom constraints
}

interface GenerationParams {
  strength?: number;           // Image transformation strength (0-1, default: 0.35)
  cfgScale?: number;          // Guidance scale (default: 7)
  steps?: number;             // Number of generation steps (default: 30)
}

interface GenerateDesignOptions {
  image: string | Buffer;     // Required: Input image (file path, Buffer, or base64)
  style: string;               // Required: Style ID
  promptParams?: PromptParams;  // Optional: Additional prompt parameters
  generationParams?: GenerationParams; // Optional: Generation parameters
  resizeImage?: boolean;       // Optional: Whether to resize image (default: true)
  maxWidth?: number;           // Optional: Maximum image width (default: 1024)
}

interface GenerationResult {
  imageBase64: string;         // Generated image as base64 data URI
  metadata: {
    provider: string;          // Provider name
    model: string;             // Model used
    steps: number;             // Generation steps
    cfgScale: number;          // Guidance scale
    strength: number;          // Transformation strength
    timestamp: string;         // ISO timestamp
    prompt: string;            // Generated prompt
    style: string | null;       // Style ID used
  };
}

interface Style {
  id: string;                  // Style identifier
  name: string;                // Display name
  description: string;          // Style description
  prompt: string;               // Style-specific prompt
}

interface ProviderInfo {
  name: string;                // Provider name
  version: string;             // Provider version
  capabilities: {              // Provider capabilities
    imageToImage: boolean;
    textToImage: boolean;
    inpainting: boolean;
    upscaling: boolean;
  };
  isMock?: boolean;            // Whether this is a mock provider (testing)
}
```

---

## InteriorDesignSDK Class

The main SDK class for AI interior design generation.

### constructor()

Creates a new instance of the InteriorDesignSDK.

**Signature:**
```typescript
constructor()
```

**Returns:** `InteriorDesignSDK`

**Example:**
```javascript
import InteriorDesignSDK from 'ai-interior-design-sdk';

const sdk = new InteriorDesignSDK();
```

**Notes:**
- The SDK must be initialized with `initialize()` before use
- Multiple instances can be created for different providers or configurations

---

### initialize(config)

Initializes the SDK with an AI provider and configuration.

**Signature:**
```typescript
async initialize(config: SDKConfig): Promise<void>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config` | `SDKConfig` | Yes | SDK configuration object |
| `config.provider` | `AIProvider` | Yes | AI provider instance (must extend `AIProvider` base class) |
| `config.providerConfig` | `ProviderConfig` | Yes | Provider configuration |
| `config.providerConfig.apiKey` | `string` | Yes | API key for the AI provider |
| `config.providerConfig.timeout` | `number` | No | Request timeout in milliseconds (default: `60000`) |
| `config.providerConfig.baseURL` | `string` | No | Custom API base URL |
| `config.providerConfig.retry` | `Object` | No | Retry configuration |
| `config.providerConfig.retry.maxAttempts` | `number` | No | Maximum retry attempts (default: `3`) |

**Returns:** `Promise<void>`

**Throws:**
- `ConfigurationError` - If configuration is invalid, provider is missing, or initialization fails

**Example 1: Basic Initialization**
```javascript
import InteriorDesignSDK from 'ai-interior-design-sdk';
import StabilityAI from 'ai-interior-design-sdk/providers/StabilityAI';

const sdk = new InteriorDesignSDK();
const provider = new StabilityAI();

await sdk.initialize({
  provider,
  providerConfig: {
    apiKey: process.env.STABILITY_AI_API_KEY
  }
});
```

**Example 2: With Custom Timeout**
```javascript
await sdk.initialize({
  provider,
  providerConfig: {
    apiKey: process.env.STABILITY_AI_API_KEY,
    timeout: 30000  // 30 seconds
  }
});
```

**Example 3: With Retry Configuration**
```javascript
await sdk.initialize({
  provider,
  providerConfig: {
    apiKey: process.env.STABILITY_AI_API_KEY,
    retry: {
      maxAttempts: 5  // Retry up to 5 times
    }
  }
});
```

**Example 4: With Custom Base URL**
```javascript
await sdk.initialize({
  provider,
  providerConfig: {
    apiKey: process.env.STABILITY_AI_API_KEY,
    baseURL: 'https://custom-api.example.com'
  }
});
```

**Edge Cases & Gotchas:**

1. **Provider Validation**: The SDK validates that the provider implements all required methods (`initialize`, `generateImage`, `validateConnection`, `getProviderInfo`). If any method is missing, a `ConfigurationError` is thrown.

2. **API Key Validation**: Empty or whitespace-only API keys will throw a `ConfigurationError`.

3. **Multiple Initializations**: You can re-initialize the SDK with a different provider, but this will replace the previous provider.

4. **Async Initialization**: Always use `await` when calling `initialize()` to ensure the SDK is ready before use.

5. **Error Handling**: Provider initialization errors are wrapped in `ConfigurationError` with the original error preserved in `originalError`.

---

### generateDesign(options)

Generates an interior design from an input room image.

**Signature:**
```typescript
async generateDesign(options: GenerateDesignOptions): Promise<GenerationResult>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `options` | `GenerateDesignOptions` | Yes | Generation options |
| `options.image` | `string \| Buffer` | Yes | Input image (file path, Buffer, or base64 data URI) |
| `options.style` | `string` | Yes | Style ID (e.g., 'modern-minimalist') |
| `options.promptParams` | `PromptParams` | No | Additional prompt parameters |
| `options.promptParams.roomType` | `string` | No | Room type (e.g., 'living-room', 'bedroom') |
| `options.promptParams.colorScheme` | `string` | No | Color scheme (e.g., 'neutral', 'warm', 'cool') |
| `options.promptParams.atmosphere` | `string` | No | Desired atmosphere (e.g., 'spacious', 'cozy') |
| `options.promptParams.customText` | `string` | No | Additional custom text for the prompt |
| `options.generationParams` | `GenerationParams` | No | Provider-specific generation parameters |
| `options.generationParams.strength` | `number` | No | Image transformation strength (0-1, default: `0.35`) |
| `options.generationParams.cfgScale` | `number` | No | Guidance scale (default: `7`) |
| `options.generationParams.steps` | `number` | No | Number of generation steps (default: `30`) |
| `options.resizeImage` | `boolean` | No | Whether to resize image (default: `true`) |
| `options.maxWidth` | `number` | No | Maximum image width for resizing (default: `1024`) |

**Returns:** `Promise<GenerationResult>`

**Return Structure:**
```typescript
{
  imageBase64: string;  // Generated image as base64 data URI (format: "data:image/png;base64,...")
  metadata: {
    provider: string;    // Provider name (e.g., "StabilityAI")
    model: string;      // Model used (e.g., "stable-diffusion-xl-1024-v1-0")
    steps: number;      // Number of generation steps
    cfgScale: number;   // Guidance scale used
    strength: number;   // Transformation strength used
    timestamp: string;  // ISO timestamp of generation
    prompt: string;     // Full prompt used for generation
    style: string | null; // Style ID used
  }
}
```

**Throws:**
- `ConfigurationError` - If SDK is not initialized
- `ValidationError` - If input validation fails (invalid image, style, format, size)
- `AIProviderError` - If AI generation fails (network errors, API errors, rate limits)
- `ImageProcessingError` - If image processing fails

**Example 1: Basic Generation**
```javascript
const result = await sdk.generateDesign({
  image: './room.jpg',
  style: 'modern-minimalist'
});

console.log('Generated image:', result.imageBase64);
console.log('Metadata:', result.metadata);
```

**Example 2: With Prompt Parameters**
```javascript
const result = await sdk.generateDesign({
  image: './room.jpg',
  style: 'scandinavian',
  promptParams: {
    roomType: 'living-room',
    colorScheme: 'neutral',
    atmosphere: 'spacious'
  }
});
```

**Example 3: With Generation Parameters**
```javascript
const result = await sdk.generateDesign({
  image: './room.jpg',
  style: 'industrial',
  generationParams: {
    strength: 0.3,      // More transformation
    cfgScale: 8,        // Higher guidance
    steps: 40           // More steps for quality
  }
});
```

**Example 4: Using Buffer Input**
```javascript
import { readFile } from 'fs/promises';

const imageBuffer = await readFile('./room.jpg');
const result = await sdk.generateDesign({
  image: imageBuffer,
  style: 'modern-minimalist'
});
```

**Example 5: Using Base64 Input**
```javascript
const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...';
const result = await sdk.generateDesign({
  image: base64Image,
  style: 'scandinavian'
});
```

**Example 6: Disabling Image Resizing**
```javascript
const result = await sdk.generateDesign({
  image: './room.jpg',
  style: 'modern-minimalist',
  resizeImage: false  // Keep original image size
});
```

**Example 7: Custom Max Width**
```javascript
const result = await sdk.generateDesign({
  image: './room.jpg',
  style: 'modern-minimalist',
  maxWidth: 2048  // Resize to max 2048px width
});
```

**Example 8: Complete Configuration**
```javascript
const result = await sdk.generateDesign({
  image: './room.jpg',
  style: 'bohemian',
  promptParams: {
    roomType: 'bedroom',
    colorScheme: 'warm',
    atmosphere: 'cozy',
    customText: 'Include plants and natural elements'
  },
  generationParams: {
    strength: 0.35,
    cfgScale: 7,
    steps: 30
  },
  resizeImage: true,
  maxWidth: 1024
});
```

**Edge Cases & Gotchas:**

1. **Image Format Support**: Only JPG, PNG, and WebP formats are supported. Other formats will throw a `ValidationError`.

2. **Image Size Limit**: Maximum image size is 5MB. Larger images will throw a `ValidationError`.

3. **Style Validation**: Invalid style IDs will throw a `ValidationError` with available styles listed in the error message.

4. **Base64 Format**: Base64 images must be in data URI format (`data:image/[type];base64,[data]`) or plain base64 string.

5. **File Path Resolution**: File paths are resolved relative to the current working directory. Use absolute paths if needed.

6. **Image Resizing**: By default, images are resized to a maximum width of 1024px while maintaining aspect ratio. This improves processing speed and API compatibility.

7. **Strength Parameter**: Lower values (0.3-0.4) result in more transformation, while higher values (0.5-0.7) preserve more of the original image.

8. **Steps Parameter**: More steps (30-50) produce higher quality but take longer. Balance quality vs. speed based on your needs.

9. **Error Handling**: Network errors are automatically retried (up to 3 times by default) with exponential backoff.

10. **Memory Usage**: Large images consume more memory. Consider resizing very large images before processing.

---

### getAvailableStyles()

Retrieves all available interior design styles.

**Signature:**
```typescript
async getAvailableStyles(): Promise<Style[]>
```

**Returns:** `Promise<Style[]>`

**Return Structure:**
```typescript
[
  {
    id: string;        // Style identifier (e.g., "modern-minimalist")
    name: string;      // Display name (e.g., "Modern Minimalist")
    description: string; // Style description
    prompt: string;    // Style-specific prompt
  },
  // ... more styles
]
```

**Throws:**
- `ConfigurationError` - If SDK is not initialized (indirectly, through style loading)

**Example 1: List All Styles**
```javascript
const styles = await sdk.getAvailableStyles();

console.log('Available styles:');
styles.forEach(style => {
  console.log(`- ${style.name} (${style.id})`);
});
```

**Example 2: Filter Styles**
```javascript
const styles = await sdk.getAvailableStyles();
const modernStyles = styles.filter(style => 
  style.name.toLowerCase().includes('modern')
);
```

**Example 3: Get Style IDs**
```javascript
const styles = await sdk.getAvailableStyles();
const styleIds = styles.map(style => style.id);
// ['modern-minimalist', 'scandinavian', 'industrial', ...]
```

**Example 4: Display Style Information**
```javascript
const styles = await sdk.getAvailableStyles();

styles.forEach(style => {
  console.log(`
    Style: ${style.name}
    ID: ${style.id}
    Description: ${style.description}
  `);
});
```

**Edge Cases & Gotchas:**

1. **Caching**: Styles are loaded once and cached in memory for performance.

2. **Async Loading**: The first call may take slightly longer as styles are loaded from the JSON file.

3. **Empty Array**: If styles cannot be loaded, an error is thrown rather than returning an empty array.

---

### getStyleById(id)

Retrieves a specific style by its identifier.

**Signature:**
```typescript
async getStyleById(id: string): Promise<Style | null>
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | `string` | Yes | Style identifier (e.g., 'modern-minimalist') |

**Returns:** `Promise<Style | null>`

- Returns the style object if found
- Returns `null` if the style does not exist

**Return Structure (when found):**
```typescript
{
  id: string;        // Style identifier
  name: string;     // Display name
  description: string; // Style description
  prompt: string;   // Style-specific prompt
}
```

**Throws:**
- `ConfigurationError` - If SDK is not initialized (indirectly, through style loading)

**Example 1: Get Specific Style**
```javascript
const style = await sdk.getStyleById('modern-minimalist');

if (style) {
  console.log(`Found style: ${style.name}`);
  console.log(`Description: ${style.description}`);
} else {
  console.log('Style not found');
}
```

**Example 2: Validate Style Before Use**
```javascript
const styleId = 'scandinavian';
const style = await sdk.getStyleById(styleId);

if (!style) {
  throw new Error(`Style "${styleId}" not found`);
}

// Use the style
const result = await sdk.generateDesign({
  image: './room.jpg',
  style: styleId
});
```

**Example 3: Check Style Existence**
```javascript
const styleId = 'industrial';
const style = await sdk.getStyleById(styleId);

if (style) {
  console.log(`Style "${style.name}" is available`);
} else {
  const allStyles = await sdk.getAvailableStyles();
  console.log('Available styles:', allStyles.map(s => s.id));
}
```

**Edge Cases & Gotchas:**

1. **Case Sensitivity**: Style IDs are case-sensitive. Use exact matches (e.g., 'modern-minimalist', not 'Modern-Minimalist').

2. **Null Return**: The method returns `null` for non-existent styles rather than throwing an error. This allows for graceful handling.

3. **Performance**: Style lookup is fast as styles are cached in memory.

---

### validateConnection()

Validates the API connection and credentials.

**Signature:**
```typescript
async validateConnection(): Promise<boolean>
```

**Returns:** `Promise<boolean>`

- Returns `true` if the connection is valid
- Throws an error if validation fails

**Throws:**
- `ConfigurationError` - If SDK is not initialized
- `AIProviderError` - If connection validation fails (invalid API key, network error, etc.)

**Example 1: Basic Validation**
```javascript
try {
  const isValid = await sdk.validateConnection();
  console.log('Connection valid:', isValid);
} catch (error) {
  console.error('Connection validation failed:', error.message);
}
```

**Example 2: Pre-flight Check**
```javascript
async function checkSDKHealth() {
  try {
    await sdk.validateConnection();
    console.log('✅ SDK is ready');
    return true;
  } catch (error) {
    console.error('❌ SDK connection failed:', error.message);
    return false;
  }
}

// Use before generating designs
if (await checkSDKHealth()) {
  const result = await sdk.generateDesign({
    image: './room.jpg',
    style: 'modern-minimalist'
  });
}
```

**Example 3: Retry Logic**
```javascript
async function validateWithRetry(maxAttempts = 3) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const isValid = await sdk.validateConnection();
      return isValid;
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

**Edge Cases & Gotchas:**

1. **Network Issues**: Network errors during validation will throw an `AIProviderError`.

2. **API Key Validation**: Invalid API keys will cause validation to fail with an `AIProviderError`.

3. **Rate Limiting**: If the API is rate-limited, validation may fail temporarily.

4. **Timeout**: The validation uses the configured timeout. Very slow networks may cause timeouts.

---

### getProviderInfo()

Gets information about the current AI provider.

**Signature:**
```typescript
getProviderInfo(): ProviderInfo | null
```

**Returns:** `ProviderInfo | null`

- Returns provider information if SDK is initialized
- Returns `null` if SDK is not initialized

**Return Structure:**
```typescript
{
  name: string;              // Provider name (e.g., "StabilityAI")
  version: string;          // Provider version (e.g., "1.0.0")
  capabilities: {           // Provider capabilities
    imageToImage: boolean;
    textToImage: boolean;
    inpainting: boolean;
    upscaling: boolean;
  };
  isMock?: boolean;         // Whether this is a mock provider (testing only)
}
```

**Throws:** None (returns `null` if not initialized)

**Example 1: Get Provider Information**
```javascript
const info = sdk.getProviderInfo();

if (info) {
  console.log(`Provider: ${info.name}`);
  console.log(`Version: ${info.version}`);
  console.log(`Capabilities:`, info.capabilities);
} else {
  console.log('SDK not initialized');
}
```

**Example 2: Check Capabilities**
```javascript
const info = sdk.getProviderInfo();

if (info?.capabilities.imageToImage) {
  console.log('Provider supports image-to-image generation');
}

if (info?.capabilities.textToImage) {
  console.log('Provider supports text-to-image generation');
}
```

**Example 3: Provider Detection**
```javascript
const info = sdk.getProviderInfo();

if (info) {
  switch (info.name) {
    case 'StabilityAI':
      console.log('Using Stability AI');
      break;
    case 'MockAIProvider':
      console.log('Using mock provider (testing)');
      break;
    default:
      console.log(`Using provider: ${info.name}`);
  }
}
```

**Edge Cases & Gotchas:**

1. **Null Return**: Returns `null` if SDK is not initialized, not an error. Always check for null before accessing properties.

2. **Synchronous Method**: This is a synchronous method (not async), so it returns immediately.

3. **Provider-Specific**: The information returned is provider-specific and may vary between providers.

---

## Error Classes

The SDK uses custom error classes for better error handling and debugging.

### ValidationError

Thrown when input validation fails.

**Properties:**
- `message` (string) - Human-readable error message
- `code` (string) - Error code: `'VALIDATION_ERROR'`
- `timestamp` (string) - ISO timestamp when error occurred
- `originalError` (Error | null) - Original error if available

**When Thrown:**
- Invalid image format
- Image size exceeds limit
- Missing required parameters
- Invalid style ID
- Invalid configuration values

**Example:**
```javascript
try {
  await sdk.generateDesign({
    image: './room.gif',  // GIF not supported
    style: 'modern-minimalist'
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
    console.error('Error code:', error.code);
  }
}
```

### AIProviderError

Thrown when AI provider API calls fail.

**Properties:**
- `message` (string) - Human-readable error message
- `code` (string) - Error code: `'AI_PROVIDER_ERROR'`
- `timestamp` (string) - ISO timestamp when error occurred
- `originalError` (Error | null) - Original error if available

**When Thrown:**
- Network errors
- API rate limiting
- Invalid API responses
- Provider service errors
- Timeout errors

**Example:**
```javascript
try {
  await sdk.generateDesign({
    image: './room.jpg',
    style: 'modern-minimalist'
  });
} catch (error) {
  if (error instanceof AIProviderError) {
    console.error('AI provider error:', error.message);
    // Check for rate limiting
    if (error.message.includes('rate limit')) {
      console.log('Rate limited, retrying later...');
    }
  }
}
```

### ConfigurationError

Thrown when SDK configuration is invalid.

**Properties:**
- `message` (string) - Human-readable error message
- `code` (string) - Error code: `'CONFIGURATION_ERROR'`
- `timestamp` (string) - ISO timestamp when error occurred
- `originalError` (Error | null) - Original error if available

**When Thrown:**
- Missing API key
- Invalid provider setup
- SDK not initialized
- Provider initialization failures

**Example:**
```javascript
try {
  await sdk.initialize({
    provider: new StabilityAI(),
    providerConfig: {
      apiKey: ''  // Empty API key
    }
  });
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Configuration error:', error.message);
  }
}
```

### ImageProcessingError

Thrown when image processing fails.

**Properties:**
- `message` (string) - Human-readable error message
- `code` (string) - Error code: `'IMAGE_PROCESSING_ERROR'`
- `timestamp` (string) - ISO timestamp when error occurred
- `originalError` (Error | null) - Original error if available

**When Thrown:**
- Image loading failures
- Format conversion errors
- Resizing failures

**Example:**
```javascript
try {
  await sdk.generateDesign({
    image: './corrupted.jpg',
    style: 'modern-minimalist'
  });
} catch (error) {
  if (error instanceof ImageProcessingError) {
    console.error('Image processing failed:', error.message);
  }
}
```

---

## Common Patterns

### Pattern 1: Initialization with Error Handling

```javascript
import InteriorDesignSDK from 'ai-interior-design-sdk';
import StabilityAI from 'ai-interior-design-sdk/providers/StabilityAI';
import { ConfigurationError } from 'ai-interior-design-sdk';

async function initializeSDK() {
  const sdk = new InteriorDesignSDK();
  const provider = new StabilityAI();

  try {
    await sdk.initialize({
      provider,
      providerConfig: {
        apiKey: process.env.STABILITY_AI_API_KEY
      }
    });
    return sdk;
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error('Failed to initialize SDK:', error.message);
      throw error;
    }
    throw error;
  }
}
```

### Pattern 2: Batch Processing with Error Handling

```javascript
async function processMultipleRooms(rooms, style) {
  const results = [];
  const errors = [];

  for (const room of rooms) {
    try {
      const result = await sdk.generateDesign({
        image: room.path,
        style
      });
      results.push({ room: room.name, result });
    } catch (error) {
      errors.push({ room: room.name, error: error.message });
    }
  }

  return { results, errors };
}
```

### Pattern 3: Retry Logic for Transient Errors

```javascript
async function generateWithRetry(options, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await sdk.generateDesign(options);
    } catch (error) {
      if (error instanceof AIProviderError && attempt < maxAttempts) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

### Pattern 4: Saving Generated Images

```javascript
import { writeFile } from 'fs/promises';

async function generateAndSave(imagePath, style, outputPath) {
  const result = await sdk.generateDesign({
    image: imagePath,
    style
  });

  // Extract base64 data
  const base64Data = result.imageBase64.split(',')[1];
  const imageBuffer = Buffer.from(base64Data, 'base64');

  // Save to file
  await writeFile(outputPath, imageBuffer);
  console.log(`Saved to ${outputPath}`);
}
```

### Pattern 5: Style Validation Before Generation

```javascript
async function safeGenerateDesign(image, styleId) {
  // Validate style exists
  const style = await sdk.getStyleById(styleId);
  if (!style) {
    const availableStyles = await sdk.getAvailableStyles();
    throw new Error(
      `Style "${styleId}" not found. Available: ${availableStyles.map(s => s.id).join(', ')}`
    );
  }

  // Generate design
  return await sdk.generateDesign({
    image,
    style: styleId
  });
}
```

---

## Advanced Usage

### Advanced Usage 1: Custom Provider Implementation

```javascript
import AIProvider from 'ai-interior-design-sdk/providers/AIProvider';
import { AIProviderError, ConfigurationError } from 'ai-interior-design-sdk';

class CustomProvider extends AIProvider {
  async initialize(config) {
    // Custom initialization logic
    await super.initialize(config);
  }

  async generateImage(options) {
    // Custom generation logic
    // Must return { imageBase64, metadata }
  }

  async validateConnection() {
    // Custom validation logic
    return true;
  }

  getProviderInfo() {
    return {
      name: 'CustomProvider',
      version: '1.0.0',
      capabilities: {
        imageToImage: true,
        textToImage: false,
        inpainting: false,
        upscaling: false
      }
    };
  }
}

// Use custom provider
const sdk = new InteriorDesignSDK();
await sdk.initialize({
  provider: new CustomProvider(),
  providerConfig: {
    apiKey: 'custom-api-key'
  }
});
```

### Advanced Usage 2: Parallel Processing with Rate Limiting

```javascript
async function processBatchWithRateLimit(images, style, maxConcurrent = 2) {
  const results = [];
  const queue = [...images];

  while (queue.length > 0) {
    const batch = queue.splice(0, maxConcurrent);
    const batchResults = await Promise.allSettled(
      batch.map(image =>
        sdk.generateDesign({
          image,
          style
        })
      )
    );

    results.push(...batchResults);
    
    // Rate limiting delay
    if (queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
```

### Advanced Usage 3: Progressive Generation with Different Strengths

```javascript
async function generateVariations(image, style) {
  const strengths = [0.3, 0.4, 0.5, 0.6];
  const results = [];

  for (const strength of strengths) {
    const result = await sdk.generateDesign({
      image,
      style,
      generationParams: {
        strength,
        cfgScale: 7,
        steps: 30
      }
    });
    results.push({ strength, result });
  }

  return results;
}
```

### Advanced Usage 4: Style Comparison

```javascript
async function compareStyles(image, styleIds) {
  const comparisons = [];

  for (const styleId of styleIds) {
    const result = await sdk.generateDesign({
      image,
      style: styleId
    });
    
    const style = await sdk.getStyleById(styleId);
    comparisons.push({
      style: style.name,
      styleId,
      result,
      metadata: result.metadata
    });
  }

  return comparisons;
}
```

---

## Complete Request/Response Examples

### Example 1: Complete Generation Request

**Request:**
```javascript
const result = await sdk.generateDesign({
  image: './room.jpg',
  style: 'modern-minimalist',
  promptParams: {
    roomType: 'living-room',
    colorScheme: 'neutral',
    atmosphere: 'spacious'
  },
  generationParams: {
    strength: 0.35,
    cfgScale: 7,
    steps: 30
  },
  resizeImage: true,
  maxWidth: 1024
});
```

**Response:**
```javascript
{
  imageBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ...",
  metadata: {
    provider: "StabilityAI",
    model: "stable-diffusion-xl-1024-v1-0",
    steps: 30,
    cfgScale: 7,
    strength: 0.35,
    timestamp: "2025-12-18T12:00:00.000Z",
    prompt: "Transform this room image into. Modern minimalist interior design...",
    style: "modern-minimalist"
  }
}
```

### Example 2: Error Response

**Request:**
```javascript
await sdk.generateDesign({
  image: './room.jpg',
  style: 'invalid-style'
});
```

**Response (Error):**
```javascript
ValidationError {
  message: "Style 'invalid-style' not found. Available styles: modern-minimalist, scandinavian, ...",
  code: "VALIDATION_ERROR",
  timestamp: "2025-12-18T12:00:00.000Z",
  originalError: null
}
```

---

This documentation provides comprehensive reference for all SDK methods, types, and usage patterns. For more examples, see the [examples directory](../examples/).

