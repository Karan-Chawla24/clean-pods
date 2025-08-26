import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { safeLogError } from './security/logging';

// JWT secret - should be a strong random string in production
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-min-32-chars'
);

// Token expiry time (5 minutes)
const TOKEN_EXPIRY = '5m';

export interface InvoiceTokenPayload extends JWTPayload {
  orderId: string;
  userId?: string;
}

/**
 * Generate a JWT token for invoice access
 * @param orderId - The order ID
 * @param userId - Optional user ID for additional security
 * @returns Promise<string> - The JWT token
 */
export async function generateInvoiceToken(
  orderId: string,
  userId?: string
): Promise<string> {
  try {
    const payload: InvoiceTokenPayload = {
      orderId,
      ...(userId && { userId }),
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(TOKEN_EXPIRY)
      .setIssuer('clean-pods-app')
      .setAudience('invoice-access')
      .sign(JWT_SECRET);

    return token;
  } catch (error) {
    safeLogError('Error generating JWT token', error);
    throw new Error('Failed to generate access token');
  }
}

/**
 * Verify and decode a JWT token for invoice access
 * @param token - The JWT token to verify
 * @returns Promise<InvoiceTokenPayload> - The decoded payload
 * @throws Error if token is invalid or expired
 */
export async function verifyInvoiceToken(
  token: string
): Promise<InvoiceTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'clean-pods-app',
      audience: 'invoice-access',
    });

    return payload as InvoiceTokenPayload;
  } catch (error) {
    safeLogError('Error verifying JWT token', error);
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Check if a token is expired (client-side utility)
 * @param token - The JWT token
 * @returns boolean - True if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true; // Consider invalid tokens as expired
  }
}

/**
 * Get token expiry time in seconds
 * @returns number - Token expiry time in seconds
 */
export function getTokenExpirySeconds(): number {
  return 5 * 60; // 5 minutes
}