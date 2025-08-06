import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../lib/prisma';
import ExcelJS from 'exceljs';

export async function GET(request: NextRequest) {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { orderDate: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Orders');
    worksheet.columns = [
      { header: 'Order ID', key: 'orderId', width: 20 },
      { header: 'Payment ID', key: 'paymentId', width: 20 },
      { header: 'Customer Name', key: 'customerName', width: 25 },
      { header: 'Customer Email', key: 'customerEmail', width: 30 },
      { header: 'Customer Phone', key: 'customerPhone', width: 18 },
      { header: 'Address', key: 'address', width: 40 },
      { header: 'Order Items', key: 'items', width: 40 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Order Date', key: 'orderDate', width: 22 },
    ];

    for (const order of orders) {
      const itemsString = order.items.map(item => `${item.name} (x${item.quantity}) - ₹${item.price}`).join('; ');
      worksheet.addRow({
        orderId: order.id,
        paymentId: order.paymentId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        address: order.address,
        items: itemsString,
        total: order.total,
        orderDate: order.orderDate.toLocaleString('en-IN'),
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="orders.xlsx"',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to generate Excel', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}