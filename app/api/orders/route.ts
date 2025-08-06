import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, saveOrder } from '../../lib/database';

export async function GET() {
  try {
    const orders = await getAllOrders();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('Creating order with data:', data);
    
    const orderId = await saveOrder(data);
    console.log('Order created successfully with ID:', orderId);
    
    return NextResponse.json({ orderId });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 