import { NextRequest, NextResponse } from 'next/server';
import { createPhonePeOAuthClient } from '@/app/lib/phonepe-oauth';
import { safeLog, safeLogError } from '@/app/lib/security/logging';
import { updatePendingOrderWithPayment } from '@/app/lib/database';
import { prisma } from '@/app/lib/prisma';
import prismaVercel from '@/app/lib/prisma-vercel';
import { sanitizeString } from '@/app/lib/security/validation';
import { withUpstashRateLimit } from '@/app/lib/security/upstashRateLimit';

// Use Vercel-optimized Prisma client in production, standard client in development
const db = process.env.VERCEL ? prismaVercel : prisma;

// Note: Order metadata cache is no longer needed since orders are created before payment initiation

export const GET = withUpstashRateLimit("strict")(async (request: NextRequest) => {
  return handleCallback(request);
});

export const POST = withUpstashRateLimit("strict")(async (request: NextRequest) => {
  return handleCallback(request);
});

// Handle both redirect callbacks (GET) and status checks
async function handleCallback(request: NextRequest) {
  safeLog('info', 'PhonePe callback handler started');
  
  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get('code');
  const rawState = searchParams.get('state');
  const rawMerchantOrderId = searchParams.get('merchantOrderId');
  
  // Sanitize and validate input parameters
  const code = rawCode ? sanitizeString(rawCode) : null;
  const state = rawState ? sanitizeString(rawState) : null;
  const merchantOrderId = rawMerchantOrderId ? sanitizeString(rawMerchantOrderId) : null;
  
  // Validate merchantOrderId format if present
  if (merchantOrderId && !/^[a-zA-Z0-9_-]+$/.test(merchantOrderId)) {
    safeLogError('Invalid merchantOrderId format in callback', { merchantOrderId: 'REDACTED' });
    return NextResponse.redirect(new URL('/checkout?error=invalid_callback', request.url));
  }
  
  safeLog('info', 'Processing callback parameters', { 
    hasCode: !!code, 
    hasState: !!state, 
    merchantOrderId 
  });
  
  safeLog('info', 'PhonePe callback received', {
       method: request.method,
       merchantOrderId,
       hasCode: !!code,
       hasState: !!state
     });
  
  if (!merchantOrderId) {
    safeLogError('No merchantOrderId in callback', {});
    return NextResponse.redirect(new URL('/checkout?error=invalid_callback', request.url));
  }

  try {
    safeLog('info', 'Checking order status and redirect', { merchantOrderId });
    const result = await checkOrderStatusAndRedirect(merchantOrderId, request);
    safeLog('info', 'Order status check completed successfully', { merchantOrderId });
    return result;
  } catch (error) {
    safeLogError('Error in PhonePe callback', error);
    return NextResponse.redirect(new URL('/checkout?error=callback_error', request.url));
  }
}

// Note: saveOrderToDatabase function removed - orders are now created as pending before payment initiation

// Check order status via PhonePe Order Status API and redirect accordingly
async function checkOrderStatusAndRedirect(merchantOrderId: string, request: NextRequest | string) {
  safeLog('info', 'Starting order status check', { merchantOrderId });
  
  const baseUrl = typeof request === 'string' ? request : (process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://bubblebeads.in'
    : 'http://localhost:3000');
  safeLog('info', 'Using base URL for redirects', { 
    baseUrl: baseUrl.replace(/\/+$/, ''),
    merchantOrderId 
  });
    
  try {
    // Initialize PhonePe OAuth client
    safeLog('info', 'Initializing PhonePe OAuth client', { merchantOrderId });
    let phonePeClient;
    try {
      phonePeClient = createPhonePeOAuthClient();
    } catch (error) {
      safeLogError("PhonePe OAuth client initialization failed in callback", error);
      return NextResponse.redirect(new URL("/checkout?error=system_error", baseUrl));
    }

    // Check order status using OAuth API
    safeLog('info', 'Checking order status with PhonePe', { merchantOrderId });
    const orderStatus = await phonePeClient.getOrderStatus(merchantOrderId, true);
    safeLog('info', 'Order status received', { 
      merchantOrderId,
      state: orderStatus.state,
      hasOrderId: !!orderStatus.orderId,
      hasAmount: !!orderStatus.amount
    });

    const isPaymentSuccessful = orderStatus.state === 'COMPLETED';
    const isPaymentPending = orderStatus.state === 'PENDING';
    const isPaymentFailed = orderStatus.state === 'FAILED';

    if (isPaymentSuccessful) {
      safeLog('info', 'Payment successful, processing order', { merchantOrderId });
      
      // Extract transaction ID for successful payments
      const extractedTransactionId = phonePeClient.extractTransactionId(orderStatus);
      const transactionId = extractedTransactionId || `txn_${merchantOrderId}_${Date.now()}`;
      
      safeLog("info", "PhonePe OAuth payment successful", {
        merchantOrderId,
        phonePeOrderId: orderStatus.orderId,
        extractedTransactionId,
        finalTransactionId: transactionId,
        usedFallback: !extractedTransactionId,
        state: orderStatus.state,
        amount: orderStatus.amount,
        hasPaymentDetails: !!orderStatus.paymentDetails,
        paymentDetailsCount: orderStatus.paymentDetails?.length || 0
      });

      // Update pending order with payment details after successful payment
      safeLog('info', 'Attempting to update pending order with payment details', { merchantOrderId });
      try {
        const updatedOrder = await updatePendingOrderWithPayment(merchantOrderId, {
          phonePeOrderId: orderStatus.orderId,   // PhonePe Order ID that user sees (like OMO2509211510025010782264)
          transactionId: transactionId,         // Internal payment transaction ID (like OM2509211510025010782857)
          paymentState: 'COMPLETED'
        });
        
        if (!updatedOrder) {
          safeLogError('Failed to update pending order - order not found', { merchantOrderId });
          // Continue with redirect even if update fails
        } else {
          safeLog('info', 'Pending order updated successfully', { 
            merchantOrderId,
            orderId: updatedOrder.id 
          });
        }

      } catch (error) {
        safeLogError("Failed to update pending order with payment details", {
          error,
          merchantOrderId,
          phonePeOrderId: orderStatus.orderId,
          transactionId
        });
        // Continue with redirect even if update fails
      }

      // Redirect to success page with minimal parameters (industry standard)
      // Only include merchantOrderId - order details will be fetched securely from backend
      const successUrl = new URL(`/order-success?order_id=${merchantOrderId}`, baseUrl);
      safeLog('info', 'Redirecting to success page', { 
        merchantOrderId,
        transactionId: transactionId || 'N/A',
        phonePeOrderId: orderStatus.orderId || 'N/A'
      });
      return NextResponse.redirect(successUrl);
    } else if (isPaymentPending) {
      safeLog('info', 'Payment is still pending', { merchantOrderId });
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
      safeLog('warn', 'Payment failed or cancelled', { 
      });
      safeLogError("PhonePe OAuth payment failed", {
        merchantOrderId,
        phonePeOrderId: orderStatus.orderId,
        state: orderStatus.state,
        hasOrderStatus: !!orderStatus
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
