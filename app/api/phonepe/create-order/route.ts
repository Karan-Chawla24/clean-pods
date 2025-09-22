import { NextRequest, NextResponse } from "next/server";
import { withUpstashRateLimit } from "@/app/lib/security/upstashRateLimit";
import { validateRequest } from "@/app/lib/security/validation";
import { assertSameOrigin } from "@/app/lib/security/origin";
import { safeLog, safeLogError } from "@/app/lib/security/logging";
import { 
  generateRequestId, 
  protectAgainstReplay 
} from "@/app/lib/security/replay-protection";
import { auth } from "@clerk/nextjs/server";
import { createPhonePeOAuthClient } from "@/app/lib/phonepe-oauth";
import { generateOrderId } from "@/app/lib/utils";
import { z } from "zod";

// Type for stored metadata
interface OrderMetadata {
  userId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  cart: any[];
  timestamp: number;
}

// Extend global type
declare global {
  var orderMetadataCache: Map<string, OrderMetadata> | undefined;
}

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
    
    // Log authentication status for monitoring
    safeLog('info', 'Authentication check in create-order', {
      hasUserId: !!userId,
      timestamp: new Date().toISOString(),
      origin: request.headers.get('origin'),
      userAgent: request.headers.get('user-agent')?.substring(0, 50),
      hasCookie: !!request.headers.get('cookie'),
    });
    
    if (!userId) {
      safeLogError('Authentication failed in create-order', {
        headers: {
          origin: request.headers.get('origin'),
          referer: request.headers.get('referer'),
          userAgent: request.headers.get('user-agent')?.substring(0, 100),
        }
      });
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

    // 🔄 Replay Attack Protection
    const allHeaders = Object.fromEntries(request.headers.entries());
    const requestId = generateRequestId(validationResult.data, allHeaders);
    const replayCheck = protectAgainstReplay(
      requestId, 
      { merchantOrderId, amount, userId },
      Date.now()
    );

    if (!replayCheck.isValid) {
      safeLogError("Create order replay attack detected", {
        requestId,
        merchantOrderId,
        userId,
        error: replayCheck.error
      });
      return NextResponse.json(
        { success: false, error: "Duplicate order request detected" },
        { status: 409 } // Conflict status for duplicate requests
      );
    }

    safeLog("info", "Order creation request validated", {
      requestId,
      merchantOrderId,
      userId
    });

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

    // 🔑 Store order metadata temporarily (since PhonePe doesn't reliably return metaInfo)
    const orderMetadata = {
      userId: userId,
      customerInfo: customerInfo,
      cart: cart,
      timestamp: Date.now()
    };
    
    // Store in a simple in-memory cache (you might want to use Redis in production)
    global.orderMetadataCache = global.orderMetadataCache || new Map();
    global.orderMetadataCache.set(merchantOrderId, orderMetadata);
    
    // Clean up old entries (older than 30 minutes)
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    for (const [key, value] of global.orderMetadataCache.entries()) {
      if (value.timestamp < thirtyMinutesAgo) {
        global.orderMetadataCache.delete(key);
      }
    }
    
    safeLog('info', 'Stored order metadata', { 
      merchantOrderId,
      hasUserId: !!userId,
      hasCartItems: !!cart?.length,
      storedMetadataContent: orderMetadata
    });

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
        udf5: customerInfo.address, // Store address in udf5
        udf6: userId, // Store userId in udf6
        udf7: `items:${cart.length}`, // Move items count to udf7
      },
      paymentFlow: {
        type: "PG_CHECKOUT" as const,
        message: "BubbleBeads - Laundry Detergent Pods",
        merchantUrls: {
          redirectUrl: redirectUrl
        }
      }
    };

    safeLog('info', 'Sending payment request to PhonePe', {
      merchantOrderId,
      hasMetaInfo: !!paymentRequest.metaInfo,
      metaInfoContent: paymentRequest.metaInfo
    });

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