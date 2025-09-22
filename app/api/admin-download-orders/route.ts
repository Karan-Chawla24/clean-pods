import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import prismaVercel from "../../lib/prisma-vercel";

// Use Vercel-optimized Prisma client in production
const db = process.env.VERCEL ? prismaVercel : prisma;
import { withUpstashRateLimit } from "@/app/lib/security/upstashRateLimit";
import { requireClerkAdminAuth } from "@/app/lib/clerk-admin";
import { safeLogError } from "@/app/lib/security/logging";

// Dynamic import for ExcelJS to avoid build issues
let ExcelJS: any;

export const GET = withUpstashRateLimit("moderate")(async (
  request: NextRequest,
) => {
  try {
    // Verify Clerk authentication
    const authResult = await requireClerkAdminAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Dynamic import to avoid build issues
    if (!ExcelJS) {
      ExcelJS = (await import("exceljs")).default;
    }

    const orders = await db.order.findMany({
      include: { items: true },
      orderBy: { orderDate: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Orders");
      worksheet.columns = [
        { header: "Merchant Order ID", key: "merchantOrderId", width: 25 },
        { header: "PhonePe Order ID", key: "phonePeOrderId", width: 25 },
        { header: "Transaction ID", key: "paymentId", width: 20 },
        { header: "Customer Name", key: "customerName", width: 25 },
      { header: "Customer Email", key: "customerEmail", width: 30 },
      { header: "Customer Phone", key: "customerPhone", width: 18 },
      { header: "Address", key: "address", width: 40 },
      { header: "Order Items", key: "items", width: 40 },
      { header: "Total", key: "total", width: 12 },
      { header: "Order Date", key: "orderDate", width: 22 },
    ];

    for (const order of orders) {
      const itemsString = order.items
        .map((item: any) => `${item.name} (x${item.quantity}) - ₹${item.price}`)
        .join("; ");
      worksheet.addRow({
          merchantOrderId: order.merchantOrderId,
          phonePeOrderId: order.phonePeOrderId,
          paymentId: order.paymentId,
          customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        address: order.address,
        items: itemsString,
        total: order.total,
        orderDate: order.orderDate.toLocaleString("en-IN"),
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="orders.xlsx"',
      },
    });
  } catch (error) {
    safeLogError("Excel generation error", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate Excel",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
});
