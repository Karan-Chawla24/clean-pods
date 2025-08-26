import { NextRequest, NextResponse } from 'next/server';
import { IncomingWebhook } from '@slack/webhook';
import { withRateLimit, rateLimitConfigs } from '@/app/lib/security/rateLimit';
import { validateRequest, contactFormSchema, sanitizeString } from '@/app/lib/security/validation';
import { safeLogError } from '@/app/lib/security/logging';

// Initialize Slack webhook for contact form
const webhook = new IncomingWebhook(process.env.SLACK_CONTACT_URL || '');

// Function to display full email (no masking)
function displayEmail(email: string): string {
  if (!email) return '';
  return email;
}

export const POST = withRateLimit(rateLimitConfigs.moderate)(async (request: NextRequest) => {
  try {
    // Validate request body with Zod schema
    const validationResult = await validateRequest(request, contactFormSchema);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = validationResult.data;
    
    // Sanitize inputs to prevent injection attacks
    const sanitizedName = sanitizeString(name);
    const sanitizedSubject = sanitizeString(subject);
    const sanitizedMessage = sanitizeString(message);

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
              text: `*Name:*\n${sanitizedName}`
            },
            {
              type: 'mrkdwn',
              text: `*Email:*\n${displayEmail(email)}`
            },
            {
              type: 'mrkdwn',
              text: `*Subject:*\n${sanitizedSubject}`
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
            text: sanitizedMessage
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
              text: '🛍️ BubbleBeads Contact Form'
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
    safeLogError('Contact notification error', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send contact notification'
      },
      { status: 500 }
    );
  }
});