/**
 * Safe logging utilities for production environments
 * Prevents sensitive data from being logged
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Safe logging function that sanitizes sensitive data
 * @param level - Log level
 * @param message - Log message
 * @param data - Optional data to log (will be sanitized)
 */
export function safeLog(level: LogLevel, message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const sanitizedData = data ? sanitizeLogData(data) : undefined;
  
  const logEntry = {
    timestamp,
    level,
    message,
    ...(sanitizedData && { data: sanitizedData })
  };
  
  switch (level) {
    case 'error':
      console.error(JSON.stringify(logEntry));
      break;
    case 'warn':
      console.warn(JSON.stringify(logEntry));
      break;
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(JSON.stringify(logEntry));
      }
      break;
    default:
      console.log(JSON.stringify(logEntry));
  }
}

/**
 * Safe error logging function
 * @param message - Error message
 * @param error - Error object or data
 */
export function safeLogError(message: string, error?: any): void {
  const errorData = error instanceof Error 
    ? { name: error.name, message: error.message, stack: error.stack }
    : error;
    
  safeLog('error', message, errorData);
}

/**
 * Sanitize data to remove sensitive information
 * @param data - Data to sanitize
 * @returns Sanitized data
 */
function sanitizeLogData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'authorization',
    'cookie', 'session', 'auth', 'credential', 'private'
  ];
  
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive.toLowerCase())
    )) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }
  
  return sanitized;
}