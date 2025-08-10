/**
 * CSRF protection utilities
 * 
 * This module provides functions to get and include CSRF tokens in API requests
 */

/**
 * Gets the CSRF token from cookies
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrfToken') {
      return value;
    }
  }
  return null;
}

/**
 * Adds CSRF token to fetch options
 */
export function addCsrfToken(options: RequestInit = {}): RequestInit {
  const csrfToken = getCsrfToken();
  
  if (!csrfToken) {
    console.warn('CSRF token not found in cookies');
    return options;
  }
  
  // Create headers object if it doesn't exist
  const headers = options.headers || {};
  
  // Add CSRF token to headers
  return {
    ...options,
    headers: {
      ...headers,
      'X-CSRF-Token': csrfToken
    }
  };
}

/**
 * Wrapper for fetch that automatically adds CSRF token
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const optionsWithCsrf = addCsrfToken(options);
  return fetch(url, optionsWithCsrf);
}