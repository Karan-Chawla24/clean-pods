import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { withUpstashRateLimit } from '@/app/lib/security/upstashRateLimit';
import { validateRequest, razorpayWebhookSchema } from '@/app/lib/security/validation';
import { validateRazorpayOrder, validateRazorpayPayment } from '@/app/lib/security/razorpay';
import { safeLog, safeLogError } from '@/app/lib/security/logging';
import { assertSameOrigin } from '@/app/lib/security/origin';

export const POST = withUpstashRateLimit('strict')(async (request: NextRequest) => {
  try {
    // CSRF Protection: Validate origin header
    try {
      assertSameOrigin(request);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid Origin') {
        return NextResponse.json(
          { error: 'Invalid Origin' },
          { status: 403 }
        );
      }
      throw error;
    }

    // Check if Razorpay key secret is configured
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      safeLogError('RAZORPAY_KEY_SECRET is not configured');
      return NextResponse.json(
        { success: false, error: 'Payment verification not configured properly' },
        { status: 500 }
      );
    }

    // Validate request body with Zod schema
    const validationResult = await validateRequest(request, razorpayWebhookSchema);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = validationResult.data;

    // Additional validation for order and payment IDs
    if (!validateRazorpayOrder(razorpay_order_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID format' },
        { status: 400 }
      );
    }

    if (!validateRazorpayPayment(razorpay_payment_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment ID format' },
        { status: 400 }
      );
    }

    // Verify the payment signature using HMAC
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpay_signature)
    );

    if (isSignatureValid) {
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      });
    } else {
      safeLogError('Payment signature verification failed', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 401 }
      );
    }
  } catch (error) {
    safeLogError('Payment verification error', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to verify payment'
      },
      { status: 500 }
    );
  }
});