import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { withUpstashRateLimit } from "@/app/lib/security/upstashRateLimit";
import { requireClerkAdminAuth } from "@/app/lib/clerk-admin";

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

    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { orderDate: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Orders");
    worksheet.columns = [
      { header: "Razorpay Order ID", key: "razorpayOrderId", width: 25 },
      { header: "Payment ID", key: "paymentId", width: 20 },
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
        razorpayOrderId: order.razorpayOrderId,
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
    console.error("Excel generation error:", error);
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
