import crypto from "crypto";
import { safeLog, safeLogError } from "./logging";

/**
 * PhonePe Security Utilities
 * Provides webhook signature verification and security functions for PhonePe integration
 */

/**
 * Verify PhonePe webhook signature using HMAC-SHA256
 * @param payload - Raw webhook payload string
 * @param signature - Signature from PhonePe headers
 * @param secret - Webhook secret from environment
 * @returns boolean indicating if signature is valid
 */
export function verifyPhonePeSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    if (!payload || !signature || !secret) {
      safeLogError("PhonePe signature verification failed: missing parameters", {
        hasPayload: !!payload,
        hasSignature: !!signature,
        hasSecret: !!secret
      });
      return false;
    }

    // Remove any prefix from signature (e.g., "sha256=")
    const cleanSignature = signature.replace(/^sha256=/, "");
    
    // Generate expected signature using HMAC-SHA256
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload, "utf8")
      .digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(cleanSignature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );

    if (!isValid) {
      safeLogError("PhonePe signature verification failed", {
        expectedLength: expectedSignature.length,
        receivedLength: cleanSignature.length,
        payloadLength: payload.length
      });
    }

    return isValid;
  } catch (error) {
    safeLogError("Error during PhonePe signature verification", error);
    return false;
  }
}

/**
 * Validate PhonePe webhook request origin and headers
 * @param request - NextRequest object
 * @returns boolean indicating if request appears to be from PhonePe
 */
export function validatePhonePeWebhookOrigin(request: Request): boolean {
  const userAgent = request.headers.get("user-agent");
  const contentType = request.headers.get("content-type");

  // PhonePe typically uses specific user agents
  const validUserAgents = [
    "okhttp", // Common PhonePe user agent
    "PPE",    // PhonePe identifier
    "hermes", // Alternative PhonePe user agent
    "PhonePe" // Direct PhonePe identifier
  ];

  const hasValidUserAgent = validUserAgents.some(agent => 
    userAgent?.includes(agent)
  );

  // Check content type
  const hasValidContentType = contentType?.includes("application/json") ?? false;

  if (!hasValidUserAgent) {
    safeLogError("PhonePe webhook invalid user agent", {
      userAgent,
      contentType
    });
  }

  return hasValidUserAgent && hasValidContentType;
}

/**
 * Extract and validate PhonePe webhook signature from headers
 * @param request - NextRequest object
 * @returns signature string or null if not found/invalid
 */
export function extractPhonePeSignature(request: Request): string | null {
  // PhonePe may send signature in different header formats
  const possibleHeaders = [
    "x-phonepe-signature",
    "x-signature",
    "signature",
    "authorization"
  ];

  for (const header of possibleHeaders) {
    const signature = request.headers.get(header);
    if (signature) {
      safeLog("info", "Found PhonePe signature in header", { header });
      return signature;
    }
  }

  safeLogError("No PhonePe signature found in headers", {
    availableHeaders: Array.from(request.headers.keys())
  });
  
  return null;
}

/**
 * Validate PhonePe webhook payload structure
 * @param payload - Parsed webhook payload
 * @returns boolean indicating if payload structure is valid
 */
export function validatePhonePeWebhookPayload(payload: any): boolean {
  try {
    // Basic structure validation
    if (!payload || typeof payload !== "object") {
      return false;
    }

    // Check for required fields based on PhonePe webhook documentation
    const requiredFields = ["event"];
    const hasRequiredFields = requiredFields.every(field => 
      payload.hasOwnProperty(field)
    );

    if (!hasRequiredFields) {
      safeLogError("PhonePe webhook payload missing required fields", {
        receivedFields: Object.keys(payload),
        requiredFields
      });
      return false;
    }

    // Validate event type
    const validEvents = [
      "checkout.order.completed",
      "checkout.order.failed", 
      "pg.refund.completed",
      "pg.refund.failed"
    ];

    if (!validEvents.includes(payload.event)) {
      safeLogError("PhonePe webhook invalid event type", {
        event: payload.event,
        validEvents
      });
      return false;
    }

    return true;
  } catch (error) {
    safeLogError("Error validating PhonePe webhook payload", error);
    return false;
  }
}

/**
 * Sanitize PhonePe webhook payload for logging
 * @param payload - Raw webhook payload
 * @returns sanitized payload safe for logging
 */
export function sanitizePhonePePayload(payload: any): any {
  try {
    if (!payload || typeof payload !== "object") {
      return payload;
    }

    const sanitized = { ...payload };

    // Remove or mask sensitive fields
    const sensitiveFields = [
      "cardNumber",
      "cvv", 
      "pin",
      "otp",
      "password",
      "token",
      "secret"
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = "[REDACTED]";
      }
    });

    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
        sanitized[key] = sanitizePhonePePayload(sanitized[key]);
      }
    });

    return sanitized;
  } catch (error) {
    safeLogError("Error sanitizing PhonePe payload", error);
    return "[SANITIZATION_ERROR]";
  }
}