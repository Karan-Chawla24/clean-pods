import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderData, customerData } = body;

    // Log the order details (for backup)
    console.log('=== NEW ORDER RECEIVED ===');
    console.log('Order ID:', orderData.id);
    console.log('Customer:', customerData.firstName, customerData.lastName);
    console.log('Email:', customerData.email);
    console.log('Phone:', customerData.phone);
    console.log('Address:', customerData.address, customerData.city, customerData.state, customerData.pincode);
    console.log('Items:', orderData.items);
    console.log('Total:', orderData.total);
    console.log('Payment ID:', orderData.paymentId);
    console.log('Order Date:', orderData.orderDate);
    console.log('========================');

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured. Emails will not be sent.');
      return NextResponse.json({
        success: true,
        message: 'Order logged successfully (email not configured)'
      });
    }

    // Admin notification email
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🎉 New Order Received!</h1>
        </div>
        
        <div style="padding: 20px; background: #f8fafc;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin-top: 0;">Order Details</h2>
            <p><strong>Order ID:</strong> ${orderData.id}</p>
            <p><strong>Total Amount:</strong> ₹${orderData.total}</p>
            <p><strong>Payment ID:</strong> ${orderData.paymentId}</p>
            <p><strong>Order Date:</strong> ${new Date(orderData.orderDate).toLocaleDateString('en-IN')}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin-top: 0;">Customer Information</h2>
            <p><strong>Name:</strong> ${customerData.firstName} ${customerData.lastName}</p>
            <p><strong>Email:</strong> ${customerData.email}</p>
            <p><strong>Phone:</strong> ${customerData.phone}</p>
            <p><strong>Address:</strong><br>
            ${customerData.address}<br>
            ${customerData.city}, ${customerData.state} ${customerData.pincode}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h2 style="color: #1e40af; margin-top: 0;">Items Ordered</h2>
            ${orderData.items.map((item: any) => `
              <div style="border-bottom: 1px solid #e5e7eb; padding: 10px 0;">
                <p style="margin: 0;"><strong>${item.name}</strong></p>
                <p style="margin: 5px 0; color: #6b7280;">Quantity: ${item.quantity} × ₹${item.price} = ₹${item.price * item.quantity}</p>
              </div>
            `).join('')}
            <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #2563eb;">
              <p style="margin: 0; font-size: 18px;"><strong>Total: ₹${orderData.total}</strong></p>
            </div>
          </div>
        </div>
        
        <div style="background: #1e40af; color: white; padding: 15px; text-align: center;">
          <p style="margin: 0;">Please process this order and arrange for shipping.</p>
        </div>
      </div>
    `;

    // Customer confirmation email
    const customerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">✅ Order Confirmed!</h1>
        </div>
        
        <div style="padding: 20px; background: #f8fafc;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin-top: 0;">Dear ${customerData.firstName},</h2>
            <p>Thank you for your order! Your payment has been confirmed and we're preparing your CleanPods for shipment.</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin-top: 0;">Order Summary</h2>
            <p><strong>Order ID:</strong> ${orderData.id}</p>
            <p><strong>Total Amount:</strong> ₹${orderData.total}</p>
            <p><strong>Payment ID:</strong> ${orderData.paymentId}</p>
            <p><strong>Order Date:</strong> ${new Date(orderData.orderDate).toLocaleDateString('en-IN')}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e40af; margin-top: 0;">Items Ordered</h2>
            ${orderData.items.map((item: any) => `
              <div style="border-bottom: 1px solid #e5e7eb; padding: 10px 0;">
                <p style="margin: 0;"><strong>${item.name}</strong></p>
                <p style="margin: 5px 0; color: #6b7280;">Quantity: ${item.quantity} × ₹${item.price} = ₹${item.price * item.quantity}</p>
              </div>
            `).join('')}
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h2 style="color: #1e40af; margin-top: 0;">Shipping Address</h2>
            <p>${customerData.address}<br>
            ${customerData.city}, ${customerData.state} ${customerData.pincode}</p>
          </div>
        </div>
        
        <div style="background: #10b981; color: white; padding: 15px; text-align: center;">
          <p style="margin: 0;">We'll send you tracking information once your order ships!</p>
          <p style="margin: 10px 0 0 0;">Thank you for choosing CleanPods! 🧽✨</p>
        </div>
      </div>
    `;

    try {
      // Send admin notification
      if (process.env.ADMIN_EMAIL) {
        await resend.emails.send({
          from: 'CleanPods <orders@cleanpods.com>',
          to: process.env.ADMIN_EMAIL,
          subject: `🎉 New Order #${orderData.id} - ₹${orderData.total}`,
          html: adminEmailHtml,
        });
        console.log('Admin notification email sent successfully');
      }

      // Send customer confirmation
      await resend.emails.send({
        from: 'CleanPods <orders@cleanpods.com>',
        to: customerData.email,
        subject: `✅ Order Confirmation #${orderData.id} - CleanPods`,
        html: customerEmailHtml,
      });
      console.log('Customer confirmation email sent successfully');

    } catch (emailError) {
      console.error('Error sending emails:', emailError);
      // Don't fail the order if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Order notification sent successfully'
    });

  } catch (error) {
    console.error('Error processing order notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process order notification' },
      { status: 500 }
    );
  }
}