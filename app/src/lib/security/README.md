# Security Implementation

This directory contains security utilities and configurations for the application.

## Overview

The security implementation provides:
- JWT-based authentication for admin routes
- Rate limiting for API endpoints
- Input validation using Zod schemas
- Razorpay webhook signature verification
- Security headers and Content Security Policy (CSP)
- Input sanitization

## Files

### `jwt.ts`
JWT utilities for admin authentication:
- `generateAdminToken()` - Generate JWT tokens for admin users
- `verifyAdminToken()` - Verify JWT tokens
- `requireAdminAuth()` - Middleware to require admin authentication
- `extractTokenFromRequest()` - Extract JWT from request headers or cookies
- `setAdminCookie()` - Set secure JWT cookies

### `rateLimit.ts`
Rate limiting implementation:
- `withRateLimit()` - Higher-order function to wrap API routes
- `rateLimitConfigs` - Predefined rate limit configurations
- Supports strict, moderate, and lenient rate limiting

### `validation.ts`
Zod validation schemas and utilities:
- `contactFormSchema` - Contact form validation
- `createOrderSchema` - Order creation validation
- `razorpayWebhookSchema` - Razorpay webhook validation
- `adminLoginSchema` - Admin login validation
- `validateRequest()` - Generic validation function
- `sanitizeString()` - Input sanitization

### `razorpay.ts`
Razorpay security utilities:
- `verifyRazorpaySignature()` - Verify webhook signatures
- `validateRazorpayOrder()` - Validate order ID format
- `validateRazorpayPayment()` - Validate payment ID format
- `sanitizeRazorpayPayload()` - Sanitize webhook payloads

### `config.ts`
Centralized security configuration:
- JWT settings
- Rate limiting configurations
- Password requirements
- Session security
- CORS settings
- CSP configuration
- Helper functions for security headers

## Usage Examples

### Protecting Admin Routes
```typescript
import { requireAdminAuth } from '@/src/lib/security/jwt';

export const GET = async (request: NextRequest) => {
  const authResult = requireAdminAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult; // Unauthorized response
  }
  
  // Proceed with admin logic
  const adminId = authResult.adminId;
  // ... rest of the code
};
```

### Adding Rate Limiting
```typescript
import { withRateLimit, rateLimitConfigs } from '@/src/lib/security/rateLimit';

export const POST = withRateLimit(rateLimitConfigs.strict)(async (request: NextRequest) => {
  // Your API logic here
});
```

### Validating Request Payloads
```typescript
import { validateRequest, contactFormSchema } from '@/src/lib/security/validation';

export const POST = async (request: NextRequest) => {
  const validationResult = await validateRequest(request, contactFormSchema);
  if (!validationResult.success) {
    return NextResponse.json(
      { success: false, error: validationResult.error },
      { status: 400 }
    );
  }
  
  const { name, email, subject, message } = validationResult.data;
  // ... rest of the code
};
```

### Verifying Razorpay Webhooks
```typescript
import { verifyRazorpaySignature } from '@/src/lib/security/razorpay';

const isValid = verifyRazorpaySignature(payload, process.env.RAZORPAY_WEBHOOK_SECRET);
if (!isValid) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

## Environment Variables

Required environment variables:
- `JWT_SECRET` - Secret key for JWT signing (change in production)
- `RAZORPAY_WEBHOOK_SECRET` - Secret for verifying Razorpay webhooks
- `ADMIN_PASSWORD` - Admin password hash
- `ADMIN_PASSWORD_SALT` - Salt for admin password

## Security Features

1. **JWT Authentication**: Secure token-based authentication for admin routes
2. **Rate Limiting**: Prevents API abuse and brute force attacks
3. **Input Validation**: Zod schemas ensure data integrity
4. **Signature Verification**: Razorpay webhook authenticity verification
5. **Security Headers**: XSS protection, frame options, content type options
6. **Content Security Policy**: Prevents XSS and injection attacks
7. **Input Sanitization**: Removes potentially dangerous characters
8. **Timing-Safe Comparisons**: Prevents timing attacks

## Best Practices

1. Always use the provided validation schemas
2. Apply rate limiting to all public API endpoints
3. Use JWT authentication for all admin routes
4. Sanitize all user inputs before processing
5. Verify external webhook signatures
6. Keep JWT secrets secure and unique per environment
7. Regularly rotate secrets and tokens
8. Monitor rate limiting and security events

## Testing

Test the security implementation by:
1. Attempting to access admin routes without JWT
2. Sending malformed payloads to validated endpoints
3. Testing rate limiting by making multiple rapid requests
4. Verifying security headers are present in responses
5. Testing CSP violations in browser console 