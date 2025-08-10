import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

// List of routes that require CSRF protection
const protectedRoutes = [
  '/api/admin-login',
  '/api/orders',
  '/api/verify-payment',
  '/api/contact-notification',
  '/api/slack-notification'
];

// List of routes that should bypass CSRF protection (e.g., GET requests)
const bypassRoutes = [
  '/api/admin-verify'
];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Check if this is a route that needs CSRF protection
  const needsProtection = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route) && request.method !== 'GET'
  );
  
  // Check if this is a route that should bypass CSRF protection
  const shouldBypass = bypassRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  if (needsProtection && !shouldBypass) {
    // Get the CSRF token from the request headers
    const csrfToken = request.headers.get('X-CSRF-Token');
    
    // Get the CSRF token from the cookies
    const csrfCookie = request.cookies.get('csrfToken')?.value;
    
    // If there's no CSRF token in the headers or cookies, or they don't match, reject the request
    if (!csrfToken || !csrfCookie || csrfToken !== csrfCookie) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Invalid CSRF token' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
  
  // For GET requests to any page, set a CSRF token cookie if it doesn't exist
  if (request.method === 'GET' && !request.cookies.has('csrfToken')) {
    // Generate a new CSRF token
    const newCsrfToken = nanoid(32);
    
    // Set the CSRF token cookie
    response.cookies.set({
      name: 'csrfToken',
      value: newCsrfToken,
      httpOnly: false, // Needs to be accessible from JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
  }
  
  return response;
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match all page routes
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};