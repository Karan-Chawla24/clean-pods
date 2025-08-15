import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders, buildCSPString } from '@/app/lib/security/config';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Apply security headers
  const securityHeaders = getSecurityHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    }
  });
  
  // Content Security Policy
  const csp = buildCSPString();
  response.headers.set('Content-Security-Policy', csp);
  
  // Rate limiting headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('X-RateLimit-Info', 'Rate limiting enabled');
  }
  
  return response;
}

// Configure the middleware to run on all routes for security headers
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
