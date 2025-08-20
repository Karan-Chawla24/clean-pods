import { NextRequest, NextResponse } from 'next/server';
import { auth, createClerkClient } from '@clerk/nextjs/server';
import { grantAdminRole } from '../../../lib/clerk-admin';

// Create Clerk client instance
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

/**
 * Temporary endpoint to grant admin role to the current user
 * This should be removed or secured in production
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Grant admin role to the current user
    await grantAdminRole(userId);
    
    // Get updated user data to confirm the role was set
    const user = await clerk.users.getUser(userId);
    
    return NextResponse.json({
      success: true,
      message: 'Admin role granted successfully',
      user: {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        role: user.publicMetadata?.role
      }
    });
  } catch (error) {
    console.error('Grant admin role error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to grant admin role' },
      { status: 500 }
    );
  }
}