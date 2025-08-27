/**
 * UI Output Escaping Utilities
 *
 * This module provides functions to safely escape user-controlled content
 * before displaying it in React components to prevent XSS attacks.
 */

// React import removed - not needed for utility functions

/**
 * Escapes HTML characters in a string to prevent XSS attacks
 * @param text - The text to escape
 * @returns The escaped text safe for HTML display
 */
export function escapeHtml(text: string): string {
  if (typeof text !== "string") {
    return String(text || "");
  }

  const htmlEscapes: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };

  return text.replace(/[&<>"'\/]/g, (match) => htmlEscapes[match]);
}

/**
 * Safely displays user names by escaping HTML and limiting length
 * @param name - The user name to display
 * @param maxLength - Maximum length to display (default: 50)
 * @returns Escaped and truncated name
 */
export function safeDisplayName(
  name: string | null | undefined,
  maxLength: number = 50,
): string {
  if (!name) return "Unknown User";

  const escaped = escapeHtml(String(name));
  if (escaped.length <= maxLength) {
    return escaped;
  }

  return escaped.substring(0, maxLength - 3) + "...";
}

/**
 * Safely displays email addresses by escaping HTML
 * @param email - The email to display
 * @returns Escaped email or placeholder
 */
export function safeDisplayEmail(email: string | null | undefined): string {
  if (!email) return "No email provided";
  return escapeHtml(String(email));
}

/**
 * Safely displays addresses by escaping HTML and limiting length
 * @param address - The address to display
 * @param maxLength - Maximum length to display (default: 100)
 * @returns Escaped and truncated address
 */
export function safeDisplayAddress(
  address: string | null | undefined,
  maxLength: number = 100,
): string {
  if (!address) return "No address provided";

  const escaped = escapeHtml(String(address));
  if (escaped.length <= maxLength) {
    return escaped;
  }

  return escaped.substring(0, maxLength - 3) + "...";
}

/**
 * Safely displays phone numbers by escaping HTML
 * @param phone - The phone number to display
 * @returns Escaped phone number or placeholder
 */
export function safeDisplayPhone(phone: string | null | undefined): string {
  if (!phone) return "No phone provided";
  return escapeHtml(String(phone));
}

/**
 * Safely displays any text content by escaping HTML and limiting length
 * @param text - The text to display
 * @param maxLength - Maximum length to display (default: 200)
 * @returns Escaped and truncated text
 */
export function safeDisplayText(
  text: string | null | undefined,
  maxLength: number = 200,
): string {
  if (!text) return "";

  const escaped = escapeHtml(String(text));
  if (escaped.length <= maxLength) {
    return escaped;
  }

  return escaped.substring(0, maxLength - 3) + "...";
}

/**
 * Safely displays order IDs by escaping HTML and validating format
 * @param orderId - The order ID to display
 * @returns Escaped order ID or placeholder
 */
export function safeDisplayOrderId(orderId: string | null | undefined): string {
  if (!orderId) return "Unknown Order";

  const escaped = escapeHtml(String(orderId));
  // Additional validation for order ID format
  if (!/^[a-zA-Z0-9_-]+$/.test(escaped)) {
    return "Invalid Order ID";
  }

  return escaped;
}

/**
 * Safely displays product names by escaping HTML and limiting length
 * @param productName - The product name to display
 * @param maxLength - Maximum length to display (default: 80)
 * @returns Escaped and truncated product name
 */
export function safeDisplayProductName(
  productName: string | null | undefined,
  maxLength: number = 80,
): string {
  if (!productName) return "Unknown Product";

  const escaped = escapeHtml(String(productName));
  if (escaped.length <= maxLength) {
    return escaped;
  }

  return escaped.substring(0, maxLength - 3) + "...";
}

/**
 * Safely displays error messages by escaping HTML
 * @param error - The error message to display
 * @returns Escaped error message
 */
export function safeDisplayError(error: string | null | undefined): string {
  if (!error) return "An unknown error occurred";
  return escapeHtml(String(error));
}

// SafeText React component removed - not compatible with .ts files
// Use the individual safe display functions instead
