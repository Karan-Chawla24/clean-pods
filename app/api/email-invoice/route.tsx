import React from "react";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { z } from "zod";
import { getOrder } from "../../lib/database";
import { auth } from "@clerk/nextjs/server";
import { safeLogError } from "../../lib/security/logging";
import { validateRequest } from "../../lib/security/validation";
import { withUpstashRateLimit } from "@/app/lib/security/upstashRateLimit";
import { assertSameOrigin } from "@/app/lib/security/origin";

// Initialize Resend client
if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY environment variable is required");
const resend = new Resend(process.env.RESEND_API_KEY);

// PDF styles
const styles = StyleSheet.create({
  page: { flexDirection: "column", backgroundColor: "#ffffff", padding: 30, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  companyInfo: { flex: 1 },
  title: { fontSize: 12, fontWeight: "bold", color: "#333333", marginBottom: 5 },
  companyDetails: { fontSize: 10, color: "#666666", lineHeight: 1.3 },
  invoiceInfo: { flex: 1, textAlign: "right" },
  invoiceTitle: { fontSize: 20, fontWeight: "bold", color: "#333333", marginBottom: 5 },
  invoiceMeta: { fontSize: 10, color: "#666666", lineHeight: 1.4 },
  taxInfo: { backgroundColor: "#f8f9fa", padding: 12, marginBottom: 15, borderRadius: 4 },
  taxInfoTitle: { fontSize: 12, fontWeight: "bold", color: "#333333", marginBottom: 8 },
  taxDetails: { fontSize: 10, color: "#666666", lineHeight: 1.4 },
  billingSection: { flexDirection: "row", marginBottom: 20 },
  billingColumn: { flex: 1, marginRight: 20 },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", color: "#333333", marginBottom: 8 },
  sectionContent: { fontSize: 10, color: "#666666", lineHeight: 1.4 },
  table: { marginBottom: 15 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f8f9fa", paddingVertical: 8, paddingHorizontal: 6, borderWidth: 1, borderColor: "#dee2e6" },
  tableRow: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 6, borderWidth: 1, borderColor: "#dee2e6", borderTopWidth: 0 },
  tableCell: { fontSize: 10, color: "#666666" },
  tableCellHeader: { fontSize: 10, fontWeight: "bold", color: "#333333" },
  totalsSection: { marginTop: 20, paddingTop: 15, borderTop: "1px solid #e0e0e0", alignItems: "flex-end" },
  totalsTable: { width: "100%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, paddingHorizontal: 8 },
  totalLabel: { fontSize: 10, color: "#666666", textAlign: "right", flex: 3 },
  totalValue: { fontSize: 10, fontWeight: "bold", color: "#333333", textAlign: "right", flex: 2 },
  finalTotalRow: { backgroundColor: "#f8f9fa", borderTopWidth: 1, borderTopColor: "#dee2e6", paddingVertical: 5, paddingHorizontal: 8, borderTop: "1px solid #333", paddingTop: 8, marginTop: 8 },
  finalTotalLabel: { fontSize: 12, fontWeight: "bold", color: "#333", textAlign: "right", flex: 3 },
  finalTotalValue: { fontSize: 12, fontWeight: "bold", color: "#333333", textAlign: "right", flex: 2 },
  footer: { marginTop: 25, paddingTop: 15, borderTopWidth: 1, borderTopColor: "#e5e7eb", textAlign: "center" },
  footerText: { fontSize: 10, color: "#666666", marginBottom: 3 },
});

// PDF generator
function createInvoiceDocument(order: any) {
  const formatPrice = (price: number | undefined | null) => price ? price.toLocaleString("en-IN") : "0";
  
  // Extract state from address to determine GST breakdown
  const extractStateFromAddress = (address: string): string => {
    const addressLower = address.toLowerCase();
    if (addressLower.includes('punjab') || addressLower.includes('pb')) {
      return 'punjab';
    }
    return 'other';
  };

  // Calculate tax from total (total includes 18% GST)
  const calculateTaxWithGST = (total: number, customerAddress: string) => {
    const state = extractStateFromAddress(customerAddress);
    const isPunjab = state.toLowerCase() === 'punjab';
    
    // Calculate subtotal by removing GST (total includes 18% tax)
    const subtotal = total / 1.18;
    const totalTax = total - subtotal;
    
    if (isPunjab) {
      // For Punjab: Split tax into CGST and SGST (equal halves)
      const cgst = totalTax / 2;
      const sgst = totalTax / 2;
      return {
        subtotal: Math.round(subtotal * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        igst: 0,
        isPunjab: true
      };
    } else {
      // For other states: Show entire tax as IGST
      return {
        subtotal: Math.round(subtotal * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        cgst: 0,
        sgst: 0,
        igst: Math.round(totalTax * 100) / 100,
        isPunjab: false
      };
    }
  };

  // Calculate shipping based on total number of boxes (considering combo products)
  const calculateShipping = (items: any[]) => {
    const totalBoxes = items.reduce((total, item) => {
      let boxesPerItem = 1; // default for single box
      
      // Check product ID or name to determine boxes per item
      const productId = item.id || item.productId;
      const productName = item.name || item.productName || '';
      
      if (productId === 'combo-2box' || productName.includes('2 Box Combo')) {
        boxesPerItem = 2;
      } else if (productId === 'combo-3box' || productName.includes('3 Box Combo')) {
        boxesPerItem = 3;
      }
      
      return total + (boxesPerItem * (item.quantity || 1));
    }, 0);
    
    // Shipping logic: 3+ boxes = free, 2 boxes = 49, 1 box = 99
    if (totalBoxes >= 3) return 0; // Free shipping for 3+ boxes
    if (totalBoxes === 2) return 49; // ₹49 for 2 boxes
    return 99; // ₹99 for 1 box
  };
  
  const shippingCost = calculateShipping(order.items);
  
  // Calculate GST only on product amount (excluding shipping)
  const productAmount = order.total - shippingCost;
  const taxDetails = calculateTaxWithGST(productAmount, order.address);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.title}>R AND D ESSENTIALS TRADING CO</Text>
            <Text style={styles.companyDetails}>
              Premium Laundry Detergent Pods{"\n"}
              02830-004, Shakti Vihar, St No 4, Phase 4{"\n"}
              Bathinda, Punjab 151001{"\n"}
              Phone: +91 6239881097{"\n"}
              Email: customercare.bb@outlook.com
            </Text>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceMeta}>
              Invoice #: W-{order.id.slice(-8)}{"\n"}
              Order #: {order.id}{"\n"}
              Date: {new Date(order.orderDate).toLocaleDateString("en-IN")}
            </Text>
          </View>
        </View>

        {/* Tax Information */}
        <View style={styles.taxInfo}>
          <Text style={styles.taxInfoTitle}>Tax Information</Text>
          <Text style={styles.taxDetails}>
            GST Number: 03ABLFR9622B1ZC{"\n"}
            PAN Number: ABLFR9622B{"\n"}
            Tax Rate: 18% GST {taxDetails.isPunjab ? '(CGST 9% + SGST 9%)' : '(IGST 18%)'}
          </Text>
        </View>

        {/* Billing Section */}
        <View style={styles.billingSection}>
          <View style={styles.billingColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bill To:</Text>
              <Text style={styles.sectionContent}>
                {order.customerName}{"\n"}
                {order.customerEmail}{"\n"}
                {order.customerPhone}{"\n"}
                {order.address || order.shippingAddress}
              </Text>
            </View>
          </View>
          <View style={styles.billingColumn}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Details:</Text>
              <Text style={styles.sectionContent}>
                Payment Method: Online Payment{"\n"}
                Payment Status: Completed{"\n"}
                Transaction ID: {order.paymentId}
              </Text>
            </View>
          </View>
        </View>

        {/* Order items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, { flex: 3 }]}>Item Description</Text>
            <Text style={[styles.tableCellHeader, { flex: 1, textAlign: "center" }]}>Quantity</Text>
            <Text style={[styles.tableCellHeader, { flex: 2, textAlign: "right" }]}>Unit Price</Text>
            <Text style={[styles.tableCellHeader, { flex: 2, textAlign: "right" }]}>Total Amount</Text>
          </View>
          {order.items.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>{item.name || item.productName || "Essential Clean Pod"}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: "center" }]}>{item.quantity || 1}</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: "right" }]}>{formatPrice(item.price)}</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: "right" }]}>{formatPrice((item.price || 0) * (item.quantity || 1))}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal (Before Tax):</Text>
              <Text style={styles.totalValue}>{formatPrice(taxDetails.subtotal)}</Text>
            </View>
            {taxDetails.isPunjab ? (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>CGST (9%):</Text>
                  <Text style={styles.totalValue}>{formatPrice(taxDetails.cgst)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>SGST (9%):</Text>
                  <Text style={styles.totalValue}>{formatPrice(taxDetails.sgst)}</Text>
                </View>
              </>
            ) : (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>IGST (18%):</Text>
                <Text style={styles.totalValue}>{formatPrice(taxDetails.igst)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Tax (18% GST):</Text>
              <Text style={styles.totalValue}>{formatPrice(taxDetails.totalTax)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping & Handling:</Text>
              <Text style={styles.totalValue}>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</Text>
            </View>
            <View style={[styles.totalRow, styles.finalTotalRow]}>
              <Text style={styles.finalTotalLabel}>Total Amount:</Text>
              <Text style={styles.finalTotalValue}>{formatPrice(order.total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business!</Text>
          <Text style={styles.footerText}>R AND D ESSENTIALS TRADING CO- Premium Laundry Detergent Pods</Text>
        </View>
      </Page>
    </Document>
  );
}

// Main API handler with all security layers
export const POST = withUpstashRateLimit("moderate")(async (request: NextRequest) => {
  try {
    // CSRF: Assert same origin
    assertSameOrigin(request);

    // Auth
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

    // Validate request data - only orderId is needed from client
  const simpleOrderSchema = z.object({
    orderId: z.string().min(1, "Order ID is required")
  });
  
  const validation = await validateRequest(request, simpleOrderSchema);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid request data" },
      { status: 400 },
    );
  }

  const { orderId } = validation.data;

    // Get order
    const order = await getOrder(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Generate PDF
    const pdfInstance = pdf(createInvoiceDocument(order));
    const pdfStream = await pdfInstance.toBuffer();
    
    // Convert Node.js ReadableStream to buffer
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: any[] = [];
      pdfStream.on('data', (chunk: any) => chunks.push(chunk));
      pdfStream.on('end', () => resolve(Buffer.concat(chunks)));
      pdfStream.on('error', reject);
    });
    
    const pdfBase64 = pdfBuffer.toString("base64");

    // Send email
    const emailResult = await resend.emails.send({
      from: "noreply@bubblebeads.in",
      to: order.customerEmail,
      subject: `Your Invoice - Order #${orderId}`,
      html: `<div>Hello ${order.customerName}, please find attached your invoice for Order #${orderId}.</div>`,
      attachments: [{ filename: `invoice-${orderId}.pdf`, content: pdfBase64 }],
    });

    return NextResponse.json({ success: true, message: "Invoice email sent", orderId, emailId: emailResult.data?.id });
  } catch (error) {
    safeLogError("Error sending invoice", error);
    return NextResponse.json({ error: "Failed to send invoice" }, { status: 500 });
  }
});
