import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getSecurityHeaders, buildCSPString } from "./app/lib/security/config";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/products(.*)",
  "/cart",
  "/about",
  "/contact",
  "/help",
  "/shipping",
  "/returns",
  "/blog(.*)",
  "/privacy",
  "/terms",
  "/auth/signin(.*)",
  "/auth/signup(.*)",
  "/auth/error",
  "/api/webhooks(.*)",
  "/api/public(.*)",
  "/api/products",
  "/api/init-payment",
  "/api/phonepe/verify",

  "/api/contact-notification",
  "/api/debug-middleware",
  "/api/test-middleware-logic",
]);

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/checkout",
  "/orders(.*)",
  "/profile",
  "/wishlist",
  "/setup-admin",
  "/api/user(.*)",
  "/api/admin(.*)",
  "/api/download-invoice(.*)",
  "/api/generate-invoice-token",
  "/api/admin-download-orders",
  "/api/migrate-orders",
  "/api/debug-admin-users",
  "/api/debug-auth",
  "/api/orders",
  "/api/create-order(.*)",
  "/api/slack-notification",
]);

// Define admin routes that require admin role
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Protect all routes starting with `/admin`
  if (
    isAdminRoute(req) &&
    (await auth()).sessionClaims?.metadata?.role !== "admin"
  ) {
    const url = new URL("/", req.url);
    return NextResponse.redirect(url);
  }

  // Protect other routes that require authentication
  if (isProtectedRoute(req)) {
    auth.protect();
  }

  // Apply security headers to all responses
  const response = NextResponse.next();

  // Get security headers
  const securityHeaders = getSecurityHeaders();

  // Apply each security header
  Object.entries(securityHeaders).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    }
  });

  // Apply Content Security Policy
  response.headers.set("Content-Security-Policy", buildCSPString());

  return response;
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
