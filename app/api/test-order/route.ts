import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('Testing order creation...');
    
    // Create a test order
    const testOrder = await prisma.order.create({
      data: {
        paymentId: 'test-payment-123',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '1234567890',
        address: 'Test Address',
        total: 100.00,
        items: {
          create: [
            {
              name: 'Test Product',
              price: 100.00,
              quantity: 1,
            }
          ]
        }
      },
      include: { items: true },
    });
    
    console.log('Test order created:', testOrder);
    
    return NextResponse.json({
      success: true,
      message: 'Test order created successfully',
      order: testOrder
    });
    
  } catch (error) {
    console.error('Test order creation failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Test order creation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 