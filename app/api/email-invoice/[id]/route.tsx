import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "../../../lib/database";
import { verifyInvoiceToken } from "../../../lib/jwt-utils";
import { auth } from "@clerk/nextjs/server";
import { safeLogError } from "../../../lib/security/logging";
import { Resend } from "resend";
import { Document, Page, Text, View, StyleSheet, pdf, Font } from "@react-pdf/renderer";

// Initialize Resend client
if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY environment variable is required");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { token } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    // Verify user authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Validate JWT token
    if (!token) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 },
      );
    }

    let tokenPayload;
    try {
      tokenPayload = await verifyInvoiceToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired access token" },
        { status: 403 },
      );
    }

    // Verify token matches the requested order
    if (tokenPayload.orderId !== orderId) {
      return NextResponse.json(
        { error: "Token does not match the requested order" },
        { status: 403 },
      );
    }

    // Additional security: verify user ID if present in token
    if (tokenPayload.userId && tokenPayload.userId !== userId) {
      return NextResponse.json(
        { error: "Access denied. Token belongs to different user." },
        { status: 403 },
      );
    }

    // Get order from database
    const order = await getOrder(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Generate PDF invoice using @react-pdf/renderer

    // Generate PDF using @react-pdf/renderer (serverless-compatible)
    let pdfBuffer;
    
    try {
      const invoiceDocument = createInvoiceDocument(order);
      const pdfUint8Array = await pdf(invoiceDocument).toBuffer();
      pdfBuffer = Buffer.from(pdfUint8Array);
    } catch (pdfError) {
      safeLogError("PDF generation failed", pdfError);
      throw new Error(`PDF generation failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
    }

    // Send email with PDF attachment
    let emailResult;
    try {
      emailResult = await resend.emails.send({
        from: "noreply@bubblebeads.in",
        to: [order.customerEmail],
        subject: `Your Invoice - Order #${order.id}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f97316; margin: 0;">BubbleBeads</h1>
              <p style="color: #6b7280; margin: 5px 0;">Premium Laundry Detergent Pods</p>
            </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #374151; margin-top: 0;">Hello ${order.customerName},</h2>
            <p style="color: #6b7280; line-height: 1.6;">Thank you for your order! Please find attached your invoice for Order #${order.id}.</p>
          </div>
          
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #374151; margin-top: 0;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Order Number:</td>
                <td style="padding: 8px 0; font-weight: 600; text-align: right;">#${order.id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Order Date:</td>
                <td style="padding: 8px 0; font-weight: 600; text-align: right;">${new Date(order.orderDate).toLocaleDateString("en-IN")}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Total Amount:</td>
                <td style="padding: 8px 0; font-weight: 600; text-align: right; color: #f97316;">₹${order.total}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>📧 Digital Invoice:</strong> This is a computer-generated invoice and does not require any signature or stamp.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">If you have any questions about your order, please contact our support team.</p>
            <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Thank you for choosing BubbleBeads!</p>
          </div>
        </div>
      `,
        attachments: [
          {
            filename: `invoice-${order.id}.pdf`,
            content: pdfBuffer,
          },
        ],
      });
    } catch (emailError) {
      safeLogError("Email sending failed", emailError);
      throw new Error(`Email sending failed: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`);
    }

    return NextResponse.json({
      success: true,
      message: "Invoice email sent successfully",
      emailId: emailResult.data?.id,
    });
  } catch (error) {
    safeLogError("Error sending invoice email", error);
    return NextResponse.json(
      { error: "Failed to send invoice email" },
      { status: 500 },
    );
  }
}

// PDF styles for @react-pdf/renderer
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
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f97316',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f97316',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'right',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCell: {
    fontSize: 12,
    color: '#374151',
  },
  tableCellHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f97316',
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 5,
  },
});

function createInvoiceDocument(order: any) {
  const formatPrice = (price: number) => {
    return `₹${price.toLocaleString('en-IN')}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>BubbleBeads</Text>
            <Text style={styles.subtitle}>Premium Laundry Detergent Pods</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
          </View>
        </View>

        {/* Invoice Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Invoice Number:</Text>
            <Text style={styles.value}>#{order.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Invoice Date:</Text>
            <Text style={styles.value}>{new Date(order.orderDate).toLocaleDateString('en-IN')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Order Status:</Text>
            <Text style={styles.value}>{order.status}</Text>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{order.customerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{order.customerEmail}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{order.customerPhone}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{order.shippingAddress}</Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.table}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, { flex: 3 }]}>Product</Text>
            <Text style={[styles.tableCellHeader, { flex: 1, textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.tableCellHeader, { flex: 2, textAlign: 'right' }]}>Price</Text>
            <Text style={[styles.tableCellHeader, { flex: 2, textAlign: 'right' }]}>Total</Text>
          </View>
          {order.items.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>{item.productName}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>{formatPrice(item.price)}</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: 'right' }]}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.label}>Subtotal:</Text>
            <Text style={styles.value}>{formatPrice(order.cartTotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.label}>Shipping:</Text>
            <Text style={styles.value}>{formatPrice(order.shipping)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>This is a computer-generated invoice and does not require any signature or stamp.</Text>
          <Text style={styles.footerText}>Thank you for choosing BubbleBeads!</Text>
          <Text style={styles.footerText}>For any queries, please contact our support team.</Text>
        </View>
      </Page>
    </Document>
  );
}

// Removed generateEnhancedInvoiceHtml function - now using @react-pdf/renderer