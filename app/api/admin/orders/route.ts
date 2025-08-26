import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders } from '../../../lib/database';
import { requireClerkAdminAuth } from '../../../lib/clerk-admin';
import { safeLogError } from '../../../lib/security/logging';

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization using Clerk
    const authResult = await requireClerkAdminAuth(request);
    
    if (authResult instanceof NextResponse) {
      // Authentication failed, return the error response
      return authResult;
    }

    const orders = await getAllOrders();
    return NextResponse.json(orders);
  } catch (error) {
    safeLogError('Admin orders fetch error', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}