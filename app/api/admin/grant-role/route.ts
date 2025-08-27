import { NextRequest, NextResponse } from "next/server";
import { auth, createClerkClient } from "@clerk/nextjs/server";
import {
  grantAdminRole,
  hasAdminUsers,
  requireClerkAdminAuth,
} from "../../../lib/clerk-admin";
import {
  validateRequest,
  grantRoleSchema,
  sanitizeObject,
} from "../../../lib/security/validation";
import { safeLog, safeLogError } from "../../../lib/security/logging";
import { assertSameOrigin } from "../../../lib/security/origin";

// Create Clerk client instance
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Security logging using safe logging functions
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
}

/**
 * Secured endpoint to grant admin role to a specified user
 * Requires existing admin authentication after bootstrap phase
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

    safeLog("info", "Admin role grant attempt initiated");

    const authResult = await auth();
    userId = authResult.userId;

    if (!userId) {
      logSecurityEvent("ADMIN_GRANT_UNAUTHENTICATED", null, {
        userAgent,
        ip,
        reason: "No authentication provided",
      });

      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    // Check if any admin users exist
    const adminExists = await hasAdminUsers();

    if (adminExists) {
      // If admins exist, require admin authentication to create more admins
      const authResult = await requireClerkAdminAuth(request);

      if (authResult instanceof NextResponse) {
        logSecurityEvent("ADMIN_GRANT_UNAUTHORIZED", userId, {
          userAgent,
          ip,
          reason: "User attempted to grant admin role without admin privileges",
        });

        return authResult;
      }

      safeLog("info", "Admin attempting to grant role", {
        adminId: authResult.userId,
        targetUserId: userId,
      });
    } else {
      // If no admins exist, redirect to bootstrap endpoint
      logSecurityEvent("ADMIN_GRANT_BLOCKED_NO_ADMINS", userId, {
        userAgent,
        ip,
        reason: "No admin users exist, bootstrap required",
      });

      return NextResponse.json(
        {
          success: false,
          error:
            "No admin users exist. Please use the bootstrap endpoint to create the first admin.",
          redirectTo: "/api/admin/bootstrap",
        },
        { status: 403 },
      );
    }

    // Parse and validate request body
    let targetUserId = userId; // Default to current user

    try {
      const validationResult = await validateRequest(request, grantRoleSchema);
      if (validationResult.success) {
        const sanitizedData = sanitizeObject(validationResult.data);
        targetUserId = sanitizedData.userId;
        safeLog("info", "Granting admin role to target user", { targetUserId });
      }
    } catch {
      // If no body or invalid JSON, use current user
      safeLog("info", "Using current user as target for admin role grant", {
        userId,
      });
    }

    // Get target user details for logging
    const targetUser = await clerk.users.getUser(targetUserId);
    const targetUserEmail =
      targetUser.emailAddresses[0]?.emailAddress || "unknown";

    safeLog("info", "Granting admin role to user", {
      targetUserId,
      targetUserEmail,
    });

    // Grant admin role to the target user
    await grantAdminRole(targetUserId);

    // Get updated user data to confirm the role was set
    const updatedUser = await clerk.users.getUser(targetUserId);

    logSecurityEvent("ADMIN_GRANT_SUCCESS", userId, {
      userAgent,
      ip,
      targetUserId,
      targetUserEmail,
      grantedBy: userId,
      message: `Admin role granted to user ${targetUserId} (${targetUserEmail})`,
    });

    safeLog("info", "Admin role granted successfully", {
      targetUserId,
      targetUserEmail,
    });

    return NextResponse.json({
      success: true,
      message: "Admin role granted successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.emailAddresses[0]?.emailAddress,
        role: updatedUser.publicMetadata?.role,
      },
    });
  } catch (error) {
    logSecurityEvent("ADMIN_GRANT_ERROR", null, {
      userAgent,
      ip,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    safeLogError("Grant admin role error", error, { userAgent, ip });
    return NextResponse.json(
      { success: false, error: "Failed to grant admin role" },
      { status: 500 },
    );
  }
}
