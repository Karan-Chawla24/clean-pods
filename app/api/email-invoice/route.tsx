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
  page: { flexDirection: "column", backgroundColor: "#ffffff", padding: 30 },
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

// Type definitions for invoice items
interface CartItem {
  id?: string;
  productId?: string;
  name?: string;
  productName?: string;
  quantity?: number;
  price?: number;
}

interface InvoiceItem extends CartItem {
  mrp: number;
  unitPriceExGST: number;
  discountPerUnit: number;
  netAmountPerUnit: number;
  totalUnitPrice: number;
  totalDiscount: number;
  totalNetAmount: number;
  quantity: number;
}

interface PricingInfo {
  itemsBreakdown: InvoiceItem[];
  totalNetAmount: number;
  totalTax: number;
  cgst: number;
  sgst: number;
  igst: number;
  isPunjab: boolean;
}

// PDF generator
function createInvoiceDocument(order: any) {
  const formatPrice = (price: number | undefined | null) => {
    if (!price && price !== 0) return "Rs. 0.00";
    return `Rs. ${price.toFixed(2)}`;
  };
  
  // Extract state from address to determine GST breakdown
  const extractStateFromAddress = (address: string): string => {
    const addressLower = address.toLowerCase();
    if (addressLower.includes('punjab') || addressLower.includes('pb')) {
      return 'punjab';
    }
    return 'other';
  };

  // Industry-standard pricing calculation
  const calculateIndustryStandardPricing = (items: CartItem[], customerAddress: string): PricingInfo => {
    const state = extractStateFromAddress(customerAddress);
    const isPunjab = state.toLowerCase() === 'punjab';
    
    // Product pricing configuration
    const getProductMRP = (item: CartItem): number => {
      const productId = item.id || item.productId;
      const productName = item.name || item.productName || '';
      
      // Set MRP based on product type
      if (productId === 'combo-2box' || productName.includes('2 Box Combo')) {
        return 1500; // MRP for 2-box combo
      } else if (productId === 'combo-3box' || productName.includes('3 Box Combo')) {
        return 2250; // MRP for 3-box combo
      } else {
        return 750; // MRP for single box
      }
    };

    const itemsBreakdown: InvoiceItem[] = [];
    let subtotalNetAmount = 0;

    items.forEach((item) => {
      const quantity = item.quantity || 1;
      const mrp = getProductMRP(item);
      
      // Calculate unit price (MRP / 1.18 to remove GST)
      const unitPriceExGST = mrp / 1.18;
      
      // Calculate discount (40% of unit price ex-GST)
      const discountPerUnit = unitPriceExGST * 0.40;
      
      // Calculate net amount per unit (unit price - discount)
      const netAmountPerUnit = unitPriceExGST - discountPerUnit;
      
      // Calculate totals for this item
      const totalUnitPrice = unitPriceExGST * quantity;
      const totalDiscount = discountPerUnit * quantity;
      const totalNetAmount = netAmountPerUnit * quantity;
      
      itemsBreakdown.push({
        ...item,
        mrp,
        unitPriceExGST: Math.round(unitPriceExGST * 100) / 100,
        discountPerUnit: Math.round(discountPerUnit * 100) / 100,
        netAmountPerUnit: Math.round(netAmountPerUnit * 100) / 100,
        totalUnitPrice: Math.round(totalUnitPrice * 100) / 100,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        totalNetAmount: Math.round(totalNetAmount * 100) / 100,
        quantity
      });
      
      subtotalNetAmount += Math.round(netAmountPerUnit * quantity * 100) / 100;
    });

    // Calculate tax (18% of net amount)
    const totalTax = subtotalNetAmount * 0.18;
    
    const taxBreakdown = isPunjab ? {
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      igst: 0,
      isPunjab: true
    } : {
      cgst: 0,
      sgst: 0,
      igst: totalTax,
      isPunjab: false
    };

    return {
      itemsBreakdown,
      totalNetAmount: Math.round(subtotalNetAmount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      ...taxBreakdown,
      cgst: Math.round(taxBreakdown.cgst * 100) / 100,
      sgst: Math.round(taxBreakdown.sgst * 100) / 100,
      igst: Math.round(taxBreakdown.igst * 100) / 100
    };
  };

  // Calculate shipping based on total number of boxes (considering combo products)
  const calculateShipping = (items: CartItem[]): number => {
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
    
    // Shipping logic: 3+ boxes = free, 2 boxes = 50, 1 box = 100
    if (totalBoxes >= 3) return 0; // Free shipping for 3+ boxes
    if (totalBoxes === 2) return 50; // Rs. 50 for 2 boxes
    return 100; // Rs. 100 for 1 box
  };
  
  // Parse cart items - use the actual order data
  let cartItems: CartItem[] = [];
  
  // First try to parse cartItems JSON
  if (order.cartItems) {
    try {
      cartItems = JSON.parse(order.cartItems);
    } catch (e) {
      // Failed to parse cartItems JSON
    }
  }
  
  // If cartItems is empty, try order.items
  if (!cartItems || cartItems.length === 0) {
    if (order.items && Array.isArray(order.items)) {
      cartItems = order.items;
    }
  }
  
  // If still no cart items, use the product name from the order
  if (!cartItems || cartItems.length === 0) {
    if (order.productName) {
      cartItems = [{
        id: order.productName.toLowerCase().replace(/\s+/g, '-'),
        name: order.productName,
        productName: order.productName,
        quantity: 1
      }];
    } else {
      // This should not happen in normal flow
      throw new Error('Unable to determine order items for invoice generation');
    }
  }
  
  const pricingInfo = calculateIndustryStandardPricing(cartItems, order.address || order.shippingAddress);
  const shippingCost = calculateShipping(cartItems);
  
  // Calculate final total
  const finalTotal = pricingInfo.totalNetAmount + pricingInfo.totalTax + shippingCost;

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
              Invoice #: {order.invoiceNo || `W-${order.id.slice(-8)}`}{"\n"}
              Order #: {order.orderNo || order.merchantOrderId || order.id}{"\n"}
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
            Tax Rate: 18% GST {pricingInfo.isPunjab ? '(CGST 9% + SGST 9%)' : '(IGST 18%)'}
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
            <Text style={[styles.tableCellHeader, { flex: 1, textAlign: "center" }]}>Qty</Text>
            <Text style={[styles.tableCellHeader, { flex: 2, textAlign: "right" }]}>Unit Price</Text>
            <Text style={[styles.tableCellHeader, { flex: 2, textAlign: "right" }]}>Discount</Text>
            <Text style={[styles.tableCellHeader, { flex: 2, textAlign: "right" }]}>Net Amount</Text>
          </View>
          {pricingInfo.itemsBreakdown.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>{item.name || item.productName || "5-in-1 Laundry Pod"}</Text>
              <Text style={[styles.tableCell, { flex: 1, textAlign: "center" }]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: "right" }]}>{formatPrice(item.totalUnitPrice)}</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: "right" }]}>{formatPrice(item.totalDiscount)}</Text>
              <Text style={[styles.tableCell, { flex: 2, textAlign: "right" }]}>{formatPrice(item.totalNetAmount)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Net Amount (After Discount):</Text>
              <Text style={styles.totalValue}>{formatPrice(pricingInfo.totalNetAmount)}</Text>
            </View>
            {pricingInfo.isPunjab ? (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>CGST (9%):</Text>
                  <Text style={styles.totalValue}>{formatPrice(pricingInfo.cgst)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>SGST (9%):</Text>
                  <Text style={styles.totalValue}>{formatPrice(pricingInfo.sgst)}</Text>
                </View>
              </>
            ) : (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>IGST (18%):</Text>
                <Text style={styles.totalValue}>{formatPrice(pricingInfo.igst)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Tax (18% GST):</Text>
              <Text style={styles.totalValue}>{formatPrice(pricingInfo.totalTax)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping & Handling:</Text>
              <Text style={styles.totalValue}>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</Text>
            </View>
            <View style={[styles.totalRow, styles.finalTotalRow]}>
              <Text style={styles.finalTotalLabel}>Total Amount:</Text>
              <Text style={styles.finalTotalValue}>{formatPrice(finalTotal)}</Text>
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
