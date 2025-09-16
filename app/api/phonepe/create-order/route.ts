import { NextRequest, NextResponse } from "next/server";
import { withUpstashRateLimit } from "@/app/lib/security/upstashRateLimit";
import { validateRequest } from "@/app/lib/security/validation";
import { assertSameOrigin } from "@/app/lib/security/origin";
import { safeLog, safeLogError } from "@/app/lib/security/logging";
import { auth } from "@clerk/nextjs/server";
import { createPhonePeOAuthClient } from "@/app/lib/phonepe-oauth";
import { generateOrderId } from "@/app/lib/utils";
import { z } from "zod";

// Validation schema for create order request
const createOrderSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0").max(1000000, "Amount too large"),
  currency: z.string().optional().default("INR"),
  merchantOrderId: z.string().min(1, "Merchant order ID is required"),
  cart: z.array(z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number()
  })).min(1, "Cart must contain at least one item"),
  customerInfo: z.object({
    name: z.string().min(1, "Customer name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().min(10, "Valid phone number is required")
  })
});

export const POST = withUpstashRateLimit("moderate")(async (
  request: NextRequest,
) => {
  try {
    // 🔐 Authentication Check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

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
    const validationResult = await validateRequest(request, createOrderSchema);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 400 }
      );
    }

    const { amount, merchantOrderId, cart, customerInfo } = validationResult.data;

    // 🔑 Initialize PhonePe OAuth client
    let phonePeClient;
    try {
      phonePeClient = createPhonePeOAuthClient();
    } catch (error) {
      safeLogError("PhonePe OAuth client initialization failed", error);
      return NextResponse.json(
        {
          success: false,
          error: "Payment system configuration error. Please try again later."
        },
        { status: 500 }
      );
    }

    // 🏦 Create PhonePe payment request
    // Get the correct base URL for redirects
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'https://your-domain.com'
      : 'http://localhost:3000';
    
    // The redirectUrl is where users are redirected after payment (frontend page)
    // The webhook callback is configured separately in PhonePe dashboard
    const redirectUrl = `${baseUrl}/api/phonepe/callback?merchantOrderId=${merchantOrderId}`;
    
    const paymentRequest = {
      merchantOrderId,
      amount: amount * 100, // Convert to paise
      expireAfter: 1200, // 20 minutes
      metaInfo: {
        udf1: customerInfo.name,
        udf2: customerInfo.email,
        udf3: customerInfo.phone,
        udf4: JSON.stringify(cart.slice(0, 3)), // Store first 3 items
        udf5: `items:${cart.length}`
      },
      paymentFlow: {
        type: "PG_CHECKOUT" as const,
        message: "BubbleBeads - Laundry Detergent Pods",
        merchantUrls: {
          redirectUrl: redirectUrl
        }
      }
    };

    try {
      const paymentResponse = await phonePeClient.createPayment(paymentRequest);

      safeLog("info", "PhonePe OAuth payment created successfully", {
        merchantOrderId,
        phonePeOrderId: paymentResponse.orderId,
        amount,
        userId
      });

      return NextResponse.json({
        success: true,
        orderId: paymentResponse.orderId,
        merchantOrderId,
        paymentUrl: paymentResponse.redirectUrl,
        state: paymentResponse.state,
        expireAt: paymentResponse.expireAt
      });

    } catch (error) {
      safeLogError("Failed to create PhonePe OAuth payment", {
        error,
        merchantOrderId,
        amount,
        userId
      });

      return NextResponse.json(
        {
          success: false,
          error: "Failed to create payment. Please try again."
        },
        { status: 500 }
      );
    }

  } catch (error) {
    safeLogError("Unexpected error in PhonePe create order", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again."
      },
      { status: 500 }
    );
  }
});