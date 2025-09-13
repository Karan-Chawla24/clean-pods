# Security Implementation

This directory contains security utilities and configurations for the application.

## Overview

The security implementation provides:

- Clerk-based authentication for admin routes
- Rate limiting for API endpoints
- Input validation using Zod schemas
- Razorpay webhook signature verification
- Security headers and Content Security Policy (CSP)
- Input sanitization

## Files

### `clerk-admin.ts`

Authentication utilities:

- `requireClerkAdminAuth()` - Middleware to require admin authentication via Clerk
- `grantAdminRole()` - Grant admin role to a user
- `revokeAdminRole()` - Remove admin role from a user
- `getAdminUsers()` - Get all users with admin role
- Authentication is handled through Clerk with role-based access control

### `upstashRateLimit.ts`

Upstash Redis-based rate limiting implementation:

- `withUpstashRateLimit()` - Higher-order function to wrap API routes
- `upstashRateLimitConfigs` - Predefined rate limit configurations using Upstash Redis
- Supports strict, moderate, and lenient rate limiting with sliding window algorithm
- Provides analytics and distributed rate limiting across multiple instances

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
- `validateRazorpayPayment()` - Validate Transaction ID format
- `sanitizeRazorpayPayload()` - Sanitize webhook payloads

### `config.ts`

Centralized security configuration:

- Security configurations
- Rate limiting configurations
- Password requirements
- Session security
- CORS settings
- CSP configuration
- Helper functions for security headers

## Usage Examples

### Protecting Admin Routes

```typescript
import { requireClerkAdminAuth } from "@/lib/clerk-admin";

export const GET = async (request: NextRequest) => {
  try {
    await requireClerkAdminAuth();
    // User is authenticated as admin
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Proceed with admin logic
  // ... rest of the code
};
```

### Adding Rate Limiting

```typescript
import { withUpstashRateLimit } from "@/lib/security/upstashRateLimit";

export const POST = withUpstashRateLimit("strict")(async (
  request: NextRequest,
) => {
  // Your API logic here
});
```

### Validating Request Payloads

```typescript
import {
  validateRequest,
  contactFormSchema,
} from "@/src/lib/security/validation";

export const POST = async (request: NextRequest) => {
  const validationResult = await validateRequest(request, contactFormSchema);
  if (!validationResult.success) {
    return NextResponse.json(
      { success: false, error: validationResult.error },
      { status: 400 },
    );
  }

  const { name, email, subject, message } = validationResult.data;
  // ... rest of the code
};
```

### Verifying Razorpay Webhooks

```typescript
import { verifyRazorpaySignature } from "@/src/lib/security/razorpay";

const isValid = verifyRazorpaySignature(
  payload,
  process.env.RAZORPAY_WEBHOOK_SECRET,
);
if (!isValid) {
  return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
}
```

## Environment Variables

Required environment variables:

- `RAZORPAY_WEBHOOK_SECRET` - Secret for verifying Razorpay webhooks
- Clerk environment variables for authentication (see Clerk documentation)

## Security Features

1. **Clerk Authentication**: Secure authentication for admin routes with role-based access control
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
3. Use Clerk authentication for all admin routes
4. Sanitize all user inputs before processing
5. Verify external webhook signatures
6. Configure Clerk properly for your environment
7. Regularly review user roles and permissions
8. Monitor rate limiting and security events

## Testing

Test the security implementation by:

1. Attempting to access admin routes without proper Clerk authentication
2. Sending malformed payloads to validated endpoints
3. Testing rate limiting by making multiple rapid requests
4. Verifying security headers are present in responses
5. Testing CSP violations in browser console
