const { IncomingWebhook } = require('@slack/webhook');

// Test the Slack webhook directly
async function testSlackWebhook() {
  try {
    console.log('Testing Slack webhook directly...');
    
    const webhookUrl = 'https://hooks.slack.com/services/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';
    console.log('Webhook URL:', webhookUrl);
    
    const webhook = new IncomingWebhook(webhookUrl);
    console.log('Webhook instance created successfully');
    
    const simpleMessage = {
      text: '🧪 Test message from Node.js script'
    };
    
    console.log('Sending simple message...');
    const result = await webhook.send(simpleMessage);
    console.log('✅ Message sent successfully:', result);
    
    // Test with blocks (similar to the API)
    const complexMessage = {
      text: '🎉 *Test Order*',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎉 Test Order',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: '*Order ID:*\n`test-123`'
            },
            {
              type: 'mrkdwn',
              text: '*Total:*\n*₹598*'
            }
          ]
        }
      ]
    };
    
    console.log('Sending complex message...');
    const result2 = await webhook.send(complexMessage);
    console.log('✅ Complex message sent successfully:', result2);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack
    });
  }
}

testSlackWebhook();