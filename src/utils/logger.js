/**
 * Logger Utility
 * @module utils/logger
 */

/**
 * Log levels
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

/**
 * ANSI color codes for terminal output
 */
const COLORS = {
  RESET: '\x1b[0m',
  DEBUG: '\x1b[36m', // Cyan
  INFO: '\x1b[32m', // Green
  WARN: '\x1b[33m', // Yellow
  ERROR: '\x1b[31m', // Red
};

/**
 * Check if logging is enabled via environment variable
 */
const isDebugEnabled = () => {
  return process.env.DEBUG === 'true' || process.env.DEBUG === '1';
};

/**
 * Get current log level from environment or default to INFO
 */
const getLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  return LOG_LEVELS[envLevel] ?? LOG_LEVELS.INFO;
};

/**
 * Sanitize message to remove sensitive data
 */
const sanitizeMessage = (message) => {
  if (typeof message !== 'string') {
    return message;
  }

  // Patterns to detect and mask sensitive data
  const sensitivePatterns = [
    {
      pattern: /(api[_-]?key|apikey)\s*[:=]\s*['"]?([a-zA-Z0-9_-]{10,})['"]?/gi,
      replacement: '$1=***REDACTED***',
    },
    {
      pattern: /(token|secret|password)\s*[:=]\s*['"]?([a-zA-Z0-9_-]{10,})['"]?/gi,
      replacement: '$1=***REDACTED***',
    },
    {
      pattern: /(bearer)\s+([a-zA-Z0-9._-]{20,})/gi,
      replacement: '$1 ***REDACTED***',
    },
  ];

  let sanitized = message;
  sensitivePatterns.forEach(({ pattern, replacement }) => {
    sanitized = sanitized.replace(pattern, replacement);
  });

  return sanitized;
};

/**
 * Format log message with timestamp and level
 */
const formatMessage = (level, message, useColors = true) => {
  const timestamp = new Date().toISOString();
  const levelName = level.toUpperCase();
  const sanitizedMsg = sanitizeMessage(message);

  if (useColors && process.stdout.isTTY) {
    const color = COLORS[levelName] || COLORS.RESET;
    return `${color}[${timestamp}] [${levelName}]${COLORS.RESET} ${sanitizedMsg}`;
  }

  return `[${timestamp}] [${levelName}] ${sanitizedMsg}`;
};

/**
 * Check if message should be logged based on current log level
 */
const shouldLog = (level) => {
  const currentLevel = getLogLevel();
  const messageLevel = LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.INFO;
  return messageLevel >= currentLevel;
};

/**
 * Debug log - only shown when DEBUG=true
 */
export const debug = (message, ...args) => {
  if (!isDebugEnabled() || !shouldLog('DEBUG')) {
    return;
  }

  const formatted = formatMessage('DEBUG', message);
  const sanitizedArgs = args.map((arg) =>
    typeof arg === 'string' ? sanitizeMessage(arg) : arg
  );
  console.debug(formatted, ...sanitizedArgs);
};

/**
 * Info log
 */
export const info = (message, ...args) => {
  if (!shouldLog('INFO')) {
    return;
  }

  const formatted = formatMessage('INFO', message);
  const sanitizedArgs = args.map((arg) =>
    typeof arg === 'string' ? sanitizeMessage(arg) : arg
  );
  console.info(formatted, ...sanitizedArgs);
};

/**
 * Warning log
 */
export const warn = (message, ...args) => {
  if (!shouldLog('WARN')) {
    return;
  }

  const formatted = formatMessage('WARN', message);
  const sanitizedArgs = args.map((arg) =>
    typeof arg === 'string' ? sanitizeMessage(arg) : arg
  );
  console.warn(formatted, ...sanitizedArgs);
};

/**
 * Error log
 */
export const error = (message, ...args) => {
  if (!shouldLog('ERROR')) {
    return;
  }

  const formatted = formatMessage('ERROR', message);
  const sanitizedArgs = args.map((arg) =>
    typeof arg === 'string' ? sanitizeMessage(arg) : arg
  );
  console.error(formatted, ...sanitizedArgs);
};

