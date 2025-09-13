import { NextRequest, NextResponse } from "next/server";
import { getOrder } from "../../../lib/database";
import { verifyInvoiceToken } from "../../../lib/jwt-utils";
import { auth } from "@clerk/nextjs/server";
import { safeLogError } from "../../../lib/security/logging";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

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

    // Generate invoice HTML
    const invoiceHtml = generateInvoiceHtml(order);

    // Return HTML that opens in browser for printing/saving as PDF
    return new NextResponse(invoiceHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    safeLogError("Error generating invoice", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 },
    );
  }
}

function generateInvoiceHtml(order: any): string {
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-IN');
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
    // If total includes tax, extract it: total = subtotal + (subtotal * 0.18)
    // So: total = subtotal * 1.18, therefore subtotal = total / 1.18
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
            body {
                font-family: Arial, sans-serif;
                line-height: 1.4;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: #f9fafb;
            }
            .invoice-container {
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 1px solid #e5e7eb;
            }
            .company-info {
                flex: 1;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #ff6b35;
                margin-bottom: 8px;
            }
            .company-details {
                font-size: 12px;
                color: #666;
                line-height: 1.3;
            }
            .invoice-info {
                text-align: right;
                flex: 1;
            }
            .invoice-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 8px;
                color: #333;
            }
            .invoice-meta {
                color: #666;
                font-size: 12px;
                line-height: 1.4;
            }
            .tax-info {
                background: #f8f9fa;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 4px;
            }
            .tax-info h3 {
                margin: 0 0 10px 0;
                font-size: 14px;
                font-weight: bold;
                color: #333;
            }
            .tax-details {
                font-size: 12px;
                color: #666;
                line-height: 1.4;
            }
            .billing-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-bottom: 30px;
            }
            .section-title {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #333;
            }
            .section-content {
                font-size: 12px;
                color: #666;
                line-height: 1.4;
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
                font-size: 12px;
            }
            .items-table th {
                background-color: #f8f9fa;
                padding: 10px 8px;
                text-align: left;
                border: 1px solid #dee2e6;
                font-weight: bold;
                color: #333;
            }
            .items-table td {
                padding: 10px 8px;
                border: 1px solid #dee2e6;
                color: #666;
            }
            .items-table .text-right {
                text-align: right;
            }
            .totals-section {
                margin-top: 20px;
                display: flex;
                justify-content: flex-end;
            }
            .totals-table {
                width: 300px;
                font-size: 12px;
            }
            .totals-table td {
                padding: 5px 10px;
                border: none;
            }
            .totals-table .label {
                text-align: right;
                color: #666;
                width: 60%;
            }
            .totals-table .amount {
                text-align: right;
                color: #333;
                font-weight: bold;
                width: 40%;
            }
            .total-amount-final {
                background-color: #f8f9fa;
                border-top: 1px solid #dee2e6;
                font-weight: bold;
                color: #ff6b35;
                font-size: 14px;
            }
            .footer {
                margin-top: 30px;
                padding-top: 15px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #666;
                font-size: 12px;
            }
            .invoice-actions {
                position: fixed;
                top: 20px;
                right: 20px;
                display: flex;
                gap: 10px;
                z-index: 1000;
            }
            .action-btn {
                background: linear-gradient(to right, #f97316, #f59e0b);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                transition: all 0.2s;
            }
            .action-btn:hover {
                background: linear-gradient(to right, #ea580c, #d97706);
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            }
            .action-btn.secondary {
                background: #6b7280;
            }
            .action-btn.secondary:hover {
                background: #4b5563;
            }
            @media print {
                body { background: white; }
                .invoice-container { box-shadow: none; }
                .invoice-actions { display: none; }
            }
        </style>
    </head>
    <body>
        <!-- Action Buttons -->
        <div class="invoice-actions">
            <button class="action-btn" onclick="window.print()">
                📥 Download / Print
            </button>
        </div>

        <div class="invoice-container">
            <div class="header">
                <div class="company-info">
                    <div class="logo">BubbleBeads</div>
                    <div class="company-details">
                        Premium Laundry Detergent Pods<br>              
                        02830-004, Shakti Vihar, St No 4, Phase 4<br>
                        Bathinda, Punjab 151001<br>
                        Phone: +91 6239881097<br>
                        Email: customercare.bb@outlook.com
                    </div>
                </div>
                <div class="invoice-info">
                    <div class="invoice-title">INVOICE</div>
                    <div class="invoice-meta">
                        Invoice #: RV-${order.id.slice(-8)}<br>
                        Order #: ${order.id}<br>
                        Date: ${formatDate(order.orderDate)}
                    </div>
                </div>
            </div>

            <div class="tax-info">
                <h3>Tax Information</h3>
                <div class="tax-details">
                    <strong>GST Number:</strong> 27AABCU9603R1ZX<br>
                    <strong>PAN Number:</strong> AABCU9603R<br>
                    <strong>Tax Rate:</strong> 18% GST (CGST 9% + SGST 9%)
                </div>
            </div>

            <div class="billing-section">
                <div>
                    <div class="section-title">Bill To:</div>
                    <div class="section-content">
                        <strong>${order.customerName}</strong><br>
                        ${order.customerEmail}<br>
                        ${order.customerPhone}<br>
                        ${order.address}
                    </div>
                </div>
                <div>
                    <div class="section-title">Payment Details:</div>
                    <div class="section-content">
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

            <div class="totals-section">
                <table class="totals-table">
                    <tr>
                        <td class="label">Subtotal (Before Tax):</td>
                        <td class="amount">${formatPrice(subtotal)}</td>
                    </tr>
                    <tr>
                        <td class="label">CGST (9%):</td>
                        <td class="amount">${formatPrice(tax / 2)}</td>
                    </tr>
                    <tr>
                        <td class="label">SGST (9%):</td>
                        <td class="amount">${formatPrice(tax / 2)}</td>
                    </tr>
                    <tr>
                        <td class="label">Total Tax (18% GST):</td>
                        <td class="amount">${formatPrice(tax)}</td>
                    </tr>
                    <tr>
                        <td class="label">Shipping & Handling:</td>
                        <td class="amount">0.00</td>
                    </tr>
                    <tr class="total-amount-final">
                        <td class="label"><strong>Total Amount:</strong></td>
                        <td class="amount"><strong>${formatPrice(order.total)}</strong></td>
                    </tr>
                </table>
            </div>

            <div class="footer">
                <p>Thank you for your business!</p>
                <p>BubbleBeads - Premium Laundry Detergent Pods</p>
            </div>
        </div>

        <script>
            console.log('Invoice script loaded');
            
            // Simple functions for inline onclick handlers
            function downloadPDFSimple() {
                console.log('Download PDF (simple) called');
                window.print();
                setTimeout(function() {
                    alert('To save as PDF: Choose "Save as PDF" in the print dialog');
                }, 500);
            }
            
            function printSimple() {
                console.log('Print (simple) called');
                window.print();
            }
            
            // Download PDF function
            function downloadPDF() {
                console.log('Download PDF function called');
                try {
                    window.print();
                    // Show helpful instructions
                    setTimeout(function() {
                        alert('To save as PDF:\n\n1. In the print dialog, find "Destination" or "Printer"\n2. Select "Save as PDF" or "Microsoft Print to PDF"\n3. Click "Save" and choose where to save your invoice\n\nTip: Use Ctrl+P anytime to open the print dialog!');
                    }, 500);
                } catch (error) {
                    console.error('Print error:', error);
                    alert('Print failed. Please try pressing Ctrl+P manually to open the print dialog.');
                }
            }

            // Print function  
            function printInvoice() {
                console.log('Print function called');
                try {
                    window.print();
                } catch (error) {
                    console.error('Print error:', error);
                    alert('Print failed. Please try pressing Ctrl+P manually to open the print dialog.');
                }
            }

            // Function to setup button listeners
            function setupButtons() {
                console.log('Setting up button listeners');
                
                // Get buttons by ID with retry mechanism
                var downloadBtn = document.getElementById('downloadBtn');
                var printBtn = document.getElementById('printBtn');
                
                console.log('Download button found:', !!downloadBtn, downloadBtn);
                console.log('Print button found:', !!printBtn, printBtn);
                
                // Add click listeners with multiple event binding methods
                if (downloadBtn) {
                    // Remove any existing listeners
                    downloadBtn.onclick = null;
                    
                    // Method 1: onclick property
                    downloadBtn.onclick = function(e) {
                        console.log('Download button clicked (onclick)!');
                        e.preventDefault();
                        e.stopPropagation();
                        downloadPDF();
                        return false;
                    };
                    
                    // Method 2: addEventListener
                    downloadBtn.addEventListener('click', function(e) {
                        console.log('Download button clicked (addEventListener)!');
                        e.preventDefault();
                        e.stopPropagation();
                        downloadPDF();
                        return false;
                    }, true);
                    
                    console.log('Download button listeners added');
                } else {
                    console.error('Download button not found!');
                }
                
                if (printBtn) {
                    // Remove any existing listeners
                    printBtn.onclick = null;
                    
                    // Method 1: onclick property
                    printBtn.onclick = function(e) {
                        console.log('Print button clicked (onclick)!');
                        e.preventDefault();
                        e.stopPropagation();
                        printInvoice();
                        return false;
                    };
                    
                    // Method 2: addEventListener
                    printBtn.addEventListener('click', function(e) {
                        console.log('Print button clicked (addEventListener)!');
                        e.preventDefault();
                        e.stopPropagation();
                        printInvoice();
                        return false;
                    }, true);
                    
                    console.log('Print button listeners added');
                } else {
                    console.error('Print button not found!');
                }
            }

            // Multiple ways to ensure DOM is ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setupButtons);
            } else {
                setupButtons();
            }
            
            // Backup: try again after a short delay
            setTimeout(function() {
                console.log('Backup button setup triggered');
                setupButtons();
            }, 100);
            
            // Another backup: setup on window load
            window.addEventListener('load', function() {
                console.log('Window loaded, setting up buttons again');
                setupButtons();
                
                // Auto-print if requested
                if (window.location.search.includes('print=true')) {
                    setTimeout(printInvoice, 500);
                }
            });

            // Handle keyboard shortcuts
            document.addEventListener('keydown', function(e) {
                console.log('Key pressed:', e.key, 'Ctrl:', e.ctrlKey, 'Meta:', e.metaKey);
                if (e.ctrlKey || e.metaKey) {
                    if (e.key === 'p' || e.key === 'P') {
                        e.preventDefault();
                        console.log('Ctrl+P pressed - printing');
                        printInvoice();
                    } else if (e.key === 's' || e.key === 'S') {
                        e.preventDefault();
                        console.log('Ctrl+S pressed - downloading PDF');
                        downloadPDF();
                    }
                }
            });
            
            // Debug function to test buttons
            window.testButtons = function() {
                console.log('Testing buttons...');
                var downloadBtn = document.getElementById('downloadBtn');
                var printBtn = document.getElementById('printBtn');
                console.log('Download button:', downloadBtn);
                console.log('Print button:', printBtn);
                
                if (downloadBtn) {
                    console.log('Triggering download button click');
                    downloadBtn.click();
                }
            };
        </script>
    </body>
    </html>
  `;
}
