import { safeLog, safeLogError } from "./logging";

/**
 * Replay Attack Protection Utilities
 * Provides request deduplication and replay attack prevention
 */

// In-memory store for request IDs (in production, use Redis or database)
const processedRequests = new Map<string, { timestamp: number; data: any }>();

// Configuration
const REQUEST_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

/**
 * Generate a unique request ID based on request content
 * @param payload - Request payload
 * @param headers - Request headers (optional)
 * @returns unique request ID
 */
export function generateRequestId(payload: any, headers?: Record<string, string>): string {
  try {
    const crypto = require("crypto");
    
    // Create a hash based on payload content and relevant headers
    const content = JSON.stringify({
      payload,
      timestamp: Math.floor(Date.now() / 1000), // Round to seconds for some tolerance
      userAgent: headers?.["user-agent"],
      contentLength: headers?.["content-length"]
    });

    return crypto
      .createHash("sha256")
      .update(content)
      .digest("hex");
  } catch (error) {
    safeLogError("Error generating request ID", error);
    // Fallback to timestamp-based ID
    return `fallback_${Date.now()}_${Math.random()}`;
  }
}

/**
 * Check if a request has been processed before (replay attack detection)
 * @param requestId - Unique request identifier
 * @param payload - Request payload for additional validation
 * @returns boolean indicating if request is a replay
 */
export function isReplayRequest(requestId: string, payload?: any): boolean {
  try {
    const now = Date.now();
    
    // Clean up expired requests first
    cleanupExpiredRequests();
    
    // Check if request ID exists
    const existingRequest = processedRequests.get(requestId);
    
    if (existingRequest) {
      // Check if the request is still within the valid time window
      const isExpired = (now - existingRequest.timestamp) > REQUEST_EXPIRY_MS;
      
      if (isExpired) {
        // Remove expired request and allow processing
        processedRequests.delete(requestId);
        return false;
      }
      
      safeLogError("Replay attack detected", {
        requestId,
        originalTimestamp: existingRequest.timestamp,
        currentTimestamp: now,
        timeDifference: now - existingRequest.timestamp
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    safeLogError("Error checking replay request", error);
    // In case of error, allow the request to proceed (fail open)
    return false;
  }
}

/**
 * Mark a request as processed to prevent replay attacks
 * @param requestId - Unique request identifier
 * @param payload - Request payload to store
 */
export function markRequestAsProcessed(requestId: string, payload?: any): void {
  try {
    const now = Date.now();
    
    processedRequests.set(requestId, {
      timestamp: now,
      data: payload ? sanitizeForStorage(payload) : null
    });
    
    safeLog("info", "Request marked as processed", {
      requestId,
      timestamp: now,
      totalProcessedRequests: processedRequests.size
    });
  } catch (error) {
    safeLogError("Error marking request as processed", error);
  }
}

/**
 * Validate request timestamp to prevent old request replay
 * @param timestamp - Request timestamp (Unix timestamp in seconds or milliseconds)
 * @param maxAgeMs - Maximum allowed age in milliseconds (default: 5 minutes)
 * @returns boolean indicating if timestamp is valid
 */
export function validateRequestTimestamp(
  timestamp: number, 
  maxAgeMs: number = 5 * 60 * 1000
): boolean {
  try {
    const now = Date.now();
    
    // Convert timestamp to milliseconds if it appears to be in seconds
    const timestampMs = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    
    const age = now - timestampMs;
    
    // Check if timestamp is too old
    if (age > maxAgeMs) {
      safeLogError("Request timestamp too old", {
        timestamp: timestampMs,
        age,
        maxAgeMs,
        now
      });
      return false;
    }
    
    // Check if timestamp is in the future (with small tolerance)
    const futureToleranceMs = 60 * 1000; // 1 minute
    if (timestampMs > (now + futureToleranceMs)) {
      safeLogError("Request timestamp in future", {
        timestamp: timestampMs,
        now,
        difference: timestampMs - now
      });
      return false;
    }
    
    return true;
  } catch (error) {
    safeLogError("Error validating request timestamp", error);
    return false;
  }
}

/**
 * Clean up expired requests from memory
 */
function cleanupExpiredRequests(): void {
  try {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [requestId, data] of processedRequests.entries()) {
      if ((now - data.timestamp) > REQUEST_EXPIRY_MS) {
        processedRequests.delete(requestId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      safeLog("info", "Cleaned up expired requests", {
        cleanedCount,
        remainingRequests: processedRequests.size
      });
    }
  } catch (error) {
    safeLogError("Error cleaning up expired requests", error);
  }
}

/**
 * Sanitize payload for storage (remove sensitive data)
 * @param payload - Original payload
 * @returns sanitized payload
 */
function sanitizeForStorage(payload: any): any {
  try {
    if (!payload || typeof payload !== "object") {
      return payload;
    }
    
    const sanitized = { ...payload };
    
    // Remove sensitive fields
    const sensitiveFields = [
      "password",
      "token",
      "secret",
      "key",
      "cardNumber",
      "cvv",
      "pin",
      "otp"
    ];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = "[REDACTED]";
      }
    });
    
    return sanitized;
  } catch (error) {
    safeLogError("Error sanitizing payload for storage", error);
    return "[SANITIZATION_ERROR]";
  }
}

/**
 * Middleware function to protect against replay attacks
 * @param requestId - Unique request identifier
 * @param payload - Request payload
 * @param timestamp - Request timestamp (optional)
 * @returns object with isValid boolean and error message if invalid
 */
export function protectAgainstReplay(
  requestId: string,
  payload: any,
  timestamp?: number
): { isValid: boolean; error?: string } {
  try {
    // Check for replay attack
    if (isReplayRequest(requestId, payload)) {
      return {
        isValid: false,
        error: "Duplicate request detected"
      };
    }
    
    // Validate timestamp if provided
    if (timestamp && !validateRequestTimestamp(timestamp)) {
      return {
        isValid: false,
        error: "Invalid request timestamp"
      };
    }
    
    // Mark request as processed
    markRequestAsProcessed(requestId, payload);
    
    return { isValid: true };
  } catch (error) {
    safeLogError("Error in replay protection", error);
    return {
      isValid: false,
      error: "Replay protection error"
    };
  }
}

// Start cleanup interval
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredRequests, CLEANUP_INTERVAL_MS);
}