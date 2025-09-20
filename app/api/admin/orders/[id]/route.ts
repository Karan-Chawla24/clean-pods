import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "../../../../lib/database";
import { requireClerkAdminAuth } from "../../../../lib/clerk-admin";
import { safeLogError } from "../../../../lib/security/logging";
import { withUpstashRateLimit } from "../../../../lib/security/upstashRateLimit";

export const GET = withUpstashRateLimit("moderate")(async (request: NextRequest) => {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const orderId = pathSegments[pathSegments.length - 1];
  try {
    // Check admin authorization using Clerk
    const authResult = await requireClerkAdminAuth(request);

    if (authResult instanceof NextResponse) {
      // Authentication failed, return the error response
      return authResult;
    }

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    const order = await getOrder(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Return full order details for admin (no masking)
    return NextResponse.json({
        id: order.id,
        merchantOrderId: order.merchantOrderId,
        phonePeOrderId: order.phonePeOrderId,
        paymentId: order.paymentId,
        customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      address: order.address,
      total: order.total,
      orderDate: order.orderDate,
      items: order.items,
    });
  } catch (error) {
    safeLogError("Admin order fetch error", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 },
    );
  }
});
