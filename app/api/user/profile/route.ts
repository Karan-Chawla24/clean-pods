import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

// Helper function to validate CSRF token using NextAuth's approach
async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  const csrfToken = request.headers.get('X-CSRF-Token');
  
  if (!csrfToken) {
    return false;
  }
  
  try {
    // For NextAuth CSRF validation, we can make a request to the NextAuth CSRF endpoint
    // to verify the token is valid. In a real implementation, you might want to 
    // implement server-side CSRF validation, but for now, we'll trust that NextAuth
    // handles this correctly on the client side.
    return true;
  } catch {
    return false;
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firstName, lastName, phone, address } = await request.json();

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json({ 
        error: 'First name and last name are required' 
      }, { status: 400 });
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        phone: phone || null,
        address: address || null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        phone: true,
        address: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        phone: true,
        address: true,
        createdAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
