import { NextRequest, NextResponse } from "next/server";
import { safeLog, safeLogError } from "@/app/lib/security/logging";
import crypto from "crypto";

// PhonePe webhook endpoint for payment status updates
// This endpoint receives notifications from PhonePe when payment status changes

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-phonepe-signature');
    
    // Verify webhook signature (if PhonePe provides one)
    // Note: PhonePe webhook signature verification may vary based on their implementation
    const webhookSecret = process.env.PHONEPE_WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        safeLogError("PhonePe webhook signature verification failed", {
          receivedSignature: signature,
          expectedSignature
        });
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }
    
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
      merchantOrderId: webhookData.merchantOrderId,
      transactionId: webhookData.transactionId,
      status: webhookData.status
    });
    
    // Process different webhook events
    switch (webhookData.event) {
      case 'PAYMENT_SUCCESS':
        await handlePaymentSuccess(webhookData);
        break;
      case 'PAYMENT_FAILED':
        await handlePaymentFailed(webhookData);
        break;
      case 'PAYMENT_PENDING':
        await handlePaymentPending(webhookData);
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

// Handle successful payment webhook
async function handlePaymentSuccess(data: any) {
  try {
    safeLog("info", "Processing payment success webhook", {
      merchantOrderId: data.merchantOrderId,
      transactionId: data.transactionId
    });
    
    // TODO: Update order status in database
    // TODO: Send confirmation email to customer
    // TODO: Trigger any post-payment workflows
    
  } catch (error) {
    safeLogError("Error handling payment success webhook", error);
  }
}

// Handle failed payment webhook
async function handlePaymentFailed(data: any) {
  try {
    safeLog("info", "Processing payment failed webhook", {
      merchantOrderId: data.merchantOrderId,
      transactionId: data.transactionId,
      reason: data.reason
    });
    
    // TODO: Update order status in database
    // TODO: Send failure notification if needed
    
  } catch (error) {
    safeLogError("Error handling payment failed webhook", error);
  }
}

// Handle pending payment webhook
async function handlePaymentPending(data: any) {
  try {
    safeLog("info", "Processing payment pending webhook", {
      merchantOrderId: data.merchantOrderId,
      transactionId: data.transactionId
    });
    
    // TODO: Update order status in database if needed
    
  } catch (error) {
    safeLogError("Error handling payment pending webhook", error);
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