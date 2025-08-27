// /**
//  * CSRF Protection Utility
//  * 
//  * This module provides origin validation to prevent Cross-Site Request Forgery (CSRF) attacks.
//  * CSRF attacks occur when malicious websites trick users into making unwanted requests to our app
//  * using their existing authentication cookies. By validating the Origin header, we ensure that
//  * state-changing requests only come from trusted domains.
//  * 
//  * The Origin header is automatically set by browsers for cross-origin requests and cannot be
//  * modified by JavaScript, making it a reliable indicator of the request's true source.
//  */

// import { safeLogError } from './logging';

// /**
//  * List of allowed origins for CSRF protection.
//  * Includes development (localhost) and production domains.
//  */
// const ALLOWED_ORIGINS = [
//   'http://localhost:3000',
//   'https://localhost:3000',
//   // Production domain from environment variable
//   process.env.NEXT_PUBLIC_APP_URL,
// ].filter(Boolean) as string[];

// /**
//  * Validates that the request Origin header matches one of our allowed domains.
//  * This prevents CSRF attacks by ensuring state-changing requests only come from trusted sources.
//  * 
//  * @param request - The incoming HTTP request
//  * @throws Error if Origin header is missing or doesn't match allowed domains
//  */
// export function assertSameOrigin(request: Request): void {
//   const origin = request.headers.get('origin');
//   const host = request.headers.get('host');
  
//   // For same-origin requests, browsers may not include Origin header
//   // In such cases, we can construct the expected origin from the Host header
// if (!origin) {
//   if (!host || !ALLOWED_ORIGINS.some(o => new URL(o).host === host)) {
//     throw new Error('Invalid Origin');
//   }
//   return;
// }

  
//   // Check if the origin is in our allowlist
//   const isAllowed = ALLOWED_ORIGINS.some(allowedOrigin => {
//     try {
//       const allowedUrl = new URL(allowedOrigin);
//       const requestUrl = new URL(origin);
      
//       // Compare protocol, hostname, and port
//       return allowedUrl.protocol === requestUrl.protocol &&
//              allowedUrl.hostname === requestUrl.hostname &&
//              allowedUrl.port === requestUrl.port;
//     } catch (error) {
//       // Invalid URL format
//       return false;
//     }
//   });
  
//   if (!isAllowed) {
//     // Log the rejected origin (sanitized for security)
//     const sanitizedOrigin = origin.replace(/[^a-zA-Z0-9.-:]/g, '_');
//     safeLogError(`CSRF protection: Rejected origin ${sanitizedOrigin}`, {
//       context: 'origin_validation',
//       host: host,
//       allowedOrigins: ALLOWED_ORIGINS.length
//     });
    
//     throw new Error('Invalid Origin');
//   }
// }

// /**
//  * Middleware wrapper that applies origin validation to API route handlers.
//  * Returns a 403 Forbidden response if origin validation fails.
//  * 
//  * @param handler - The original API route handler
//  * @returns Wrapped handler with origin validation
//  */
// export function withOriginValidation<T extends any[]>(
//   handler: (request: Request, ...args: T) => Promise<Response>
// ) {
//   return async (request: Request, ...args: T): Promise<Response> => {
//     try {
//       // Only validate origin for state-changing methods
//       const method = request.method?.toUpperCase();
//       if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
//         assertSameOrigin(request);
//       }
      
//       return await handler(request, ...args);
//     } catch (error) {
//       if (error instanceof Error && error.message === 'Invalid Origin') {
//         return new Response(
//           JSON.stringify({ error: 'Invalid Origin' }),
//           {
//             status: 403,
//             headers: {
//               'Content-Type': 'application/json',
//             },
//           }
//         );
//       }
      
//       // Re-throw other errors to be handled by existing error handling
//       throw error;
//     }
//   };
// }

// /**
//  * Get the list of currently allowed origins (for debugging/monitoring)
//  */
// export function getAllowedOrigins(): string[] {
//   return [...ALLOWED_ORIGINS];
// }


/**
 * CSRF Protection Utility
 *
 * Prevents Cross-Site Request Forgery (CSRF) attacks by validating
 * the Origin/Host of state-changing requests.
 *
 * CSRF occurs when a malicious site tricks a logged-in user’s browser
 * into sending unintended requests (cookies auto-attach). By enforcing
 * allowed origins, we block cross-site attacks.
 */

import { safeLogError } from './logging';

/**
 * Allowed origins for CSRF protection.
 * - Include localhost (dev)
 * - Include production domain (server-only env var: APP_URL)
 */
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  process.env.APP_URL, // safer than NEXT_PUBLIC_APP_URL
].filter(Boolean) as string[];

/**
 * Pre-parse the allowed origins for faster comparison
 */
const PARSED_ALLOWED = ALLOWED_ORIGINS.map(o => {
  const url = new URL(o);
  return { protocol: url.protocol, host: url.hostname, port: url.port || (url.protocol === 'https:' ? '443' : '80') };
});

/**
 * Validate that a request comes from an allowed origin/host.
 *
 * @param request - Incoming HTTP request
 * @throws Error if origin/host validation fails
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin) {
    // Allow only if host matches one of the allowed origins
    const hostAllowed = PARSED_ALLOWED.some(a => a.host === host?.split(':')[0]);
    if (!hostAllowed) {
      safeLogError(`CSRF protection: Missing Origin and invalid Host`, {
        context: 'origin_validation',
        host,
      });
      throw new Error('Invalid Origin');
    }
    return; // Valid same-origin request
  }

  try {
    const reqUrl = new URL(origin);
    const reqPort = reqUrl.port || (reqUrl.protocol === 'https:' ? '443' : '80');

    const isAllowed = PARSED_ALLOWED.some(a =>
      a.protocol === reqUrl.protocol &&
      a.host === reqUrl.hostname &&
      a.port === reqPort
    );

    if (!isAllowed) {
      const sanitizedOrigin = origin.replace(/[^a-zA-Z0-9.-:]/g, '_');
      safeLogError(`CSRF protection: Rejected origin ${sanitizedOrigin}`, {
        context: 'origin_validation',
        host,
        allowedOrigins: ALLOWED_ORIGINS,
      });
      throw new Error('Invalid Origin');
    }
  } catch {
    throw new Error('Invalid Origin');
  }
}

/**
 * Higher-order function to wrap API route handlers with CSRF protection.
 *
 * Applies only to state-changing methods: POST, PUT, PATCH, DELETE.
 */
export function withOriginValidation<T extends any[]>(
  handler: (request: Request, ...args: T) => Promise<Response>
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    try {
      const method = request.method?.toUpperCase();
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        assertSameOrigin(request);
      }
      return await handler(request, ...args);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid Origin') {
        return new Response(
          JSON.stringify({ error: 'Invalid Origin' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      throw error; // let your existing error handler deal with it
    }
  };
}

/**
 * Get the list of allowed origins (for debugging/monitoring).
 */
export function getAllowedOrigins(): string[] {
  return [...ALLOWED_ORIGINS];
}
