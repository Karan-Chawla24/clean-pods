import { NextRequest, NextResponse } from "next/server";
import { getAllOrders, saveOrder } from "../../lib/database";
import { headers } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { safeLogError } from "@/app/lib/security/logging";
import {
  validateRequest,
  createOrderSchema,
  sanitizeObject,
} from "@/app/lib/security/validation";
import { withUpstashRateLimit } from "../../lib/security/upstashRateLimit";

export const GET = withUpstashRateLimit("moderate")(async () => {
  // This endpoint is now secured - only admin should access
  const headersList = await headers();
  const adminHeader = headersList.get("X-Admin-Key");

  if (adminHeader !== process.env.ADMIN_ORDERS_KEY) {
    return NextResponse.json(
      { error: "Access denied. This endpoint requires admin authentication." },
      { status: 403 },
    );
  }

  try {
    const orders = await getAllOrders();
    return NextResponse.json(orders);
  } catch (error) {
    safeLogError("GET /api/orders error", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
});

export const POST = withUpstashRateLimit("moderate")(async (request: NextRequest) => {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    // ...existing code ...
    // Received order request

    // Prepare order data for saving
      const orderData: any = {
        merchantOrderId: data.merchantOrderId,
        phonePeOrderId: data.phonePeOrderId,
        paymentId: data.paymentId,
        items: data.items,
      total: data.total,
      userId: userId, // Associate with authenticated user
    };

    // Handle both legacy format (with customer object) and new format (with direct fields)
    if (data.customer) {
      // Legacy format with customer object
      orderData.customer = data.customer;
    } else {
      // New format with direct fields
      orderData.customerName = data.customerName;
      orderData.customerEmail = data.customerEmail;
      orderData.customerPhone = data.customerPhone;
      orderData.address = data.address;
    }

    // Validate required fields
    if (!orderData.paymentId || !orderData.items || !orderData.total) {
      safeLogError("Missing required fields", {
        hasPaymentId: !!orderData.paymentId,
        hasItems: !!orderData.items,
        hasTotal: !!orderData.total,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Customer information validation
    if (!orderData.customer && !orderData.customerName) {
      safeLogError("Missing customer information");
      return NextResponse.json(
        { error: "Missing customer information" },
        { status: 400 },
      );
    }

    const orderId = await saveOrder(orderData);
    // Order created successfully

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    safeLogError("POST /api/orders error", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
});
