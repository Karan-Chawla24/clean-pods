import { NextRequest, NextResponse } from 'next/server';
import { IncomingWebhook } from '@slack/webhook';

export async function GET(request: NextRequest) {
  try {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (!webhookUrl) {
      return NextResponse.json({
        success: false,
        error: 'SLACK_WEBHOOK_URL not configured',
        message: 'Please add SLACK_WEBHOOK_URL to your environment variables'
      });
    }

    const webhook = new IncomingWebhook(webhookUrl);
    
    const testMessage = {
      text: '🧪 Test Slack Integration',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*🧪 Test Message*\nThis is a test to verify Slack integration is working!'
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '🛍️ CleanPods Test'
            }
          ]
        }
      ]
    };

    const result = await webhook.send(testMessage);
    
    return NextResponse.json({
      success: true,
      message: 'Test Slack notification sent successfully',
      slackResponse: result
    });

  } catch (error) {
    console.error('❌ Test Slack notification failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send test Slack notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 