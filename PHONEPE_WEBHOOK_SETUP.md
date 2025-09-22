# PhonePe Webhook Setup Guide

This guide helps you configure the PhonePe webhook in your PhonePe dashboard to receive real-time payment notifications.

## 🔗 Webhook Configuration

When setting up the webhook in your PhonePe dashboard, use these values:

### Webhook URL
```
https://bubblebeads.in/api/webhooks/phonepe
```

### Username
```
bubblebeads_webhook
```
*Note: You can use any username you prefer. This is for basic authentication.*

### Password
```
[Generate a strong password and save it securely]
```
*Recommendation: Use a password manager to generate a strong, unique password.*

### Description
```
BubbleBeads payment status webhook for order processing and notifications
```

### Active Events
Select these events to receive notifications:

**Order Events:**
- ✅ **checkout.order.completed** - Sent when an order is successfully completed
- ✅ **checkout.order.failed** - Sent when an order fails

**Refund Events:**
- ✅ **pg.refund.completed** - Sent when a refund is successfully processed
- ✅ **pg.refund.failed** - Sent when a refund processing fails

## 🔐 Security Configuration

### Authorization Header Setup

PhonePe sends an Authorization header with webhook requests **only after** you configure the webhook URL, username, and password in your PhonePe Business dashboard. The header format is:
```
Authorization: SHA256(username:password)
```

### Environment Variables

After creating the webhook in PhonePe dashboard:

1. **Save the webhook username and password** provided by PhonePe
2. **Add to environment variables**:
   ```bash
   PHONEPE_WEBHOOK_USERNAME=your_webhook_username_from_phonepe
   PHONEPE_WEBHOOK_PASSWORD=your_webhook_password_from_phonepe
   ```

### Development Testing

For development and testing scenarios, you can bypass webhook authentication:

```bash
# Development only - NEVER use in production
PHONEPE_WEBHOOK_DEV_BYPASS=true
```

**⚠️ Security Warning**: The development bypass should NEVER be enabled in production environments. It completely skips signature verification and should only be used for local testing.

## 📋 Configuration Process

### Production Environment
1. **Configure Webhook**: You can configure the Webhook URL, username, and password directly on the PhonePe Business dashboard
2. **Set Credentials**: PhonePe will use your provided username and password to create an Authorization header
3. **Verification**: PhonePe sends `Authorization: SHA256(username:password)` with each webhook request

### Sandbox Environment
1. **Contact Integration Team**: You must reach out to PhonePe Integration Team to set up webhooks
2. **Create Support Ticket**:
   - Click **Help** in the side panel of your dashboard
   - Select **Integration** and click **Contact Us**
   - Share the webhook callback URL while creating the ticket

## ✅ Webhook Validation Guidelines

**Important validation rules from PhonePe:**

1. **Use payload.state Parameter**: For payment status, rely only on the root-level `payload.state` field
2. **Avoid Strict Deserialization**: Don't use overly strict rules for processing the response
3. **Use event Parameter**: Ignore the `type` parameter. Use the `event` parameter instead to identify event type
4. **Time Format**: The `expireAt` and `timestamp` fields will be in epoch time
5. **Authorization Header**: Extract and verify the `Authorization` header using SHA256(username:password)

## 🚀 Deployment Steps

### 1. Update Environment Variables
Add the webhook credentials to your Vercel environment variables:

```bash
# In Vercel Dashboard -> Settings -> Environment Variables
PHONEPE_WEBHOOK_USERNAME=your_webhook_username_from_phonepe
PHONEPE_WEBHOOK_PASSWORD=your_webhook_password_from_phonepe
```

### 2. Verify Webhook Endpoint
Test the webhook endpoint:

```bash
# Test GET request (for verification)
curl https://bubblebeads.in/api/webhooks/phonepe

# Expected response:
# {"message": "PhonePe webhook endpoint is active"}
```

### 3. Test Webhook
After configuration:
1. Make a test payment
2. Check Vercel logs for webhook events
3. Verify payment status updates

## 📋 Webhook Events

The webhook endpoint handles these events:

| Event | Description | Action |
|-------|-------------|--------|
| `PAYMENT_SUCCESS` | Payment completed | Update order status, send confirmation |
| `PAYMENT_FAILED` | Payment failed | Update order status, log failure |
| `PAYMENT_PENDING` | Payment pending | Monitor status |
| `PAYMENT_CANCELLED` | Payment cancelled | Update order status |

## 🔍 Monitoring

### Check Webhook Logs
1. Go to Vercel Dashboard
2. Navigate to Functions tab
3. Check logs for `/api/webhooks/phonepe`

### Webhook Payload Example
```json
{
  "event": "PAYMENT_SUCCESS",
  "merchantOrderId": "ORDER_123456",
  "transactionId": "TXN_789012",
  "status": "SUCCESS",
  "amount": 50000,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## ⚠️ Important Notes

1. **Business Account Required**: Webhooks are only available for live business accounts
2. **HTTPS Required**: Webhook URL must use HTTPS
3. **Authentication**: PhonePe may require basic auth (username/password)
4. **Signature Verification**: Always verify webhook signatures for security
5. **Idempotency**: Handle duplicate webhook calls gracefully

## 🐛 Troubleshooting

### Webhook Not Receiving Events
1. Check if business account is live
2. Verify webhook URL is accessible
3. Check Vercel function logs
4. Ensure HTTPS is working

### Authentication Errors
1. Verify username/password in PhonePe dashboard
2. Check if basic auth is required
3. Update webhook credentials if needed

### Signature Verification Fails
1. Check `PHONEPE_WEBHOOK_USERNAME` and `PHONEPE_WEBHOOK_PASSWORD` environment variables
2. Verify signature algorithm (PhonePe uses SHA256(username:password))
3. Check webhook payload format

## 📞 Support

If you encounter issues:
1. Check PhonePe documentation
2. Contact PhonePe support
3. Review Vercel function logs
4. Test webhook endpoint manually

---

**Next Steps**: After setting up the webhook, test the complete payment flow to ensure notifications are received correctly.