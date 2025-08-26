import { NextRequest, NextResponse } from 'next/server';
import { auth, createClerkClient } from '@clerk/nextjs/server';
import { grantAdminRole, hasAdminUsers, requireClerkAdminAuth } from '../../../lib/clerk-admin';

// Create Clerk client instance
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// Security logging function
function logSecurityEvent(event: string, userId: string | null, details: any = {}) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    event,
    userId,
    userAgent: details.userAgent || 'unknown',
    ip: details.ip || 'unknown',
    ...details
  };
  
  console.log(`[SECURITY] ${event}:`, JSON.stringify(logData));
  
  // In production, you might want to send this to a security monitoring service
  // Example: await sendToSecurityMonitoring(logData);
}

/**
 * Secured endpoint to grant admin role to a specified user
 * Requires existing admin authentication after bootstrap phase
 */
export async function POST(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  try {
    console.log('Admin role grant attempt initiated');
    
    const { userId } = await auth();
    
    if (!userId) {
      logSecurityEvent('ADMIN_GRANT_UNAUTHENTICATED', null, {
        userAgent,
        ip,
        reason: 'No authentication provided'
      });
      
      console.log('Grant role failed: No authentication');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if any admin users exist
    const adminExists = await hasAdminUsers();
    
    if (adminExists) {
      // If admins exist, require admin authentication to create more admins
      const authResult = await requireClerkAdminAuth(request);
      
      if (authResult instanceof NextResponse) {
        logSecurityEvent('ADMIN_GRANT_UNAUTHORIZED', userId, {
          userAgent,
          ip,
          reason: 'User attempted to grant admin role without admin privileges'
        });
        
        console.log(`Grant role blocked: User ${userId} attempted to grant admin role without admin privileges`);
        return authResult;
      }
      
      console.log(`Admin ${authResult.userId} attempting to grant role to user ${userId}`);
    } else {
      // If no admins exist, redirect to bootstrap endpoint
      logSecurityEvent('ADMIN_GRANT_BLOCKED_NO_ADMINS', userId, {
        userAgent,
        ip,
        reason: 'No admin users exist, bootstrap required'
      });
      
      console.log(`Grant role redirected: No admins exist, user ${userId} should use bootstrap endpoint`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'No admin users exist. Please use the bootstrap endpoint to create the first admin.',
          redirectTo: '/api/admin/bootstrap'
        },
        { status: 403 }
      );
    }

    // Parse request body to get target user ID (if different from current user)
    let targetUserId = userId; // Default to current user
    
    try {
      const body = await request.json();
      if (body.targetUserId) {
        targetUserId = body.targetUserId;
        console.log(`Granting admin role to target user: ${targetUserId}`);
      }
    } catch {
      // If no body or invalid JSON, use current user
    }

    // Get target user details for logging
    const targetUser = await clerk.users.getUser(targetUserId);
    const targetUserEmail = targetUser.emailAddresses[0]?.emailAddress || 'unknown';
    
    console.log(`Granting admin role to user: ${targetUserId} (${targetUserEmail})`);
    
    // Grant admin role to the target user
    await grantAdminRole(targetUserId);
    
    // Get updated user data to confirm the role was set
    const updatedUser = await clerk.users.getUser(targetUserId);
    
    logSecurityEvent('ADMIN_GRANT_SUCCESS', userId, {
      userAgent,
      ip,
      targetUserId,
      targetUserEmail,
      grantedBy: userId,
      message: `Admin role granted to user ${targetUserId} (${targetUserEmail})`
    });
    
    console.log(`Admin role granted successfully to: ${targetUserId} (${targetUserEmail})`);
    
    return NextResponse.json({
      success: true,
      message: 'Admin role granted successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.emailAddresses[0]?.emailAddress,
        role: updatedUser.publicMetadata?.role
      }
    });
  } catch (error) {
    logSecurityEvent('ADMIN_GRANT_ERROR', null, {
      userAgent,
      ip,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    console.error('Grant admin role error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to grant admin role' },
      { status: 500 }
    );
  }
}