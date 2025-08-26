import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/auth/signin(.*)',
  '/auth/signup(.*)',
  '/api/webhooks(.*)',
  '/api/public(.*)',
  '/products(.*)',
  '/about',
  '/contact',
  '/privacy',
  '/terms'
]);

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/profile(.*)',
  '/orders(.*)',
  '/api/user(.*)',
  '/api/orders(.*)'
]);

// Define admin routes that require admin role
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  // Protect all routes starting with `/admin`
  if (isAdminRoute(req) && (await auth()).sessionClaims?.metadata?.role !== 'admin') {
    const url = new URL('/', req.url)
    return NextResponse.redirect(url)
  }
  
  // Protect other routes that require authentication
  if (isProtectedRoute(req)) {
    auth.protect();
  }
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
