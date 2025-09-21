# PhonePe Webhook Troubleshooting Guide

## Common Issues and Solutions

### 1. "PhonePe webhook missing authorization header" Error

This error occurs when PhonePe is not sending the expected Authorization header. Here's how to debug:

#### Check the Logs
The webhook now logs comprehensive information including:
- All headers received from PhonePe
- Authorization header status
- Environment variable configuration

#### Possible Causes:

1. **Environment Variables Not Set**
   - Ensure `PHONEPE_WEBHOOK_USERNAME` and `PHONEPE_WEBHOOK_PASSWORD` are set in production
   - These should match the credentials configured in PhonePe Business Dashboard

2. **PhonePe Dashboard Configuration**
   - **Production**: Configure webhook URL, username, and password in PhonePe Business Dashboard
   - **UAT/Sandbox**: Contact PhonePe Integration Team to configure webhook settings

3. **Header Format Variations**
   - PhonePe should send: `Authorization: SHA256(username:password)`
   - Our implementation now handles various formats:
     - `Authorization: SHA256 <hash>`
     - `Authorization: <hash>`
     - `Authorization: Bearer <hash>`
     - Case-insensitive matching

#### Expected Authorization Header Format

According to PhonePe documentation:
```
Authorization: SHA256(username:password)
```

Where the hash is calculated as:
```javascript
const hash = crypto
  .createHash('sha256')
  .update(`${username}:${password}`)
  .digest('hex');
```

#### Debugging Steps:

1. **Check Environment Variables**
   ```bash
   # In production, verify these are set:
   echo $PHONEPE_WEBHOOK_USERNAME
   echo $PHONEPE_WEBHOOK_PASSWORD
   ```

2. **Review Webhook Logs**
   - Look for "PhonePe webhook received" logs to see all headers
   - Check "PhonePe webhook auth check" logs for authorization details

3. **Verify PhonePe Configuration**
   - Ensure webhook URL is correctly configured in PhonePe dashboard
   - Verify username/password match environment variables

4. **Test Locally**
   ```bash
   # Test with correct authorization
   curl -X POST http://localhost:3000/api/webhooks/phonepe \
     -H "Content-Type: application/json" \
     -H "Authorization: SHA256 $(echo -n 'username:password' | sha256sum | cut -d' ' -f1)" \
     -d '{"event":"checkout.order.completed","payload":{"state":"COMPLETED"}}'
   ```

### 2. Authorization Verification Failed

If the header is present but verification fails:

1. **Check Credentials Match**
   - Ensure environment variables match PhonePe dashboard configuration
   - Verify no extra spaces or special characters

2. **Case Sensitivity**
   - Our implementation now handles case-insensitive comparison
   - PhonePe might send uppercase or lowercase hashes

3. **Hash Calculation**
   - Verify the hash is calculated as `SHA256(username:password)`
   - No additional encoding or formatting

### 3. Production Deployment Checklist

Before deploying to production:

1. ✅ Set environment variables in Vercel/hosting platform
2. ✅ Configure webhook URL in PhonePe Business Dashboard
3. ✅ Test webhook endpoint responds to POST requests
4. ✅ Verify logs are working for debugging
5. ✅ Test with PhonePe's webhook testing tools (if available)

### 4. Monitoring and Alerts

Set up monitoring for:
- Webhook authorization failures
- Missing authorization headers
- Unexpected webhook payloads
- High error rates

## Contact Information

If issues persist:
- Check PhonePe Business Dashboard for webhook configuration
- Contact PhonePe Integration Team through dashboard support
- Review official PhonePe webhook documentation