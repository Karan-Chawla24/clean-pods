import { NextRequest, NextResponse } from 'next/server';
import { getOrder } from '../../../lib/database';
import crypto from 'crypto';

// Generate a simple token for invoice access (in production, use proper JWT)
function generateInvoiceToken(orderId: string): string {
  const secret = process.env.INVOICE_SECRET || 'fallback-secret-key-change-in-production';
  return crypto.createHmac('sha256', secret).update(orderId).digest('hex').substring(0, 16);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const orderData = searchParams.get('orderData'); // Optional order data from client
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Simple token validation - in production, use proper JWT or session tokens
    const expectedToken = generateInvoiceToken(orderId);
    if (!token || token !== expectedToken) {
      return NextResponse.json(
        { error: 'Access denied. Invalid or missing token.' },
        { status: 403 }
      );
    }

    // Try to get order from database first
    let order = await getOrder(orderId);
    
    // If not found in database and we have order data from client, use that
    if (!order && orderData) {
      try {
        order = JSON.parse(decodeURIComponent(orderData));
        // Validate that the order data contains the expected orderId
        if (order.id !== orderId && order.razorpayOrderId !== orderId) {
          return NextResponse.json(
            { error: 'Order data mismatch' },
            { status: 400 }
          );
        }
      } catch (parseError) {
        console.error('Failed to parse order data:', parseError);
        return NextResponse.json(
          { error: 'Invalid order data format' },
          { status: 400 }
        );
      }
    }
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Generate invoice HTML
    const invoiceHtml = generateInvoiceHtml(order);

    // Return HTML that opens in browser for printing/saving as PDF
    return new NextResponse(invoiceHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}

function generateInvoiceHtml(order: any): string {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - ${order.id}</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: #f9fafb;
            }
            .invoice-container {
                background: white;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px;
                padding-bottom: 20px;
                border-bottom: 2px solid #e5e7eb;
            }
            .logo {
                font-size: 32px;
                font-weight: bold;
                color: #2563eb;
            }
            .invoice-info {
                text-align: right;
            }
            .invoice-title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 8px;
            }
            .invoice-number {
                color: #6b7280;
                font-size: 14px;
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
            }
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
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
                min-width: 100px;
            }
            .total-amount {
                font-weight: 600;
                min-width: 120px;
            }
            .grand-total {
                font-size: 20px;
                font-weight: bold;
                color: #2563eb;
                padding-top: 12px;
                border-top: 1px solid #e5e7eb;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
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
                background: #2563eb;
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
                transition: background-color 0.2s;
            }
            .action-btn:hover {
                background: #1d4ed8;
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
                <div class="logo">BubbleBeads</div>
                <div class="invoice-info">
                    <div class="invoice-title">INVOICE</div>
                    <div class="invoice-number">Order #${order.id}</div>
                    <div class="invoice-number">Date: ${formatDate(order.orderDate)}</div>
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
                        <strong>Payment ID:</strong> ${order.paymentId}<br>
                        <strong>Order ID:</strong> ${order.razorpayOrderId}
                    </div>
                </div>
            </div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th class="text-right">Quantity</th>
                        <th class="text-right">Unit Price</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map((item: any) => `
                        <tr>
                            <td>${item.name}</td>
                            <td class="text-right">${item.quantity}</td>
                            <td class="text-right">${formatPrice(item.price)}</td>
                            <td class="text-right">${formatPrice(item.price * item.quantity)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="total-section">
                <div class="total-row">
                    <div class="total-label">Subtotal:</div>
                    <div class="total-amount">${formatPrice(order.total)}</div>
                </div>
                <div class="total-row">
                    <div class="total-label">Tax:</div>
                    <div class="total-amount">₹0.00</div>
                </div>
                <div class="total-row">
                    <div class="total-label">Shipping:</div>
                    <div class="total-amount">₹0.00</div>
                </div>
                <div class="total-row grand-total">
                    <div class="total-label">Total:</div>
                    <div class="total-amount">${formatPrice(order.total)}</div>
                </div>
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
