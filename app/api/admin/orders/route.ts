import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders } from '../../../lib/database';
import { requireAdminAuth } from '../../../lib/security/jwt';

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization using JWT
    const authResult = requireAdminAuth(request);
    
    if (authResult instanceof NextResponse) {
      // Authentication failed, return the error response
      return authResult;
    }

    const orders = await getAllOrders();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}