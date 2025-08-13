import { NextRequest, NextResponse } from 'next/server';

// Simplified middleware - NextAuth handles CSRF protection for /api/auth/* routes
// Other routes use NextAuth's getCsrfToken() on the client side
export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Only run on API routes for potential future enhancements
    '/api/:path*',
  ],
};
