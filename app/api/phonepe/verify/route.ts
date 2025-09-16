import { NextRequest, NextResponse } from "next/server";
import { withUpstashRateLimit } from "@/app/lib/security/upstashRateLimit";
import { validateRequest } from "@/app/lib/security/validation";
import { assertSameOrigin } from "@/app/lib/security/origin";
import { safeLog, safeLogError } from "@/app/lib/security/logging";
import { createPhonePeOAuthClient } from "@/app/lib/phonepe-oauth";
import { z } from "zod";

// Validation schema for verify request
const verifySchema = z.object({
  merchantOrderId: z.string().min(1, "Merchant order ID is required")
});

export const POST = withUpstashRateLimit("strict")(async (
  request: NextRequest,
) => {
  try {
    // 🔒 CSRF Protection
    try {
      assertSameOrigin(request);
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid Origin") {
        return NextResponse.json({ error: "Invalid Origin" }, { status: 403 });
      }
      throw error;
    }

    // 🔍 Validate request body
    const validationResult = await validateRequest(request, verifySchema);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 400 }
      );
    }

    const { merchantOrderId } = validationResult.data;

    // 🔑 Initialize PhonePe OAuth client
    let phonePeClient;
    try {
      phonePeClient = createPhonePeOAuthClient();
    } catch (error) {
      safeLogError("PhonePe OAuth client initialization failed", error);
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification system not available"
        },
        { status: 500 }
      );
    }

    try {
      // 🔍 Check order status
      const orderStatus = await phonePeClient.getOrderStatus(merchantOrderId, true);
      
      const isSuccessful = orderStatus.state === "COMPLETED";
      const isPending = orderStatus.state === "PENDING";
      const isFailed = orderStatus.state === "FAILED";
      
      let transactionId = null;
      if (isSuccessful) {
        transactionId = phonePeClient.extractTransactionId(orderStatus);
      }

      safeLog("info", "PhonePe OAuth payment verification completed", {
        merchantOrderId,
        phonePeOrderId: orderStatus.orderId,
        state: orderStatus.state,
        transactionId,
        success: isSuccessful
      });

      return NextResponse.json({
        success: isSuccessful,
        state: orderStatus.state,
        orderId: orderStatus.orderId,
        merchantOrderId,
        transactionId,
        amount: orderStatus.amount,
        paymentDetails: orderStatus.paymentDetails,
        isPending,
        isFailed
      });

    } catch (error) {
      safeLogError("Failed to verify PhonePe OAuth payment", {
        error,
        merchantOrderId
      });

      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed"
        },
        { status: 500 }
      );
    }

  } catch (error) {
    safeLogError("Unexpected error in PhonePe OAuth verify", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during verification"
      },
      { status: 500 }
    );
  }
});