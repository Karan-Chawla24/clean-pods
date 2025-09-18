# PhonePe Configuration Fix Guide

## Issue Identified

The current setup has a **configuration mismatch** between PhonePe environment settings:

- **API Configuration**: Using sandbox/preprod environment (`https://api-preprod.phonepe.com`)
- **Frontend Widget**: Loading from production domains (`mercury.phonepe.com`, `mercury-t2.phonepe.com`)
- **CSP Errors**: Content Security Policy blocking production PhonePe resources
- **CORS Errors**: Cross-origin requests failing due to environment mismatch

## Root Cause

1. **Environment Variables**: `.env` file uses `PHONEPE_BASE_URL=https://api-preprod.phonepe.com` (sandbox)
2. **Test Credentials**: Using test merchant ID `TEST-M23NZRR115SFF_25091`
3. **Production Widget**: PhonePe checkout widget loads from production URLs
4. **CSP Mismatch**: Security policies allow production domains but API uses sandbox

## Solution Options

### Option 1: Use Full Sandbox Environment (Recommended for Development)

#### Step 1: Update Environment Variables
```bash
# In .env file
PHONEPE_BASE_URL=https://api-preprod.phonepe.com
PHONEPE_CLIENT_ID=TEST-M23NZRR115SFF_25091
PHONEPE_CLIENT_SECRET=YWRhMDk1ZjEtNzMzYi00MWVlLTg0NTEtOGEwMGYyNTBiMTI1
PHONEPE_CLIENT_VERSION=1
PHONEPE_CALLBACK_URL=http://localhost:3000/api/phonepe/callback
```

#### Step 2: Update CSP for Sandbox
Update `next.config.js` to include sandbox domains:

```javascript
// Replace production domains with sandbox domains
"script-src 'self' ... https://mercury-uat.phonepe.com https://mercury-t2-uat.phonepe.com",
"connect-src 'self' ... https://api-preprod.phonepe.com https://mercury-uat.phonepe.com",
"frame-src 'self' ... https://mercury-uat.phonepe.com https://mercury-t2-uat.phonepe.com",
```

### Option 2: Move to Production Environment

#### Step 1: Get Production Credentials
1. Complete PhonePe business verification
2. Get production merchant credentials
3. Update environment variables:

```bash
PHONEPE_BASE_URL=https://api.phonepe.com
PHONEPE_CLIENT_ID=your_production_client_id
PHONEPE_CLIENT_SECRET=your_production_client_secret
PHONEPE_CALLBACK_URL=https://bubblebeads.in/api/phonepe/callback
```

#### Step 2: Keep Current CSP (Already Configured for Production)

## Immediate Fix for Development

### Update PhonePe OAuth Client

Modify `app/lib/phonepe-oauth.ts` to handle sandbox widget URLs:

```typescript
// Add method to get widget base URL
private getWidgetBaseUrl(): string {
  const isProduction = this.config.baseUrl.includes('api.phonepe.com');
  return isProduction 
    ? 'https://mercury.phonepe.com'
    : 'https://mercury-uat.phonepe.com';
}
```

### Update CSP for Current Setup

Since you're using sandbox API, update CSP to include sandbox domains:

```javascript
// In next.config.js
const ContentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' ${isProd ? "" : "'unsafe-eval'"} https://js.stripe.com https://*.clerk.accounts.dev https://*.clerk.com https://mercury-uat.phonepe.com https://mercury-t2-uat.phonepe.com https://mercurystatic.phonepe.com https://linchpin.phonepe.com https://www.google-analytics.com https://dgq88cldibal5.cloudfront.net 'unsafe-inline'`,
  "connect-src 'self' https://hooks.slack.com https://*.clerk.accounts.dev https://*.clerk.com https://api.clerk.com https://api-preprod.phonepe.com https://mercury-uat.phonepe.com https://mercury-t2-uat.phonepe.com https://www.google-analytics.com",
  "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://mercury-uat.phonepe.com https://mercury-t2-uat.phonepe.com",
  "worker-src 'self' blob: 'unsafe-inline' https://mercury-uat.phonepe.com https://mercury-t2-uat.phonepe.com",
  // ... rest of CSP
].join("; ") + ";";
```

## Testing Steps

1. **Update Configuration**: Choose Option 1 or 2 above
2. **Clear Browser Cache**: Clear all cached data
3. **Restart Development Server**: `npm run dev`
4. **Test Payment Flow**: Create a test order
5. **Monitor Console**: Check for CSP/CORS errors
6. **Verify API Calls**: Ensure all requests go to correct environment

## Environment Verification

### Check Current Configuration
```bash
# Verify environment variables
echo $PHONEPE_BASE_URL
echo $PHONEPE_CLIENT_ID
```

### API Endpoint Mapping
- **Sandbox**: `https://api-preprod.phonepe.com`
- **Production**: `https://api.phonepe.com`

### Widget Domain Mapping
- **Sandbox**: `mercury-uat.phonepe.com`, `mercury-t2-uat.phonepe.com`
- **Production**: `mercury.phonepe.com`, `mercury-t2.phonepe.com`

## Next Steps

1. **Immediate**: Implement Option 1 for consistent sandbox environment
2. **Short-term**: Test payment flow thoroughly in sandbox
3. **Long-term**: Move to production when business verification is complete
4. **Monitoring**: Set up proper error tracking for payment failures

## Important Notes

- **Never mix environments**: Always use matching API and widget domains
- **CSP Alignment**: Ensure Content Security Policy matches your PhonePe environment
- **Callback URLs**: Must be accessible from PhonePe servers
- **HTTPS Required**: Production environment requires HTTPS callbacks

This configuration mismatch is the root cause of the 400 Bad Request and CORS errors you're experiencing.