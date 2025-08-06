import { NextRequest, NextResponse } from 'next/server';
import { IncomingWebhook } from '@slack/webhook';

// Initialize Slack webhook for contact form
const webhook = new IncomingWebhook(process.env.SLACK_CONTACT_URL || '');

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message }: ContactFormData = body;

    if (!process.env.SLACK_CONTACT_URL) {
      return NextResponse.json({ success: true, message: 'Slack contact webhook not configured' });
    }

    // Create a beautiful Slack message for contact form
    const slackMessage = {
      text: '📧 *New Contact Form Submission!*',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📧 New Contact Form Submission!',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Name:*\n${name}`
            },
            {
              type: 'mrkdwn',
              text: `*Email:*\n${email}`
            },
            {
              type: 'mrkdwn',
              text: `*Subject:*\n${subject}`
            },
            {
              type: 'mrkdwn',
              text: `*Submitted At:*\n${new Date().toLocaleString('en-IN')}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*📝 Message:*'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message
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
              text: '🛍️ CleanPods Contact Form'
            }
          ]
        }
      ]
    };

    // Send to Slack
    const result = await webhook.send(slackMessage);
    
    return NextResponse.json({
      success: true,
      message: 'Contact form notification sent successfully',
      slackResponse: result
    });

  } catch (error) {
    console.error('Contact notification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send contact notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 