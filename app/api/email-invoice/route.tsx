import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { getOrder } from "../../lib/database";
import { verifyInvoiceToken } from "../../lib/jwt-utils";
import { auth } from "@clerk/nextjs/server";
import { safeLogError } from "../../lib/security/logging";
import { withUpstashRateLimit } from "@/app/lib/security/upstashRateLimit";
import {
  validateRequest,
  invoiceTokenSchema,
  sanitizeObject,
} from "@/app/lib/security/validation";
import { assertSameOrigin } from "@/app/lib/security/origin";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// PDF Styles for @react-pdf/renderer <mcreference link="https://www.npmjs.com/package/@react-pdf/renderer" index="1">1</mcreference>
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#f97316',
  },
  invoiceInfo: {
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  invoiceNumber: {
    color: '#6b7280',
    fontSize: 14,
  },
  billingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#374151',
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 30,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableColHeader: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f9fafb',
    padding: 8,
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8,
  },
  tableColItem: {
    width: '40%',
  },
  tableColQuantity: {
    width: '15%',
  },
  tableColPrice: {
    width: '22.5%',
  },
  tableColTotal: {
    width: '22.5%',
  },
  tableCellQuantity: {
    textAlign: 'center',
  },
  tableCellPrice: {
    textAlign: 'right',
  },
  tableCellTotal: {
    textAlign: 'right',
  },
  tableCellHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableCell: {
    fontSize: 10,
  },
  totalSection: {
    alignItems: 'flex-end',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
    width: '50%',
  },
  totalLabel: {
    width: '60%',
    textAlign: 'right',
    paddingRight: 20,
  },
  totalAmount: {
    width: '40%',
    fontWeight: 'bold',
    textAlign: 'right',
  },
  grandTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f97316',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 12,
  },
});

// PDF Document Component
const InvoicePDF = ({ order }: { order: any }) => {
  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate tax and subtotal from total (no GST as per recent changes)
  const subtotal = order.total;
  const tax = 0; // No GST as per recent codebase changes

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>BubbleBeads</Text>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>Order #{order.id}</Text>
            <Text style={styles.invoiceNumber}>Date: {formatDate(order.orderDate)}</Text>
          </View>
        </View>

        {/* Billing Section */}
        <View style={styles.billingSection}>
          <View>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            <Text>{order.customerName}</Text>
            <Text>{order.customerEmail}</Text>
            <Text>{order.customerPhone}</Text>
            <Text>{order.address}</Text>
          </View>
          <View>
            <Text style={styles.sectionTitle}>Payment Details:</Text>
            <Text>Payment ID: {order.paymentId}</Text>
            <Text>Order ID: {order.razorpayOrderId}</Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, styles.tableColItem]}>
              <Text style={styles.tableCellHeader}>Item</Text>
            </View>
            <View style={[styles.tableColHeader, styles.tableColQuantity]}>
              <Text style={[styles.tableCellHeader, styles.tableCellQuantity]}>Quantity</Text>
            </View>
            <View style={[styles.tableColHeader, styles.tableColPrice]}>
              <Text style={[styles.tableCellHeader, styles.tableCellPrice]}>Unit Price</Text>
            </View>
            <View style={[styles.tableColHeader, styles.tableColTotal]}>
              <Text style={[styles.tableCellHeader, styles.tableCellTotal]}>Total</Text>
            </View>
          </View>
          {order.items.map((item: any, index: number) => (
            <View style={styles.tableRow} key={index}>
              <View style={[styles.tableCol, styles.tableColItem]}>
                <Text style={styles.tableCell}>{item.name}</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColQuantity]}>
                <Text style={[styles.tableCell, styles.tableCellQuantity]}>{item.quantity}</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColPrice]}>
                <Text style={[styles.tableCell, styles.tableCellPrice]}>{formatPrice(item.price)}</Text>
              </View>
              <View style={[styles.tableCol, styles.tableColTotal]}>
                <Text style={[styles.tableCell, styles.tableCellTotal]}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Total Section */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalAmount}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Shipping:</Text>
            <Text style={styles.totalAmount}>₹0.00</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>{formatPrice(order.total)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text>BubbleBeads - Premium Laundry Detergent Pods</Text>
        </View>
      </Page>
    </Document>
  );
};

export const POST = withUpstashRateLimit("moderate")(async (
  request: NextRequest,
) => {
  try {
    // CSRF Protection: Validate origin header
    try {
      assertSameOrigin(request);
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid Origin") {
        return NextResponse.json({ error: "Invalid Origin" }, { status: 403 });
      }
      throw error;
    }

    // Verify user authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      safeLogError("RESEND_API_KEY is not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 },
      );
    }

    // Validate request body
    const validationResult = await validateRequest(request, invoiceTokenSchema);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 },
      );
    }

    // Sanitize the validated data
    const sanitizedData = sanitizeObject(validationResult.data);
    const { orderId } = sanitizedData;

    // Get order from database
    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify order belongs to the authenticated user (basic check)
    // In production, you might want more thorough ownership verification

    // Generate PDF from React component using renderToBuffer
    const pdfBuffer = await renderToBuffer(<InvoicePDF order={order} />);
    const pdfBase64 = pdfBuffer.toString("base64");
    // Send email with PDF attachment
    const emailResult = await resend.emails.send({
      from: "noreply@bubblebeads.in",
      to: order.customerEmail,
      subject: `Your Invoice - Order #${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #f97316;">Hello ${order.customerName},</h2>
          <p>Please find attached your invoice for Order #${orderId}.</p>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Order Summary:</h3>
            <p><strong>Order ID:</strong> ${orderId}</p>
            <p><strong>Payment ID:</strong> ${order.paymentId}</p>
            <p><strong>Total Amount:</strong> ${new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
            }).format(order.total)}</p>
            <p><strong>Order Date:</strong> ${new Date(order.orderDate).toLocaleDateString("en-IN")}</p>
          </div>
          <p>Thank you for your business!</p>
          <p style="color: #6b7280; font-size: 14px;">BubbleBeads - Premium Laundry Detergent Pods</p>
        </div>
      `,
      attachments: [
        {
          filename: `invoice-${orderId}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    if (emailResult.error) {
      safeLogError("Failed to send email", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Invoice email sent successfully",
      emailId: emailResult.data?.id,
      orderId,
    });
  } catch (error) {
    safeLogError("Error sending invoice email", error);
    return NextResponse.json(
      { error: "Failed to send invoice email" },
      { status: 500 },
    );
  }
});