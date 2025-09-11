import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "../../../lib/database";
import { verifyInvoiceToken } from "../../../lib/jwt-utils";
import { auth } from "@clerk/nextjs/server";
import { safeLogError } from "../../../lib/security/logging";
import { Resend } from "resend";
import puppeteer from "puppeteer";

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

    // Generate enhanced invoice HTML
    const invoiceHtml = generateEnhancedInvoiceHtml(order);

    // Convert HTML to PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(invoiceHtml, { waitUntil: 'networkidle0' });
    
    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px',
      },
    });
    
    const pdfBuffer = Buffer.from(pdfUint8Array);
    
    await browser.close();

    // Send email with PDF attachment
    const emailResult = await resend.emails.send({
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

function generateEnhancedInvoiceHtml(order: any): string {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate tax and subtotal from total (18% GST)
  const calculateTax = (total: number) => {
    const subtotal = total / 1.18;
    const tax = total - subtotal;
    return { subtotal: Math.round(subtotal), tax: Math.round(tax) };
  };

  const { subtotal, tax } = calculateTax(order.total);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - ${order.id}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                background: white;
                padding: 20px;
            }
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border: 1px solid #e5e7eb;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e5e7eb;
            }
            .company-info {
                flex: 1;
            }
            .logo {
                font-size: 32px;
                font-weight: bold;
                color: #f97316;
                margin-bottom: 10px;
            }
            .company-details {
                font-size: 14px;
                color: #6b7280;
                line-height: 1.5;
            }
            .invoice-info {
                text-align: right;
                flex: 1;
            }
            .invoice-title {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 8px;
                color: #374151;
            }
            .invoice-number {
                color: #6b7280;
                font-size: 14px;
                margin-bottom: 4px;
            }
            .billing-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-bottom: 40px;
            }
            .section-title {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 12px;
                color: #374151;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 4px;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
                border: 1px solid #e5e7eb;
            }
            .items-table th,
            .items-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #e5e7eb;
            }
            .items-table th {
                background-color: #f9fafb;
                font-weight: 600;
                color: #374151;
            }
            .items-table .text-right {
                text-align: right;
            }
            .total-section {
                text-align: right;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 2px solid #e5e7eb;
            }
            .total-row {
                display: flex;
                justify-content: flex-end;
                margin-bottom: 8px;
            }
            .total-label {
                margin-right: 40px;
                min-width: 120px;
                color: #6b7280;
            }
            .total-amount {
                font-weight: 600;
                min-width: 120px;
            }
            .grand-total {
                font-size: 18px;
                font-weight: bold;
                color: #f97316;
                padding-top: 12px;
                border-top: 1px solid #e5e7eb;
                margin-top: 8px;
            }
            .tax-info {
                background: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                font-size: 14px;
            }
            .disclaimer {
                background: #f0f9ff;
                border: 1px solid #0ea5e9;
                border-radius: 6px;
                padding: 15px;
                margin: 30px 0;
                text-align: center;
                font-size: 14px;
                color: #0c4a6e;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
            }
            .gst-section {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
            }
            .gst-title {
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <div class="header">
                <div class="company-info">
                    <div class="logo">BubbleBeads</div>
                    <div class="company-details">
                        Premium Laundry Detergent Pods<br>
                        123 Business Street<br>
                        Mumbai, Maharashtra 400001<br>
                        Phone: +91 98765 43210<br>
                        Email: support@bubblebeads.com
                    </div>
                </div>
                <div class="invoice-info">
                    <div class="invoice-title">INVOICE</div>
                    <div class="invoice-number">Invoice #: INV-${order.id}</div>
                    <div class="invoice-number">Order #: ${order.id}</div>
                    <div class="invoice-number">Date: ${formatDate(order.orderDate)}</div>
                    <div class="invoice-number">Payment ID: ${order.paymentId}</div>
                </div>
            </div>

            <div class="gst-section">
                <div class="gst-title">Tax Information</div>
                <div style="font-size: 14px; color: #6b7280;">
                    <strong>GST Number:</strong> 27AABCU9603R1ZX<br>
                    <strong>PAN Number:</strong> AABCU9603R<br>
                    <strong>Tax Rate:</strong> 18% GST (CGST 9% + SGST 9%)
                </div>
            </div>

            <div class="billing-section">
                <div>
                    <div class="section-title">Bill To:</div>
                    <div>
                        <strong>${order.customerName}</strong><br>
                        ${order.customerEmail}<br>
                        ${order.customerPhone}<br>
                        ${order.address}
                    </div>
                </div>
                <div>
                    <div class="section-title">Payment Details:</div>
                    <div>
                        <strong>Payment Method:</strong> Online Payment<br>
                        <strong>Payment Status:</strong> Completed<br>
                        <strong>Transaction ID:</strong> ${order.paymentId}<br>
                        <strong>Razorpay Order ID:</strong> ${order.razorpayOrderId}
                    </div>
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item Description</th>
                        <th class="text-right">Quantity</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items
                      .map(
                        (item: any) => `
                        <tr>
                            <td>${item.name}</td>
                            <td class="text-right">${item.quantity}</td>
                            <td class="text-right">${formatPrice(item.price)}</td>
                            <td class="text-right">${formatPrice(item.price * item.quantity)}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>

            <div class="total-section">
                <div class="total-row">
                    <div class="total-label">Subtotal (Before Tax):</div>
                    <div class="total-amount">${formatPrice(subtotal)}</div>
                </div>
                <div class="total-row">
                    <div class="total-label">CGST (9%):</div>
                    <div class="total-amount">${formatPrice(tax / 2)}</div>
                </div>
                <div class="total-row">
                    <div class="total-label">SGST (9%):</div>
                    <div class="total-amount">${formatPrice(tax / 2)}</div>
                </div>
                <div class="total-row">
                    <div class="total-label">Total Tax (18% GST):</div>
                    <div class="total-amount">${formatPrice(tax)}</div>
                </div>
                <div class="total-row">
                    <div class="total-label">Shipping & Handling:</div>
                    <div class="total-amount">₹0.00</div>
                </div>
                <div class="total-row grand-total">
                    <div class="total-label">Total Amount:</div>
                    <div class="total-amount">${formatPrice(order.total)}</div>
                </div>
            </div>

            <div class="tax-info">
                <strong>Tax Breakdown:</strong><br>
                This invoice includes Goods and Services Tax (GST) as per Indian tax regulations.<br>
                GST is calculated at 18% (CGST 9% + SGST 9%) on the base amount.
            </div>

            <div class="disclaimer">
                <strong>📧 COMPUTER GENERATED INVOICE</strong><br>
                This is a digitally generated invoice and does not require any physical signature or stamp.<br>
                This document is valid for all legal and accounting purposes.
            </div>

            <div class="footer">
                <p><strong>Thank you for your business!</strong></p>
                <p>BubbleBeads - Premium Laundry Detergent Pods</p>
                <p style="margin-top: 10px; font-size: 12px;">For any queries regarding this invoice, please contact us at support@bubblebeads.com</p>
                <p style="font-size: 12px; margin-top: 5px;">This invoice was generated on ${new Date().toLocaleString("en-IN")}</p>
            </div>
        </div>
    </body>
    </html>
  `;
}