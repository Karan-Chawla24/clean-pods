// import { NextRequest, NextResponse } from 'next/server';
// import Razorpay from 'razorpay';
// import { withUpstashRateLimit } from '@/app/lib/security/upstashRateLimit';
// import { validateRequest, createOrderSchema } from '@/app/lib/security/validation';
// import { validateCartAndTotal } from '@/app/lib/security/cartValidation';
// import { assertSameOrigin } from '@/app/lib/security/origin';
// import { safeLogError } from '@/app/lib/security/logging';

// // Check if environment variables are set
// const keyId = process.env.RAZORPAY_KEY_ID;
// const keySecret = process.env.RAZORPAY_KEY_SECRET;

// if (!keyId || !keySecret) {
//   // Environment variables not configured
// }

// const razorpay = new Razorpay({
//   key_id: keyId || 'rzp_test_placeholder',
//   key_secret: keySecret || 'placeholder_secret',
// });

// export const POST = withUpstashRateLimit('moderate')(async (request: NextRequest) => {
//   try {
//     // CSRF Protection: Validate origin header
//     try {
//       assertSameOrigin(request);
//     } catch (error) {
//       if (error instanceof Error && error.message === 'Invalid Origin') {
//         return NextResponse.json(
//           { error: 'Invalid Origin' },
//           { status: 403 }
//         );
//       }
//       throw error;
//     }

//     // Check if environment variables are set
//     if (!keyId || !keySecret) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: 'Razorpay configuration not found. Please check your environment variables.'
//         },
//         { status: 500 }
//       );
//     }

//     // Get request body
//     const body = await request.json();

//     // Validate request body with Zod schema
//     const validationResult = createOrderSchema.safeParse(body);
//     if (!validationResult.success) {
// -      console.log('Validation failed:', validationResult.error.issues);
//       const errorDetails = validationResult.error.issues.map(issue =>
//         `${issue.path.join('.')}: ${issue.message}`
//       ).join(', ');
//       return NextResponse.json(
//         { success: false, error: `Validation failed: ${errorDetails}` },
//         { status: 400 }
//       );
//     }

//     // Validation successful

//     const { amount, currency, receipt, cart } = validationResult.data;

//     // Validate cart items against server-side prices using utility function
//     const cartValidation = await validateCartAndTotal(cart, amount);

//     if (!cartValidation.isValid) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: `Cart validation failed: ${cartValidation.errors.join(', ')}`
//         },
//         { status: 400 }
//       );
//     }

//     if (!cartValidation.totalMatches) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: `Total amount mismatch. Expected: ${cartValidation.calculatedTotalWithTax} (including 18% GST), Received: ${amount}`
//         },
//         { status: 400 }
//       );
//     }

//     const options = {
//       amount: Math.round(cartValidation.calculatedTotalWithTax * 100), // Use server-calculated total with tax in paise
//       currency: currency || 'INR',
//       receipt,
//       notes: {
//         cart_items: JSON.stringify(cartValidation.validatedItems)
//       }
//     };

//     const order = await razorpay.orders.create(options);

//     return NextResponse.json({
//       success: true,
//       key: keyId,
//       order: {
//         id: order.id,
//         amount: order.amount,
//         currency: order.currency,
//       },
//     });
//   } catch (error) {
//     return NextResponse.json(
//       {
//         success: false,
//         error: 'Failed to create order',
//         details: error instanceof Error ? error.message : 'Unknown error'
//       },
//       { status: 500 }
//     );
//   }
// });

// app/api/create-order/route.ts

import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { withUpstashRateLimit } from "@/app/lib/security/upstashRateLimit";
import { createOrderSchema } from "@/app/lib/security/validation";
import { validateCartAndTotal } from "@/app/lib/security/cartValidation";
import { assertSameOrigin } from "@/app/lib/security/origin";
import { safeLogError } from "@/app/lib/security/logging";
import { auth } from "@clerk/nextjs/server";

// --- Razorpay Config ---
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.warn(
    "[CreateOrder] Razorpay keys are not configured. Using placeholder values.",
  );
}

const razorpay = new Razorpay({
  key_id: keyId || "rzp_test_placeholder",
  key_secret: keySecret || "placeholder_secret",
});

// --- Handler ---
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
      throw error; // rethrow unexpected errors
    }

    // 🔑 Check Razorpay config
    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Razorpay configuration not found. Please check your environment variables.",
        },
        { status: 500 },
      );
    }

    // 📥 Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const validationResult = createOrderSchema.safeParse(body);
    if (!validationResult.success) {
      const errorDetails = validationResult.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");

      return NextResponse.json(
        { success: false, error: `Validation failed: ${errorDetails}` },
        { status: 400 },
      );
    }

    const { amount, currency, receipt, cart } = validationResult.data;

    // 🛒 Validate cart
    const cartValidation = await validateCartAndTotal(cart, amount);

    if (!cartValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: `Cart validation failed: ${cartValidation.errors.join(", ")}`,
        },
        { status: 400 },
      );
    }

    if (!cartValidation.totalMatches) {
      return NextResponse.json(
        {
          success: false,
          error: `Total amount mismatch. Expected: ${cartValidation.calculatedTotalWithTax} (including 18% GST), Received: ${amount}`,
        },
        { status: 400 },
      );
    }

    // 🏦 Create Razorpay Order
    const options = {
      amount: Math.round(cartValidation.calculatedTotalWithTax * 100), // amount in paise
      currency: currency || "INR",
      receipt,
      notes: {
        cart_items: JSON.stringify(cartValidation.validatedItems),
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      key: keyId, // only keyId is exposed to client
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    // 🔴 Catch unexpected errors
    safeLogError("Failed to create Razorpay order", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
});
