# PhonePe Payment Callback Setup Guide

This guide explains how to properly configure PhonePe payment callbacks to resolve the `invalid_callback` error using the **Order Status API** approach.

## Understanding PhonePe Payment Flow

PhonePe provides a simple and reliable way to check payment status:

1. **Payment Initiation**: User starts payment via PhonePe OAuth API
2. **Payment Completion**: User completes payment on PhonePe's secure page
3. **Redirect Callback**: User is redirected back to your callback URL
4. **Status Verification**: Your server checks payment status using Order Status API

## The Problem

The `invalid_callback` error occurs because:
- Missing PhonePe OAuth credentials in environment variables
- Incorrect callback URL configuration
- Network issues preventing Order Status API calls

## Solution Implementation

### 1. Simplified Callback Handler

The callback route now uses the **Order Status API** approach:
- **GET/POST requests**: Both handle redirect callbacks from PhonePe
- **Order Status Check**: Uses PhonePe's Order Status API to verify payment
- **Reliable Status**: Gets real-time payment status directly from PhonePe

### 2. Order Status API Benefits

✅ **Simple**: No complex webhook validation required  
✅ **Reliable**: Direct API call to PhonePe for current status  
✅ **Secure**: Uses OAuth authentication  
✅ **Real-time**: Always gets the latest payment status  

### 3. API Response Structure

The Order Status API returns:
- `state`: Payment status ("COMPLETED", "FAILED", "PENDING")
- `orderId`: PhonePe's internal order ID
- `amount`: Payment amount
- `paymentDetails`: Transaction details including transactionId

## Required Configuration

### Environment Variables

Add these to your `.env.local` file:

```env
# PhonePe OAuth Configuration (Required)
PHONEPE_CLIENT_ID=your_phonepe_client_id
PHONEPE_CLIENT_SECRET=your_phonepe_client_secret
PHONEPE_CLIENT_VERSION=1
PHONEPE_BASE_URL=https://api-preprod.phonepe.com
PHONEPE_CALLBACK_URL=http://localhost:3000/api/phonepe/callback

# Application URL
APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### PhonePe Dashboard Setup

#### For Production:
1. Login to [PhonePe Business Dashboard](https://business.phonepe.com/)
2. Go to **Settings** → **API Configuration**
3. Configure:
   - **Callback URL**: `https://yourdomain.com/api/phonepe/callback`
   - **Domain**: Add your production domain to whitelist
4. Get your OAuth credentials:
   - **Client ID**: Copy from dashboard
   - **Client Secret**: Copy from dashboard
5. Add credentials to your environment variables

#### For Sandbox/Testing:
1. Contact PhonePe Integration Team through dashboard
2. Click **Help** → **Integration** → **Contact Us**
3. Request sandbox OAuth credentials
4. Provide your callback URL: `http://localhost:3000/api/phonepe/callback`
5. They will provide Client ID and Client Secret for testing

## Payment Status Handling

The system handles these payment states from Order Status API:

### Payment States
- `COMPLETED`: Payment successful → Redirect to success page
- `FAILED`: Payment failed → Redirect to checkout with error
- `PENDING`: Payment in progress → Redirect to checkout with pending status

### Transaction Details
For completed payments, the system extracts:
- Transaction ID
- Payment amount
- Payment mode (UPI, Card, etc.)
- Timestamp

## Testing the Setup

### 1. Local Development

For local testing with PhonePe:

```bash
# Start your development server
npm run dev

# Your callback URL will be:
# http://localhost:3000/api/phonepe/callback
```

**Note**: PhonePe sandbox may require a public URL. For testing:

```bash
# Install ngrok for public URL
npm install -g ngrok

# Expose your local server
ngrok http 3000

# Update PHONEPE_CALLBACK_URL in .env.local
# Example: https://abc123.ngrok.io/api/phonepe/callback
```

### 2. Order Status API Validation

The system validates:
1. **OAuth Token**: Automatically managed by the client
2. **Merchant Order ID**: Must be present in callback URL
3. **API Response**: Validates response structure from PhonePe

### 3. Response Codes

- **302 Redirect**: Normal callback processing
- **500 Internal Server Error**: OAuth client initialization failed

## Payment Flow

### Updated Flow:
1. User initiates payment → PhonePe payment page
2. User completes payment → Redirected to your callback URL
3. Your server calls Order Status API → Gets real-time payment status
4. User sees success/failure page based on API response

### Key Benefits:
- **Simple**: No webhook setup required
- **Reliable**: Direct API call ensures accurate status
- **Secure**: OAuth authentication with PhonePe
- **Real-time**: Always gets the latest payment status

## Troubleshooting

### Common Issues:

1. **"PhonePe OAuth client initialization failed"**
   - Add required PhonePe credentials to `.env.local`
   - Verify `PHONEPE_CLIENT_ID` and `PHONEPE_CLIENT_SECRET` are correct

2. **"No merchantOrderId in callback"**
   - Check if PhonePe is sending the correct callback URL
   - Verify callback URL format in PhonePe dashboard

3. **"callback_error" redirect**
   - Check server logs for specific error details
   - Verify PhonePe credentials are valid
   - Ensure Order Status API is accessible

4. **Still getting "invalid_callback"**
   - Verify `.env.local` file exists with PhonePe credentials
   - Check if callback URL matches PhonePe dashboard configuration
   - Ensure your server is accessible from PhonePe

### Debug Steps:

1. Check server logs during payment:
   ```bash
   # In your terminal running the dev server
   # Look for "PhonePe callback received" or error messages
   ```

2. Test callback endpoint manually:
   ```bash
   # Test with a sample merchant order ID
   curl "http://localhost:3000/api/phonepe/callback?merchantOrderId=TEST123"
   ```

3. Verify environment variables:
   ```javascript
   console.log('PhonePe Client ID:', process.env.PHONEPE_CLIENT_ID);
   console.log('PhonePe Base URL:', process.env.PHONEPE_BASE_URL);
   console.log('Callback URL:', process.env.PHONEPE_CALLBACK_URL);
   ```

4. Check `.env.local` file exists:
   ```bash
   # Verify the file exists and contains PhonePe credentials
   cat .env.local
   ```

## Security Considerations

1. **Never expose OAuth credentials** in client-side code
2. **Use HTTPS** for all callback URLs in production
3. **Validate all API responses** before processing
4. **Log payment events** for debugging and audit trails
5. **Implement rate limiting** to prevent callback abuse
6. **Store credentials securely** in environment variables only

## Next Steps

1. **Get PhonePe OAuth credentials** from PhonePe dashboard or support
2. **Add credentials to `.env.local`** file
3. **Test payment flow** end-to-end
4. **Monitor callback logs** for any issues
5. **Set up database updates** based on payment status (optional)
6. **Configure production environment** with real credentials

## References

- [PhonePe Developer Documentation](https://developer.phonepe.com/)
- [PhonePe Order Status API](https://developer.phonepe.com/payment-gateway/website-integration/standard-checkout/api-integration/api-reference/order-status)
- [PhonePe Business Dashboard](https://business.phonepe.com/)

---

**Important**: This implementation uses PhonePe's Order Status API approach which is simpler and more reliable than webhooks. The `invalid_callback` error should be resolved once proper OAuth credentials are configured in `.env.local`.