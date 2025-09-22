import crypto from "crypto";
import { safeLog, safeLogError } from "./logging";

/**
 * PhonePe Security Utilities
 * Provides webhook signature verification and security functions for PhonePe integration
 */

/**
 * Verify PhonePe webhook signature using SHA256 hash comparison
 * @param payload - Raw webhook payload string (not used in PhonePe auth)
 * @param signature - Authorization header value from PhonePe
 * @param credentials - Webhook credentials in format "username:password"
 * @returns boolean indicating if signature is valid
 */
export function verifyPhonePeSignature(
  payload: string,
  signature: string,
  credentials: string
): boolean {
  try {
    if (!signature || !credentials) {
      safeLogError("PhonePe signature verification failed: missing parameters", {
        hasPayload: !!payload,
        hasSignature: !!signature,
        hasCredentials: !!credentials
      });
      return false;
    }

    // PhonePe sends Authorization header as: SHA256(username:password)
    // We need to compute SHA256 of our credentials and compare
    const expectedSignature = crypto
      .createHash("sha256")
      .update(credentials, "utf8")
      .digest("hex")
      .toUpperCase(); // PhonePe uses uppercase hex

    // Clean the received signature (remove any prefixes)
    const cleanSignature = signature
      .replace(/^(sha256=|Bearer\s+)/i, "")
      .toUpperCase();

    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(cleanSignature, "hex");
    
    if (expectedBuffer.length !== receivedBuffer.length) {
      safeLogError("PhonePe signature verification failed: length mismatch", {
        expectedLength: expectedBuffer.length,
        receivedLength: receivedBuffer.length
      });
      return false;
    }

    const isValid = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!isValid) {
      safeLogError("PhonePe signature verification failed", {
        expectedSignature: expectedSignature.substring(0, 8) + "...",
        receivedSignature: cleanSignature.substring(0, 8) + "...",
        credentialsFormat: credentials.includes(":") ? "username:password" : "invalid"
      });
    } else {
      safeLog("info", "PhonePe signature verification successful");
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
  // PhonePe sends signature in Authorization header as SHA256(username:password)
  // Check for authorization header with case-insensitive search
  const allHeaders = Array.from(request.headers.keys());
  const authHeaderName = allHeaders.find(header => 
    header.toLowerCase() === 'authorization'
  );
  
  if (authHeaderName) {
    const authHeader = request.headers.get(authHeaderName);
    if (authHeader) {
      safeLog("info", "PhonePe signature found in Authorization header", { 
        headerName: authHeaderName,
        signaturePreview: authHeader.substring(0, 8) + "..."
      });
      return authHeader;
    }
  }

  // Fallback to other possible headers for backward compatibility
  const fallbackHeaders = [
    "x-phonepe-signature",
    "x-signature", 
    "signature"
  ];

  for (const headerName of fallbackHeaders) {
    const signature = request.headers.get(headerName);
    if (signature) {
      safeLog("info", "Found PhonePe signature in header", { header: headerName });
      return signature;
    }
  }

  safeLogError("No PhonePe signature found in headers", {
    availableHeaders: allHeaders,
    authorizationHeader: request.headers.get('authorization'),
    authorizationHeaderCaseInsensitive: authHeaderName ? request.headers.get(authHeaderName) : null,
    checkedHeaders: ['authorization (case-insensitive)', ...fallbackHeaders]
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