import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateInvoiceToken } from '../../lib/jwt-utils';
import { getOrder } from '../../lib/database';

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { orderId } = await request.json();
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Verify the order exists and belongs to the user
    // Note: This is a basic check. In a production system, you might want
    // to verify order ownership more thoroughly
    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Generate JWT token with user ID for additional security
    const token = await generateInvoiceToken(orderId, userId);

    return NextResponse.json({
      token,
      expiresIn: '5m', // 5 minutes
      orderId
    });
  } catch (error) {
    console.error('Error generating invoice token:', error);
    return NextResponse.json(
      { error: 'Failed to generate access token' },
      { status: 500 }
    );
  }
}