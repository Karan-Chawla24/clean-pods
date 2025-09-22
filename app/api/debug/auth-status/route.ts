import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { withUpstashRateLimit } from "../../../lib/security/upstashRateLimit";
import { safeLogError } from "../../../lib/security/logging";

export const GET = withUpstashRateLimit("moderate")(async (request: NextRequest) => {
  try {
    // Get authentication info
    const authResult = await auth();
    const user = await currentUser();
    
    // Get request headers for debugging
    const headers = {
      authorization: request.headers.get('authorization'),
      cookie: request.headers.get('cookie')?.substring(0, 100) + '...', // Truncate for security
      'user-agent': request.headers.get('user-agent'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
    };

    // Environment variables (safe ones only)
    const envVars = {
      hasClerkPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      hasClerkSecretKey: !!process.env.CLERK_SECRET_KEY,
      clerkDomain: process.env.NEXT_PUBLIC_CLERK_DOMAIN || 'not-set',
      isDevelopment: process.env.NEXT_PUBLIC_CLERK_IS_DEVELOPMENT || 'not-set',
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV || 'not-set',
    };

    const debugInfo = {
      timestamp: new Date().toISOString(),
      auth: {
        userId: authResult.userId,
        sessionId: authResult.sessionId,
        orgId: authResult.orgId,
      },
      user: user ? {
        id: user.id,
        emailAddresses: user.emailAddresses?.map(e => e.emailAddress),
        firstName: user.firstName,
        lastName: user.lastName,
      } : null,
      headers,
      environment: envVars,
      url: request.url,
    };

    return NextResponse.json({
      success: true,
      authenticated: !!authResult.userId,
      debug: debugInfo,
    });

  } catch (error) {
    safeLogError('Auth debug error', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      authenticated: false,
    }, { status: 500 });
  }
});