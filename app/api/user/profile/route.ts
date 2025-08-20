import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../lib/prisma';

// CSRF validation is handled by Clerk's built-in security measures

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firstName, lastName, phone, address } = await request.json();

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json({ 
        error: 'First name and last name are required' 
      }, { status: 400 });
    }

    // Update or create user profile
    const updatedUser = await prisma.user.upsert({
      where: { id: userId },
      update: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        phone: phone || null,
        address: address || null,
        updatedAt: new Date(),
      },
      create: {
        id: userId,
        email: 'unknown@example.com', // Will be updated by Clerk webhook
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        phone: phone || null,
        address: address || null,
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
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile, create if doesn't exist
    let user = await prisma.user.findUnique({
      where: { id: userId },
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

    // If user doesn't exist in database, return empty profile data
    // The frontend will use Clerk data as primary source
    if (!user) {
      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          email: null,
          firstName: null,
          lastName: null,
          name: null,
          phone: null,
          address: null,
          createdAt: new Date()
        }
      });
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
