import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { withUpstashRateLimit } from "@/app/lib/security/upstashRateLimit";
import { safeLogError } from "@/app/lib/security/logging";

const prisma = new PrismaClient();

export const GET = withUpstashRateLimit("moderate")(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const merchantOrderId = searchParams.get('merchantOrderId') || 'CP5NJUUVMFB';

    // Find the order in the database
    const order = await prisma.order.findFirst({
      where: {
        merchantOrderId: merchantOrderId
      },
      orderBy: {
        orderDate: 'desc'
      }
    });

    if (!order) {
      return NextResponse.json({
        error: "Order not found",
        merchantOrderId
      }, { status: 404 });
    }

    // Return the order details to see what fields were extracted
    return NextResponse.json({
      merchantOrderId,
      order: {
        id: order.id,
        paymentState: order.paymentState,
        paymentMode: order.paymentMode,
        paymentTransactionId: order.paymentTransactionId,
        utr: order.utr,
        bankName: order.bankName,
        accountType: order.accountType,
        cardLast4: order.cardLast4,
        payableAmount: order.payableAmount,
        paymentTimestamp: order.paymentTimestamp,
        total: order.total,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        orderDate: order.orderDate
      }
    });

  } catch (error) {
    safeLogError("Error checking order", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
});