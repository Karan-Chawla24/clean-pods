import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "../../../lib/database";
import { safeLogError } from "../../../lib/security/logging";
import { withUpstashRateLimit } from "../../../lib/security/upstashRateLimit";

export const GET = withUpstashRateLimit("moderate")(async (request: NextRequest) => {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const orderId = pathSegments[pathSegments.length - 1];

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

    // Transform database order to match frontend interface
    const transformedOrder = {
      id: order.id,
      merchant_order_id: order.merchantOrderId,
      order_no: order.orderNo,
      invoice_no: order.invoiceNo,
      customer_email: order.customerEmail,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      shipping_address: order.address,
      total_amount: order.total,
      status: "completed", // Default status since not in database
      payment_status: "paid", // Default payment status since not in database
      payment_id: order.transactionId || order.paymentId, // Use transactionId if available, fallback to paymentId
      created_at: order.orderDate.toISOString(),
      // Enhanced payment details
      payment_mode: order.paymentMode || null,
      payment_transaction_id: order.paymentTransactionId || null,
      utr: order.utr || null,
      bank_name: order.bankName || null,
      account_type: order.accountType || null,
      card_last_4: order.cardLast4 || null,
      payable_amount: order.payableAmount || null,
      payment_state: order.paymentState || null,
      payment_timestamp: order.paymentTimestamp?.toISOString() || null,
      items: order.items.map(item => ({
        id: item.id,
        order_id: order.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }))
    };

    return NextResponse.json(transformedOrder);
  } catch (error) {
    safeLogError("Error fetching order", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 },
    );
  }
});
