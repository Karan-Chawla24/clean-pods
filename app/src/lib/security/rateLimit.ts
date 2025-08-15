import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore: RateLimitStore = {};

export function withRateLimit(config: RateLimitConfig) {
  return function(handler: (request: NextRequest) => Promise<NextResponse>) {
    return async function(request: NextRequest): Promise<NextResponse> {
      const clientId = getClientId(request);
      const now = Date.now();
      
      // Clean up expired entries
      if (rateLimitStore[clientId] && now > rateLimitStore[clientId].resetTime) {
        delete rateLimitStore[clientId];
      }
      
      // Initialize or get current rate limit data
      if (!rateLimitStore[clientId]) {
        rateLimitStore[clientId] = {
          count: 0,
          resetTime: now + config.windowMs
        };
      }
      
      // Check if rate limit exceeded
      if (rateLimitStore[clientId].count >= config.maxRequests) {
        return NextResponse.json(
          { 
            success: false, 
            error: config.message || 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil((rateLimitStore[clientId].resetTime - now) / 1000)
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((rateLimitStore[clientId].resetTime - now) / 1000).toString(),
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': rateLimitStore[clientId].resetTime.toString()
            }
          }
        );
      }
      
      // Increment counter
      rateLimitStore[clientId].count++;
      
      // Add rate limit headers
      const response = await handler(request);
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', (config.maxRequests - rateLimitStore[clientId].count).toString());
      response.headers.set('X-RateLimit-Reset', rateLimitStore[clientId].resetTime.toString());
      
      return response;
    };
  };
}

function getClientId(request: NextRequest): string {
  // Use IP address as primary identifier
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  // Add user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return `${ip}:${userAgent}`;
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  strict: { maxRequests: 5, windowMs: 60000, message: 'Too many requests. Please try again in a minute.' },
  moderate: { maxRequests: 20, windowMs: 60000, message: 'Rate limit exceeded. Please slow down.' },
  lenient: { maxRequests: 100, windowMs: 60000, message: 'Rate limit exceeded. Please try again later.' }
}; 