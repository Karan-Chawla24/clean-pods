import { NextRequest, NextResponse } from "next/server";
import { auth, createClerkClient } from "@clerk/nextjs/server";
import { grantAdminRole, hasAdminUsers } from "../../../lib/clerk-admin";
import { safeLog, safeLogError } from "../../../lib/security/logging";
import { assertSameOrigin } from "../../../lib/security/origin";

// Create Clerk client instance
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Security logging function
function logSecurityEvent(
  event: string,
  userId: string | null,
  details: any = {},
) {
  const logData = {
    event,
    userId,
    userAgent: details.userAgent || "unknown",
    ip: details.ip || "unknown",
    ...details,
  };

  safeLog("warn", `[SECURITY] ${event}`, logData);

  // In production, you might want to send this to a security monitoring service
  // Example: await sendToSecurityMonitoring(logData);
}

/**
 * Secure bootstrap endpoint for creating the first admin user
 * This endpoint only works when no admin users exist in the system
 */
export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "unknown";
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";
  let userId: string | null = null;

  try {
    // CSRF Protection: Validate origin header
    try {
      assertSameOrigin(request);
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid Origin") {
        return NextResponse.json({ error: "Invalid Origin" }, { status: 403 });
      }
      throw error;
    }

    safeLog("info", "Admin bootstrap attempt initiated");

    const authResult = await auth();
    userId = authResult.userId;

    if (!userId) {
      logSecurityEvent("ADMIN_BOOTSTRAP_UNAUTHORIZED_ATTEMPT", null, {
        userAgent,
        ip,
        reason: "No authenticated user",
      });

      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // Check if any admin users already exist
    const adminExists = await hasAdminUsers();

    if (adminExists) {
      logSecurityEvent("ADMIN_BOOTSTRAP_BLOCKED", userId, {
        userAgent,
        ip,
        reason: "Admin users already exist",
      });

      return NextResponse.json(
        {
          success: false,
          error:
            "Admin bootstrap is no longer available. Admin users already exist in the system.",
        },
        { status: 403 },
      );
    }

    // Get user details for logging
    const user = await clerk.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress || "unknown";

    safeLog("info", `Creating first admin user: ${userId} (${userEmail})`);

    // Grant admin role to the current user (first admin)
    await grantAdminRole(userId);

    // Get updated user data to confirm the role was set
    const updatedUser = await clerk.users.getUser(userId);

    logSecurityEvent("ADMIN_BOOTSTRAP_SUCCESS", userId, {
      userAgent,
      ip,
      userEmail,
      message: "First admin user created successfully",
    });

    safeLog(
      "info",
      `Admin bootstrap successful: ${userId} (${userEmail}) is now the first admin`,
    );

    return NextResponse.json({
      success: true,
      message: "Admin bootstrap successful. You are now the first admin user.",
      user: {
        id: updatedUser.id,
        email: updatedUser.emailAddresses[0]?.emailAddress,
        role: updatedUser.publicMetadata?.role,
      },
    });
  } catch (error) {
    logSecurityEvent("ADMIN_BOOTSTRAP_ERROR", null, {
      userAgent,
      ip,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    safeLogError("Admin bootstrap error", error);
    return NextResponse.json(
      { success: false, error: "Failed to bootstrap admin user" },
      { status: 500 },
    );
  }
}

/**
 * Check bootstrap availability
 * Returns whether bootstrap is still available (no admins exist)
 */
export async function GET(request: NextRequest) {
  try {
    const adminExists = await hasAdminUsers();

    return NextResponse.json({
      success: true,
      bootstrapAvailable: !adminExists,
      message: adminExists
        ? "Bootstrap is no longer available - admin users exist"
        : "Bootstrap is available - no admin users found",
    });
  } catch (error) {
    safeLogError("Bootstrap availability check error", error);
    return NextResponse.json(
      { success: false, error: "Failed to check bootstrap availability" },
      { status: 500 },
    );
  }
}
