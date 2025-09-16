import { NextRequest, NextResponse } from 'next/server';
import { createPhonePeOAuthClient } from '@/app/lib/phonepe-oauth';
import { safeLog, safeLogError } from '@/app/lib/security/logging';

export async function GET(request: NextRequest) {
  return handleCallback(request);
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}

// Handle both redirect callbacks (GET) and status checks
async function handleCallback(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const merchantOrderId = searchParams.get('merchantOrderId');
  
  safeLog('info', 'PhonePe callback received', {
       method: request.method,
       merchantOrderId,
       allParams: Object.fromEntries(searchParams.entries())
     });
  
  if (!merchantOrderId) {
    safeLogError('No merchantOrderId in callback', {});
    return NextResponse.redirect(new URL('/checkout?error=invalid_callback', request.url));
  }
  
  // Check order status using PhonePe Order Status API
  return checkOrderStatusAndRedirect(merchantOrderId, request);
}

// Check order status via PhonePe Order Status API and redirect accordingly
async function checkOrderStatusAndRedirect(merchantOrderId: string, request: NextRequest) {
  // Get the correct base URL for redirects (use localhost instead of 0.0.0.0)
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'https://your-domain.com'
    : 'http://localhost:3000';
    
  try {
    // Initialize PhonePe OAuth client
    let phonePeClient;
    try {
      phonePeClient = createPhonePeOAuthClient();
    } catch (error) {
      safeLogError("PhonePe OAuth client initialization failed in callback", error);
      return NextResponse.redirect(new URL("/checkout?error=system_error", baseUrl));
    }

    // Check order status using OAuth API
    const orderStatus = await phonePeClient.getOrderStatus(merchantOrderId, true);

    const isPaymentSuccessful = orderStatus.state === 'COMPLETED';
    const isPaymentPending = orderStatus.state === 'PENDING';
    const isPaymentFailed = orderStatus.state === 'FAILED';

    if (isPaymentSuccessful) {
      // Extract transaction ID for successful payments
      const transactionId = phonePeClient.extractTransactionId(orderStatus);
      
      safeLog("info", "PhonePe OAuth payment successful", {
        merchantOrderId,
        phonePeOrderId: orderStatus.orderId,
        transactionId,
        state: orderStatus.state,
        amount: orderStatus.amount
      });

      // Redirect to success page with order details
      return NextResponse.redirect(
        new URL(`/order-success?order_id=${merchantOrderId}&transactionId=${transactionId}&phonePeOrderId=${orderStatus.orderId}`, baseUrl)
      );
    } else if (isPaymentPending) {
      safeLog("info", "PhonePe OAuth payment pending", {
        merchantOrderId,
        phonePeOrderId: orderStatus.orderId,
        state: orderStatus.state
      });

      // Redirect back to checkout with pending status
      return NextResponse.redirect(
        new URL(`/checkout?status=pending&orderId=${merchantOrderId}&message=Payment is still pending. Please complete the payment.`, baseUrl)
      );
    } else {
      safeLogError("PhonePe OAuth payment failed", {
        merchantOrderId,
        phonePeOrderId: orderStatus.orderId,
        state: orderStatus.state,
        orderStatus
      });

      // Redirect to checkout with error
      return NextResponse.redirect(
        new URL(`/checkout?error=payment_failed&orderId=${merchantOrderId}`, baseUrl)
      );
    }

  } catch (error) {
    safeLogError("PhonePe OAuth callback processing error", error);
    return NextResponse.redirect(new URL("/checkout?error=callback_error", baseUrl));
  }
}