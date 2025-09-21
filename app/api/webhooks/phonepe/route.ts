import { NextRequest, NextResponse } from "next/server";
import { safeLog, safeLogError } from "@/app/lib/security/logging";
import crypto from "crypto";

// PhonePe webhook endpoint for payment status updates
// This endpoint receives notifications from PhonePe when payment status changes

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for verification
    const body = await request.text();
    
    // Log all headers for debugging (in production, be careful with sensitive data)
    const allHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    
    safeLog("info", "PhonePe webhook received", {
      method: request.method,
      url: request.url,
      headers: allHeaders,
      bodyLength: body.length,
      bodyPreview: body.substring(0, 200) + (body.length > 200 ? "..." : "")
    });
    
    // PhonePe webhook validation
    // Note: PhonePe webhooks don't send Authorization headers in production
    // They configure webhooks server-to-server on their backend
    
    // Validate request origin - PhonePe webhooks come from specific IP ranges
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');
    
    safeLog("info", "PhonePe webhook validation", {
      forwardedFor,
      realIp,
      userAgent,
      hasPhonePeUserAgent: userAgent?.includes('okhttp') || userAgent?.includes('PPE'),
      contentType: request.headers.get('content-type')
    });
    
    // Basic validation: Check if request looks like it's from PhonePe
    const isValidPhonePeRequest = (
      userAgent?.includes('okhttp') && userAgent?.includes('PPE')
    ) || (
      userAgent?.includes('hermes')
    );
    
    if (!isValidPhonePeRequest) {
      safeLogError("PhonePe webhook invalid user agent", {
        userAgent,
        forwardedFor,
        realIp
      });
      return NextResponse.json(
        { error: "Invalid request source" },
        { status: 403 }
      );
    }
    
    safeLog("info", "PhonePe webhook validation passed");
    
    // Parse the webhook payload
    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (parseError) {
      safeLogError("Failed to parse PhonePe webhook payload", parseError);
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }
    
    // Log the webhook event
    safeLog("info", "PhonePe webhook received", {
      event: webhookData.event || 'unknown',
      merchantOrderId: webhookData.payload?.merchantOrderId,
      orderId: webhookData.payload?.orderId,
      state: webhookData.payload?.state
    });
    
    // Process different webhook events according to PhonePe documentation
    switch (webhookData.event) {
      case 'checkout.order.completed':
        await handleOrderCompleted(webhookData.payload);
        break;
      case 'checkout.order.failed':
        await handleOrderFailed(webhookData.payload);
        break;
      case 'pg.refund.completed':
        await handleRefundCompleted(webhookData.payload);
        break;
      case 'pg.refund.failed':
        await handleRefundFailed(webhookData.payload);
        break;
      default:
        safeLog("warn", "Unhandled PhonePe webhook event", {
          event: webhookData.event
        });
    }
    
    // Return success response
    return NextResponse.json({ status: "success" }, { status: 200 });
    
  } catch (error) {
    safeLogError("Error processing PhonePe webhook", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle completed order webhook (checkout.order.completed)
async function handleOrderCompleted(payload: any) {
  try {
    safeLog("info", "Processing order completed webhook", {
      merchantOrderId: payload.merchantOrderId,
      orderId: payload.orderId,
      state: payload.state,
      amount: payload.amount,
      paymentDetails: payload.paymentDetails
    });
    
    // Verify the state is COMPLETED as per PhonePe documentation
    if (payload.state !== 'COMPLETED') {
      safeLogError("Order completed webhook received but state is not COMPLETED", {
        state: payload.state,
        merchantOrderId: payload.merchantOrderId
      });
      return;
    }
    
    // TODO: Update order status in database to COMPLETED
    // TODO: Send confirmation email to customer
    // TODO: Trigger any post-payment workflows
    // TODO: Update inventory if needed
    
  } catch (error) {
    safeLogError("Error handling order completed webhook", error);
  }
}

// Handle failed order webhook (checkout.order.failed)
async function handleOrderFailed(payload: any) {
  try {
    safeLog("info", "Processing order failed webhook", {
      merchantOrderId: payload.merchantOrderId,
      orderId: payload.orderId,
      state: payload.state,
      amount: payload.amount,
      paymentDetails: payload.paymentDetails
    });
    
    // Verify the state is FAILED as per PhonePe documentation
    if (payload.state !== 'FAILED') {
      safeLogError("Order failed webhook received but state is not FAILED", {
        state: payload.state,
        merchantOrderId: payload.merchantOrderId
      });
      return;
    }
    
    // TODO: Update order status in database to FAILED
    // TODO: Send failure notification if needed
    // TODO: Release any reserved inventory
    
  } catch (error) {
    safeLogError("Error handling order failed webhook", error);
  }
}

// Handle completed refund webhook (pg.refund.completed)
async function handleRefundCompleted(payload: any) {
  try {
    safeLog("info", "Processing refund completed webhook", {
      originalMerchantOrderId: payload.originalMerchantOrderId,
      refundId: payload.refundId,
      amount: payload.amount,
      state: payload.state
    });
    
    // Verify the state is COMPLETED as per PhonePe documentation
    if (payload.state !== 'COMPLETED') {
      safeLogError("Refund completed webhook received but state is not COMPLETED", {
        state: payload.state,
        refundId: payload.refundId
      });
      return;
    }
    
    // TODO: Update refund status in database to COMPLETED
    // TODO: Send refund confirmation email to customer
    // TODO: Update order status if fully refunded
    
  } catch (error) {
    safeLogError("Error handling refund completed webhook", error);
  }
}

// Handle failed refund webhook (pg.refund.failed)
async function handleRefundFailed(payload: any) {
  try {
    safeLog("info", "Processing refund failed webhook", {
      originalMerchantOrderId: payload.originalMerchantOrderId,
      refundId: payload.refundId,
      amount: payload.amount,
      state: payload.state,
      errorCode: payload.errorCode
    });
    
    // TODO: Update refund status in database to FAILED
    // TODO: Handle refund failure appropriately
    // TODO: Notify relevant stakeholders
    
  } catch (error) {
    safeLogError("Error handling refund failed webhook", error);
  }
}

// GET method for webhook verification (if PhonePe requires it)
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('challenge');
  
  if (challenge) {
    // Return the challenge for webhook verification
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json(
    { message: "PhonePe webhook endpoint is active" },
    { status: 200 }
  );
}