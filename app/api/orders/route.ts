import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders } from '../../lib/database';

export async function GET(request: NextRequest) {
  try {
    const orders = await getAllOrders();
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 