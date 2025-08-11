import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's orders from database
    const orders = await prisma.order.findMany({
      where: { 
        userId: session.user.id 
      },
      include: {
        items: true,
      },
      orderBy: {
        orderDate: 'desc', // Most recent first
      }
    });

    // Format orders to match frontend expectations
    const formattedOrders = orders.map((order: any) => ({
      id: order.id,
      razorpayOrderId: order.razorpayOrderId || order.id,
      paymentId: order.paymentId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      address: order.address,
      total: order.total,
      orderDate: order.orderDate.toISOString(),
      items: order.items.map((item: any) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }))
    }));

    return NextResponse.json({
      success: true,
      orders: formattedOrders
    });

  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderData = await request.json();
    const { 
      razorpayOrderId, 
      paymentId, 
      total, 
      customerName, 
      customerEmail, 
      customerPhone, 
      address, 
      items 
    } = orderData;

    // Create order with user association
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        razorpayOrderId,
        paymentId,
        total,
        customerName: customerName || session.user.name || 'Customer',
        customerEmail: customerEmail || session.user.email!,
        customerPhone: customerPhone || '',
        address: address || '',
        items: {
          create: items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          }))
        }
      },
      include: {
        items: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: {
        id: order.id,
        razorpayOrderId: order.razorpayOrderId,
        paymentId: order.paymentId,
        total: order.total,
        orderDate: order.orderDate.toISOString(),
        items: order.items
      }
    });

  } catch (error) {
    console.error('Error creating user order:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
