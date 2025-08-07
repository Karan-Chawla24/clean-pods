import { NextRequest, NextResponse } from 'next/server';
import { IncomingWebhook } from '@slack/webhook';

// Initialize Slack webhook
const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL || '');

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
              text: `*Email:*\n${customerData.email}`
            },
            {
              type: 'mrkdwn',
              text: `*Phone:*\n${customerData.phone}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*📍 Address:*\n${customerData.address}`
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
              text: '🛍️ CleanPods E-commerce Order'
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