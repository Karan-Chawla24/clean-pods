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
    phone: z.string().min(10, "Valid phone number is required"),
    address: z.string().min(1, "Address is required")
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

    // 🌐 Domain Validation for PhonePe Security
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const allowedDomains = ['https://bubblebeads.in', 'https://www.bubblebeads.in', 'http://localhost:3000'];
    
    const isValidOrigin = origin && allowedDomains.some(domain => origin.startsWith(domain));
    const isValidReferer = referer && allowedDomains.some(domain => referer.startsWith(domain));
    
    if (!isValidOrigin && !isValidReferer) {
      safeLogError("PhonePe payment request from unauthorized domain", {
        origin,
        referer,
        allowedDomains
      });
      return NextResponse.json(
        { success: false, error: "Payment requests are only allowed from registered domains" },
        { status: 403 }
      );
    }

    // 🔍 Validate request body
    const validationResult = await validateRequest(request, createOrderSchema);
    if (!validationResult.success) {
      safeLogError("Validation failed in create-order", {
        error: validationResult.error,
        requestBody: await request.clone().json().catch(() => "Could not parse request body")
      });
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
      ? process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://bubblebeads.in'
      : 'http://localhost:3000';
    
    // The redirectUrl should go through the callback handler first to save the order
    // The callback handler will verify payment status and then redirect to success page
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
        udf5: `items:${cart.length}`,
        address: customerInfo.address,
        userId: userId
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