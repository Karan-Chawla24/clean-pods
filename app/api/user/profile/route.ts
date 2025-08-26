import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../lib/prisma';
import { validateRequest, userProfileSchema, sanitizeObject } from '../../../lib/security/validation';
import { safeLogError } from '../../../lib/security/logging';

// CSRF validation is handled by Clerk's built-in security measures

export async function PUT(request: NextRequest) {
  let userId: string | null = null;
  
  try {
    const authResult = await auth();
    userId = authResult.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request body
    const validationResult = await validateRequest(request, userProfileSchema);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Invalid input data' 
      }, { status: 400 });
    }

    // Sanitize the validated data
    const sanitizedData = sanitizeObject(validationResult.data);
    const { name, email, phone, address } = sanitizedData;
    
    // Convert address object to string if it exists
    const addressString = address ? 
      `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}` : 
      null;
    
    // Extract first and last name from the name field
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Update or create user profile
    const updatedUser = await prisma.user.upsert({
      where: { id: userId },
      update: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email: email || undefined,
        phone: phone || null,
        address: addressString,
        updatedAt: new Date(),
      },
      create: {
        id: userId,
        email: email || 'unknown@example.com', // Will be updated by Clerk webhook
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        phone: phone || null,
        address: addressString,
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
    safeLogError('Error updating user profile', error, { userId });
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  let userId: string | null = null;
  
  try {
    const authResult = await auth();
    userId = authResult.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile, create if doesn't exist
    const user = await prisma.user.findUnique({
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
    safeLogError('Error fetching user profile', error, { userId });
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
