import { auth, createClerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { User } from '@clerk/nextjs/server';
import { safeLogError } from './security/logging';

// Admin role management using Clerk user metadata
export const ADMIN_ROLE = 'admin';

// Create Clerk client instance
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

/**
 * Check if a user has admin role based on their metadata
 */
export function isUserAdmin(user: User): boolean {
  return user.publicMetadata?.role === ADMIN_ROLE;
}

/**
 * Grant admin role to a user by updating their metadata
 */
export async function grantAdminRole(userId: string): Promise<void> {
  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: {
      role: ADMIN_ROLE
    }
  });
}

/**
 * Remove admin role from a user
 */
export async function revokeAdminRole(userId: string): Promise<void> {
  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: {
      role: null
    }
  });
}

/**
 * Middleware function to require admin authentication using Clerk
 */
export async function requireClerkAdminAuth(request: NextRequest): Promise<NextResponse | { userId: string; user: User }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user details from Clerk
    const user = await clerk.users.getUser(userId);
    
    if (!isUserAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    return { userId, user };
  } catch (error) {
    safeLogError('Admin auth error', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * Check if current user is admin (for client-side use)
 */
export function useIsAdmin() {
  // This will be used in client components
  // Returns a hook that checks admin status
  return {
    isAdmin: false, // Will be implemented in client components
    loading: true
  };
}

/**
 * Get admin users list
 */
export async function getAdminUsers(): Promise<User[]> {
  const users = await clerk.users.getUserList({
    limit: 100
  });
  
  return users.data.filter(user => isUserAdmin(user));
}

/**
 * Check if any admin users exist in the system
 */
export async function hasAdminUsers(): Promise<boolean> {
  try {
    const adminUsers = await getAdminUsers();
    return adminUsers.length > 0;
  } catch (error) {
    safeLogError('Error checking admin users', error);
    throw new Error('Failed to check admin users');
  }
}

/**
 * Verify admin access for API routes
 */
export async function verifyAdminAccess(): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { success: false, error: 'Authentication required' };
    }

    const user = await clerk.users.getUser(userId);
    
    if (!isUserAdmin(user)) {
      return { success: false, error: 'Admin access required' };
    }

    return { success: true, userId };
  } catch (error) {
    safeLogError('Admin verification error', error);
    return { success: false, error: 'Verification failed' };
  }
}