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
    
    // Handle both legacy format (with customer object) and new format (with direct customer fields)
    let orderData;
    
    if (data.customer) {
      // Legacy format - transform to new format
      orderData = {
        razorpayOrderId: data.razorpayOrderId,
        paymentId: data.paymentId,
        customer: data.customer,
        items: data.items,
        total: data.total
      };
    } else {
      // New format - create customer object
      orderData = {
        razorpayOrderId: data.razorpayOrderId,
        paymentId: data.paymentId,
        customer: {
          firstName: data.customerName?.split(' ')[0] || 'Customer',
          lastName: data.customerName?.split(' ').slice(1).join(' ') || '',
          email: data.customerEmail || '',
          phone: data.customerPhone || '',
          address: data.address?.split(',')[0] || '',
          city: data.address?.split(',')[1]?.trim() || '',
          state: data.address?.split(',')[2]?.trim() || '',
          pincode: data.address?.split(',')[3]?.trim() || ''
        },
        items: data.items,
        total: data.total
      };
    }
    
    // Validate required fields
    if (!orderData.paymentId || !orderData.customer || !orderData.items || !orderData.total) {
      console.error('Missing required fields:', { 
        hasPaymentId: !!orderData.paymentId, 
        hasCustomer: !!orderData.customer, 
        hasItems: !!orderData.items, 
        hasTotal: !!orderData.total 
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const orderId = await saveOrder(orderData);
    console.log('POST /api/orders - Order created successfully with ID:', orderId);
    
    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
