import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        items: true
      },
      orderBy: {
        orderDate: 'desc'
      }
    });
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    console.log('POST /api/user/orders - Received data:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.paymentId || !data.items || !data.total) {
      console.error('Missing required fields:', { 
        hasPaymentId: !!data.paymentId, 
        hasItems: !!data.items, 
        hasTotal: !!data.total 
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create order with user association
    const order = await prisma.order.create({
      data: {
        razorpayOrderId: data.razorpayOrderId,
        paymentId: data.paymentId,
        total: data.total,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        address: data.address,
        userId: session.user.id, // Associate with authenticated user
        items: {
          create: data.items.map((item: any) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });
    
    console.log('POST /api/user/orders - Order created successfully with ID:', order.id);
    
    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error('POST /api/user/orders error:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
