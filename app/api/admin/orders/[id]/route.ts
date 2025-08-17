import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '../../../../lib/database';
import { requireAdminAuth } from '../../../../lib/security/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authorization using JWT
    const authResult = requireAdminAuth(request);
    
    if (authResult instanceof NextResponse) {
      // Authentication failed, return the error response
      return authResult;
    }

    const { id: orderId } = await params;
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const order = await getOrder(orderId);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Return full order details for admin (no masking)
    return NextResponse.json({
      id: order.id,
      razorpayOrderId: order.razorpayOrderId,
      paymentId: order.paymentId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      address: order.address,
      total: order.total,
      orderDate: order.orderDate,
      items: order.items
    });
  } catch (error) {
    console.error('Admin order fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}