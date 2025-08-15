import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { withRateLimit, rateLimitConfigs } from '@/app/lib/security/rateLimit';
import { validateRequest, createOrderSchema } from '@/app/lib/security/validation';

// Check if environment variables are set
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  // Environment variables not configured
}

const razorpay = new Razorpay({
  key_id: keyId || 'rzp_test_placeholder',
  key_secret: keySecret || 'placeholder_secret',
});

export const POST = withRateLimit(rateLimitConfigs.moderate)(async (request: NextRequest) => {
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

    // Validate request body with Zod schema
    const validationResult = await validateRequest(request, createOrderSchema);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 400 }
      );
    }

    const { amount, currency, receipt } = validationResult.data;

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: currency || 'INR',
      receipt,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});