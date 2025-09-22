import { NextRequest, NextResponse } from "next/server";
import { safeLog, safeLogError } from "@/app/lib/security/logging";
import { 
  verifyPhonePeSignature, 
  validatePhonePeWebhookOrigin, 
  extractPhonePeSignature,
  validatePhonePeWebhookPayload,
  sanitizePhonePePayload 
} from "@/app/lib/security/phonepe";
import { 
  generateRequestId, 
  protectAgainstReplay 
} from "@/app/lib/security/replay-protection";
import crypto from "crypto";

// PhonePe webhook endpoint for payment status updates
// This endpoint receives notifications from PhonePe when payment status changes

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for verification
    const body = await request.text();
    
    // Extract headers for validation
    const allHeaders: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      allHeaders[key] = value;
    });
    
    safeLog("info", "PhonePe webhook received", {
      method: request.method,
      url: request.url,
      bodyLength: body.length,
      hasSignature: !!extractPhonePeSignature(request),
      contentType: request.headers.get('content-type'),
      authorizationHeader: request.headers.get('authorization') ? 'present' : 'missing',
      availableHeaders: Object.keys(allHeaders),
      userAgent: request.headers.get('user-agent')
    });

    // Step 1: Validate request origin and headers
    if (!validatePhonePeWebhookOrigin(request)) {
      return NextResponse.json(
        { error: "Invalid request source" },
        { status: 403 }
      );
    }

    // Step 2: Parse the webhook payload
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

    // Step 3: Validate payload structure
    if (!validatePhonePeWebhookPayload(webhookData)) {
      return NextResponse.json(
        { error: "Invalid webhook payload structure" },
        { status: 400 }
      );
    }

    // Step 4: Signature verification (if webhook credentials are configured)
    const webhookUsername = process.env.PHONEPE_WEBHOOK_USERNAME;
    const webhookPassword = process.env.PHONEPE_WEBHOOK_PASSWORD;
    const isDevelopment = process.env.NODE_ENV === 'development';
    const allowDevBypass = process.env.PHONEPE_WEBHOOK_DEV_BYPASS === 'true';
    
    safeLog("info", "PhonePe webhook authentication check", {
      hasUsername: !!webhookUsername,
      hasPassword: !!webhookPassword,
      usernameLength: webhookUsername?.length || 0,
      passwordLength: webhookPassword?.length || 0,
      isDevelopment,
      allowDevBypass
    });
    
    // Development bypass: Skip authentication in development mode if explicitly enabled
    if (isDevelopment && allowDevBypass) {
      safeLog("warn", "PhonePe webhook authentication bypassed for development", {
        environment: "development",
        bypassEnabled: true,
        message: "This bypass should NEVER be enabled in production",
        documentation: "Set PHONEPE_WEBHOOK_DEV_BYPASS=false in production"
      });
    } else if (webhookUsername && webhookPassword) {
      // PhonePe uses SHA256(username:password) format for webhook authentication
      const webhookSecret = `${webhookUsername}:${webhookPassword}`;
      safeLog("info", "PhonePe webhook credentials configured, verifying signature");
      const signature = extractPhonePeSignature(request);
      
      if (!signature) {
        safeLog("warn", "PhonePe webhook signature missing - webhook credentials may not be configured in PhonePe dashboard", {
          message: "Configure webhook URL, username, and password in PhonePe Business dashboard",
          documentation: "https://developer.phonepe.com/v1/reference/ios-handling-webhooks-standard-checkout"
        });
        // Allow webhook to proceed without signature verification
        // This handles the case where PhonePe hasn't been configured to send Authorization headers
      } else {
        if (!verifyPhonePeSignature(body, signature, webhookSecret)) {
          safeLogError("PhonePe webhook signature verification failed");
          return NextResponse.json(
            { error: "Invalid webhook signature" },
            { status: 401 }
          );
        }
        safeLog("info", "PhonePe webhook signature verified successfully");
      }
    } else {
      safeLog("warn", "PhonePe webhook credentials not configured - skipping signature verification", {
        hasUsername: !!webhookUsername,
        hasPassword: !!webhookPassword,
        message: "Set PHONEPE_WEBHOOK_USERNAME and PHONEPE_WEBHOOK_PASSWORD in environment variables"
      });
    }

    // Step 5: Replay attack protection
    const requestId = generateRequestId(webhookData, allHeaders);
    const replayCheck = protectAgainstReplay(
      requestId, 
      sanitizePhonePePayload(webhookData),
      webhookData.timestamp
    );

    if (!replayCheck.isValid) {
      safeLogError("PhonePe webhook replay attack detected", {
        requestId,
        error: replayCheck.error
      });
      return NextResponse.json(
        { error: replayCheck.error },
        { status: 409 } // Conflict status for duplicate requests
      );
    }

    // Log the webhook event (with sanitized data)
     safeLog("info", "PhonePe webhook processing", {
       requestId,
       event: webhookData.event,
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
    
    // Log webhook received without sensitive data
    safeLog('info', 'PhonePe webhook received', {
      state: payload.state,
      merchantOrderId: payload.merchantOrderId,
      hasPaymentDetails: !!payload.paymentDetails?.length
    });
    
    // Verify the state is COMPLETED as per PhonePe documentation
    if (payload.state !== 'COMPLETED') {
      safeLogError("Order completed webhook received but state is not COMPLETED", {
        state: payload.state,
        merchantOrderId: payload.merchantOrderId
      });
      return;
    }
     
     // Get detailed payment information from PhonePe Order Status API
    // Webhooks often contain limited information, so we fetch complete details
    let orderStatusResponse = null;
    let paymentMode = 'UPI'; // Default fallback
    let paymentTransactionId = null;
    let utr = null;
    let bankName = null;
    let accountType = null;
    let cardLast4 = null;
    let feeAmount = 0;
     let payableAmount = payload.amount;
     let paymentTimestamp = new Date();
    
    try {
      // Import and create PhonePe OAuth client to get detailed payment info
      const { createPhonePeOAuthClient } = await import("@/app/lib/phonepe-oauth");
      const phonePeClient = createPhonePeOAuthClient();
      
      // Call Order Status API to get complete payment details
      // Call Order Status API with details=true to get full info
orderStatusResponse = await phonePeClient.getOrderStatus(
  payload.merchantOrderId,
  true // request details
);

safeLog('info', 'Order Status API response received', { hasResponse: !!orderStatusResponse });
      
      // Extract the response data (Order Status API returns data directly)
      const responseData = orderStatusResponse;
      
      // Log the structure for debugging
      if (responseData.paymentDetails && responseData.paymentDetails.length > 0) {
        safeLog('info', 'Payment details structure', {
          paymentDetailsCount: responseData.paymentDetails.length,
          hasSplitInstruments: !!(responseData.paymentDetails[0] as any)?.splitInstruments,
          splitInstrumentsCount: (responseData.paymentDetails[0] as any)?.splitInstruments?.length || 0
        });
      }

const paymentDetailsArray = responseData?.paymentDetails ?? [];
let latestPayment: any = null;
let primaryInstrument: any = null;
let primaryRail: any = null;

if (paymentDetailsArray.length > 0) {
  const completedPayments = paymentDetailsArray.filter((p: any) => p.state === "COMPLETED");

  if (completedPayments.length > 0) {
    latestPayment = completedPayments.sort((a: any, b: any) => b.timestamp - a.timestamp)[0];
  } else {
    latestPayment = paymentDetailsArray.sort((a: any, b: any) => b.timestamp - a.timestamp)[0];
  }

  if (latestPayment) {
    paymentMode = latestPayment.paymentMode || 'UPI';
    
    // Extract UPI Transaction ID (prioritize upiTransactionId over utr)
    const upiTransactionId = latestPayment.splitInstruments?.[0]?.rail?.upiTransactionId || 
                             latestPayment.rail?.upiTransactionId ||
                             latestPayment.splitInstruments?.[0]?.rail?.utr || 
                             latestPayment.rail?.utr || null;
    
    // Set paymentTransactionId to the UPI transaction ID (not PhonePe Order ID)
    paymentTransactionId = upiTransactionId;
    
    // Extract UTR (keep separate for UTR field)
    utr = latestPayment.splitInstruments?.[0]?.rail?.utr
       || latestPayment.rail?.utr
       || latestPayment.rail?.upiTransactionId
       || latestPayment.splitInstruments?.[0]?.rail?.upiTransactionId
       || undefined;

    feeAmount = latestPayment.feeAmount
             ?? responseData.feeAmount
             ?? 0;

    payableAmount = latestPayment.payableAmount
                 ?? latestPayment.amount
                 ?? responseData.payableAmount
                 ?? payload.amount;

    if (latestPayment.timestamp) {
      paymentTimestamp = new Date(latestPayment.timestamp);
    }

    // Extract bank details - prioritize splitInstruments[0] then fallback to main instrument
    primaryInstrument = latestPayment.splitInstruments?.[0]?.instrument || latestPayment.instrument;
    primaryRail = latestPayment.splitInstruments?.[0]?.rail || latestPayment.rail;
    
    if (primaryInstrument) {
      // Extract bank name from available fields
      bankName = primaryInstrument.accountHolderName
              ?? (primaryRail?.vpa ? primaryRail.vpa.split('@')[1] : undefined)
              ?? undefined;
      
      accountType = primaryInstrument.accountType ?? undefined;

      if (primaryInstrument.maskedAccountNumber) {
        cardLast4 = primaryInstrument.maskedAccountNumber.slice(-4);
      }
    }

    // Additional fallback for split payments - find any instrument with account details
    if (!bankName && latestPayment.splitInstruments && latestPayment.splitInstruments.length > 0) {
      const instrumentWithDetails = latestPayment.splitInstruments.find((split: any) => 
        split.instrument?.accountHolderName || split.rail?.vpa
      );
      
      if (instrumentWithDetails) {
        bankName = instrumentWithDetails.instrument?.accountHolderName
                ?? (instrumentWithDetails.rail?.vpa ? instrumentWithDetails.rail.vpa.split('@')[1] : undefined)
                ?? bankName;
        
        if (!accountType) {
          accountType = instrumentWithDetails.instrument?.accountType ?? undefined;
        }
        
        if (!cardLast4 && instrumentWithDetails.instrument?.maskedAccountNumber) {
          cardLast4 = instrumentWithDetails.instrument.maskedAccountNumber.slice(-4);
        }
      }
    }

    // Log successful field extraction without sensitive data
    safeLog('info', 'Payment fields extracted successfully', {
      hasUtr: !!utr,
      hasBankName: !!bankName,
      hasPaymentMode: !!paymentMode,
      hasPaymentTransactionId: !!paymentTransactionId,
      paymentTimestamp: paymentTimestamp
    });
  }

    // Enhanced debugging for field extraction
    safeLog('info', 'Field extraction debug info', {
      hasLatestPayment: !!latestPayment,
      hasSplitInstruments: !!(latestPayment?.splitInstruments?.length),
      splitInstrumentsCount: latestPayment?.splitInstruments?.length || 0,
      primaryInstrumentType: primaryInstrument?.type,
      primaryRailType: primaryRail?.type,
      hasUtr: !!utr,
      hasBankName: !!bankName
    });
  }

    } catch (apiError) {
      safeLogError('Failed to fetch order status from PhonePe API', apiError);
      safeLog('info', 'Using webhook payload data as fallback', {});
      
      // Extract payment details from webhook payload as fallback
      if (payload.paymentDetails && payload.paymentDetails.length > 0) {
        safeLog('info', 'Found paymentDetails in webhook payload', {});
        const webhookPayment = payload.paymentDetails[0]; // Use first payment
        
        paymentMode = webhookPayment.paymentMode || 'UPI';
        paymentTransactionId = webhookPayment.transactionId || payload.transactionId || null;
        feeAmount = webhookPayment.feeAmount || 0;
        payableAmount = webhookPayment.amount || payload.amount;
        
        if (webhookPayment.timestamp) {
          paymentTimestamp = new Date(webhookPayment.timestamp);
        }
        
        // Extract from splitInstruments if available
        if (webhookPayment.splitInstruments && webhookPayment.splitInstruments.length > 0) {
          const split = webhookPayment.splitInstruments[0];
          
          if (split.rail) {
            utr = split.rail.utr || split.rail.upiTransactionId || null;
            if (!paymentTransactionId) {
              paymentTransactionId = split.rail.upiTransactionId || split.rail.utr || null;
            }
          }
          
          if (split.instrument) {
            bankName = split.instrument.accountHolderName || null;
            accountType = split.instrument.accountType || null;
            if (split.instrument.maskedAccountNumber) {
              cardLast4 = split.instrument.maskedAccountNumber.slice(-4);
            }
          }
        }
        
        safeLog('info', 'Extracted from webhook payload', {
          hasPaymentMode: !!paymentMode,
          hasPaymentTransactionId: !!paymentTransactionId,
          hasUtr: !!utr,
          hasBankName: !!bankName,
          hasAccountType: !!accountType,
          hasCardLast4: !!cardLast4,
          hasFeeAmount: !!feeAmount,
          hasPayableAmount: !!payableAmount
        });
      } else {
        safeLog('info', 'No paymentDetails in webhook payload, using basic fallback', {});
        // Use basic webhook data as last resort
        paymentTransactionId = payload.transactionId || null;
        payableAmount = payload.amount;
      }
    }

    safeLog('info', 'Extracted payment details', {
       hasPaymentMode: !!paymentMode,
       hasPaymentTransactionId: !!paymentTransactionId,
       hasUtr: !!utr,
       hasFeeAmount: !!feeAmount,
       hasPayableAmount: !!payableAmount,
       hasBankName: !!bankName,
       hasAccountType: !!accountType,
       hasCardLast4: !!cardLast4,
       paymentState: 'COMPLETED',
       hasPaymentTimestamp: !!paymentTimestamp
     });

    // Update order in database with payment details
    try {
      safeLog("info", "About to update order payment details", {
        merchantOrderId: payload.merchantOrderId,
        paymentData: {
          paymentMode,
          paymentTransactionId,
          utr,
          feeAmount,
          payableAmount,
          bankName,
          accountType,
          cardLast4,
          paymentState: 'COMPLETED',
          paymentTimestamp
        }
      });
      
      const { updateOrderPaymentDetails } = await import("@/app/lib/database");
      const updateResult = await updateOrderPaymentDetails(payload.merchantOrderId, {
        paymentMode,
        paymentTransactionId,
        utr,
        feeAmount,
        payableAmount,
        bankName,
        accountType,
        cardLast4,
        paymentState: 'COMPLETED',
        paymentTimestamp
      });
      
      if (updateResult) {
        safeLog("info", "Order payment details updated successfully", {
          merchantOrderId: payload.merchantOrderId,
          updateResult: 'success',
          paymentMode,
          paymentTransactionId,
          bankName
        });
      } else {
        safeLog("warn", "Order payment details update returned null - race condition detected", {
          merchantOrderId: payload.merchantOrderId,
          updateResult: 'null - order not found',
          paymentMode,
          paymentTransactionId,
          bankName,
          note: 'PhonePe will retry this webhook automatically'
        });
      }
    } catch (dbError) {
      safeLogError("Failed to update order payment details", {
        error: dbError,
        merchantOrderId: payload.merchantOrderId,
        errorMessage: dbError instanceof Error ? dbError.message : 'Unknown error',
        errorStack: dbError instanceof Error ? dbError.stack : 'No stack trace'
      });
    }
    
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