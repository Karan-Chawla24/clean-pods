import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Check if environment variables are set
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.error('Razorpay environment variables not set!');
  console.error('RAZORPAY_KEY_ID:', keyId ? 'SET' : 'NOT SET');
  console.error('RAZORPAY_KEY_SECRET:', keySecret ? 'SET' : 'NOT SET');
}

const razorpay = new Razorpay({
  key_id: keyId || 'rzp_test_placeholder',
  key_secret: keySecret || 'placeholder_secret',
});

export async function POST(request: NextRequest) {
  try {
    // Check if environment variables are set
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Razorpay configuration not found. Please check your environment variables.' 
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { amount, currency = 'INR', receipt } = body;

    console.log('Creating Razorpay order with:', { amount, currency, receipt });

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);

    console.log('Razorpay order created:', order.id);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 