import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, saveOrder } from '../../lib/database';
import { headers } from 'next/headers';

export async function GET() {
  // This endpoint is now secured - only admin should access
  const headersList = await headers();
  const adminHeader = headersList.get('X-Admin-Key');
  
  if (adminHeader !== process.env.ADMIN_ORDERS_KEY) {
    return NextResponse.json(
      { error: 'Access denied. This endpoint requires admin authentication.' },
      { status: 403 }
    );
  }

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
    console.log('POST /api/orders - Received data:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.paymentId || !data.customer || !data.items || !data.total) {
      console.error('Missing required fields:', { 
        hasPaymentId: !!data.paymentId, 
        hasCustomer: !!data.customer, 
        hasItems: !!data.items, 
        hasTotal: !!data.total 
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const orderId = await saveOrder(data);
    console.log('POST /api/orders - Order created successfully with ID:', orderId);
    
    return NextResponse.json({ orderId });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 