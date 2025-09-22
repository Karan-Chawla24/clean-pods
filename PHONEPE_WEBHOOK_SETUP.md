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
- ✅ **PAYMENT_SUCCESS** - When payment is completed successfully
- ✅ **PAYMENT_FAILED** - When payment fails
- ✅ **PAYMENT_PENDING** - When payment is in pending state
- ✅ **PAYMENT_CANCELLED** - When payment is cancelled by user

## 🔐 Security Configuration

After creating the webhook in PhonePe dashboard:

1. **Save the webhook username and password** provided by PhonePe
2. **Add to environment variables**:
   ```bash
   PHONEPE_WEBHOOK_USERNAME=your_webhook_username_from_phonepe
   PHONEPE_WEBHOOK_PASSWORD=your_webhook_password_from_phonepe
   ```

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