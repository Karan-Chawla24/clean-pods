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
    
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));
    
    // Verify the state is COMPLETED as per PhonePe documentation
    if (payload.state !== 'COMPLETED') {
      safeLogError("Order completed webhook received but state is not COMPLETED", {
        state: payload.state,
        merchantOrderId: payload.merchantOrderId
      });
      return;
    }
    
    console.log('Payment details array:', JSON.stringify(payload.paymentDetails, null, 2));
     
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

console.log('Order Status API response:', JSON.stringify(orderStatusResponse, null, 2));
      
      // Extract the response data (Order Status API returns data directly)
      const responseData = orderStatusResponse;
      
      // Log the structure for debugging
      if (responseData.paymentDetails && responseData.paymentDetails.length > 0) {
        console.log('Payment details structure:', {
          paymentDetailsCount: responseData.paymentDetails.length,
          firstPayment: responseData.paymentDetails[0],
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

    // Debug: Log extracted field values
    console.log("=== FIELD EXTRACTION DEBUG ===");
    console.log("UTR:", utr);
    console.log("Bank Name:", bankName);
    console.log("Account Type:", accountType);
    console.log("Card Last 4:", cardLast4);
    console.log("Payment Mode:", paymentMode);
    console.log("Payment Transaction ID:", paymentTransactionId);
    console.log("Fee Amount:", feeAmount);
    console.log("Payable Amount:", payableAmount);
    console.log("Payment Timestamp:", paymentTimestamp);
    console.log("Primary Instrument:", primaryInstrument);
    console.log("Primary Rail:", primaryRail);
    console.log("Latest Payment splitInstruments:", latestPayment?.splitInstruments);
    console.log("===============================");
  }

    // Enhanced debugging for field extraction
    console.log('Field extraction debug info:', {
      hasLatestPayment: !!latestPayment,
      hasSplitInstruments: !!(latestPayment?.splitInstruments?.length),
      splitInstrumentsCount: latestPayment?.splitInstruments?.length || 0,
      primaryInstrumentType: primaryInstrument?.type,
      primaryRailType: primaryRail?.type,
      utrSources: {
        fromSplitRail: latestPayment?.splitInstruments?.[0]?.rail?.utr,
        fromMainRail: latestPayment?.rail?.utr,
        fromSplitUpiId: latestPayment?.splitInstruments?.[0]?.rail?.upiTransactionId,
        fromMainUpiId: latestPayment?.rail?.upiTransactionId,
        finalUtr: utr
      },
      bankNameSources: {
        fromAccountHolder: primaryInstrument?.accountHolderName,
        fromVpa: primaryRail?.vpa,
        finalBankName: bankName
      }
    });
  }

    } catch (apiError) {
      console.error('Failed to fetch order status from PhonePe API:', apiError);
      console.log('Using webhook payload data as fallback...');
      
      // Extract payment details from webhook payload as fallback
      if (payload.paymentDetails && payload.paymentDetails.length > 0) {
        console.log('Found paymentDetails in webhook payload');
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
        
        console.log('Extracted from webhook payload:', {
          paymentMode,
          paymentTransactionId,
          utr,
          bankName,
          accountType,
          cardLast4,
          feeAmount,
          payableAmount
        });
      } else {
        console.log('No paymentDetails in webhook payload, using basic fallback');
        // Use basic webhook data as last resort
        paymentTransactionId = payload.transactionId || null;
        payableAmount = payload.amount;
      }
    }

    console.log('Extracted payment details:', {
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