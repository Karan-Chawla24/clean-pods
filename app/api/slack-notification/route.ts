import { NextRequest, NextResponse } from 'next/server';
import { IncomingWebhook } from '@slack/webhook';

// Initialize Slack webhook
const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL || '');

// Functions to mask sensitive data
function maskEmail(email: string): string {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = localPart.length > 2 
    ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2)
    : localPart;
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone: string): string {
  if (!phone) return '';
  if (phone.length <= 4) return phone;
  return phone.substring(0, 2) + '*'.repeat(phone.length - 4) + phone.substring(phone.length - 2);
}

function maskAddress(address: string): string {
  if (!address) return '';
  const parts = address.split(',');
  if (parts.length <= 1) return address.substring(0, 10) + '...';
  // Show only city and state, mask detailed address
  return `*****, ${parts.slice(-2).join(',').trim()}`;
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface OrderData {
  id: string;
  items: OrderItem[];
  total: number;
  paymentId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderData, customerData }: { orderData: OrderData; customerData: CustomerData } = body;

    if (!process.env.SLACK_WEBHOOK_URL) {
      return NextResponse.json({ success: true, message: 'Slack webhook not configured' });
    }

    // Create a beautiful Slack message
    const itemsList = orderData.items
      .map(item => `• ${item.name} x${item.quantity} - ₹${item.price}`)
      .join('\n');

    const totalFormatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(orderData.total);

    const slackMessage = {
      text: '🎉 *New Order Received!*',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎉 New Order Received!',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Order ID:*\n\`${orderData.id}\``
            },
            {
              type: 'mrkdwn',
              text: `*Payment ID:*\n\`${orderData.paymentId}\``
            },
            {
              type: 'mrkdwn',
              text: `*Total Amount:*\n*${totalFormatted}*`
            },
            {
              type: 'mrkdwn',
              text: `*Order Date:*\n${new Date().toLocaleString('en-IN')}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*📦 Order Items:*'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: itemsList
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*👤 Customer Details:*'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Name:*\n${customerData.name}`
            },
            {
              type: 'mrkdwn',
              text: `*Email:*\n${maskEmail(customerData.email)}`
            },
            {
              type: 'mrkdwn',
              text: `*Phone:*\n${maskPhone(customerData.phone)}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*📍 Address:*\n${maskAddress(customerData.address)}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*🔗 View Full Details:*'
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View in Admin Panel',
              emoji: true
            },
            url: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/orders/${orderData.id}`,
            action_id: 'view_order_details'
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '🛍️ BubbleBeads E-commerce Order'
            }
          ]
        }
      ]
    };

    // Send to Slack
    const result = await webhook.send(slackMessage);
    
    return NextResponse.json({
      success: true,
      message: 'Slack notification sent successfully',
      slackResponse: result
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send Slack notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}