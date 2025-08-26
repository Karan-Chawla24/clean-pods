import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, rateLimitConfigs } from '@/app/lib/security/rateLimit';
import { 
  verifyRazorpaySignature, 
  validateRazorpayOrder, 
  validateRazorpayPayment,
  sanitizeRazorpayPayload 
} from '@/app/lib/security/razorpay';
import { safeLog, safeLogError } from '@/app/lib/security/logging';

// Required to access raw body in Next.js App Router
export const config = {
  api: {
    bodyParser: false
  }
};

export const POST = withRateLimit(rateLimitConfigs.strict)(async (request: NextRequest) => {
  try {
    const rawBody = await request.text(); // Raw request body string
    const payload = JSON.parse(rawBody);
    const sanitizedPayload = sanitizeRazorpayPayload(payload);

    const razorpaySecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!razorpaySecret) {
      return NextResponse.json({ success: false, error: 'Webhook configuration error' }, { status: 500 });
    }

    // Signature from Razorpay headers
    const signature = request.headers.get('x-razorpay-signature') || '';
    
    // Use timing-safe comparison for signature verification
    if (!verifyRazorpaySignature(rawBody, signature, razorpaySecret)) {
      safeLogError('Razorpay webhook signature verification failed', {
        orderId: sanitizedPayload.razorpay_order_id,
        paymentId: sanitizedPayload.razorpay_payment_id
      });
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    if (!validateRazorpayOrder(sanitizedPayload.razorpay_order_id)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 });
    }

    if (!validateRazorpayPayment(sanitizedPayload.razorpay_payment_id)) {
      return NextResponse.json({ success: false, error: 'Invalid payment ID' }, { status: 400 });
    }

    // Process webhook here
    safeLog('info', 'Razorpay webhook processed successfully', {
      orderId: sanitizedPayload.razorpay_order_id,
      paymentId: sanitizedPayload.razorpay_payment_id
    });
    return NextResponse.json({ success: true });

  } catch (error) {
    safeLogError('Razorpay webhook processing error', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});
