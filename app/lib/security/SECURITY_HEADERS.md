# HTTP Security Headers Implementation

This document outlines the HTTP security headers and secure cookie configurations implemented in this application.

## Implemented Security Headers

### Content Security Policy (CSP)

- **Purpose**: Prevents XSS attacks by controlling which resources can be loaded
- **Configuration**: Defined in `config.ts` with specific allowlists for scripts, styles, images, etc.
- **Key Features**:
  - Allows self-hosted resources
  - Permits necessary third-party services (Razorpay, Stripe, Google Fonts)
  - Blocks inline scripts and styles (with exceptions for necessary functionality)
  - Prevents object embedding and frame ancestors

### HTTP Strict Transport Security (HSTS)

- **Purpose**: Forces HTTPS connections and prevents protocol downgrade attacks
- **Configuration**: `max-age=31536000; includeSubDomains; preload`
- **Features**:
  - 1-year cache duration
  - Applies to all subdomains
  - Eligible for browser preload lists
  - Only enabled in production

### X-Frame-Options

- **Purpose**: Prevents clickjacking attacks
- **Value**: `DENY`
- **Effect**: Completely prevents the page from being embedded in frames

### X-Content-Type-Options

- **Purpose**: Prevents MIME type sniffing
- **Value**: `nosniff`
- **Effect**: Forces browsers to respect declared content types

### X-XSS-Protection

- **Purpose**: Enables browser XSS filtering
- **Value**: `1; mode=block`
- **Effect**: Blocks pages when XSS attacks are detected

### Referrer-Policy

- **Purpose**: Controls referrer information sent with requests
- **Value**: `strict-origin-when-cross-origin`
- **Effect**: Sends full URL for same-origin, origin only for cross-origin HTTPS, nothing for HTTP

### Permissions-Policy

- **Purpose**: Controls browser feature access
- **Value**: `camera=(), microphone=(), geolocation=()`
- **Effect**: Disables camera, microphone, and geolocation access

### Additional Security Headers

- **X-DNS-Prefetch-Control**: `off` - Disables DNS prefetching
- **X-Download-Options**: `noopen` - Prevents file execution in IE
- **X-Permitted-Cross-Domain-Policies**: `none` - Disables Flash/PDF cross-domain policies

## Secure Cookie Configuration

### Cookie Attributes

All cookies are configured with the following security attributes:

#### HttpOnly

- **Purpose**: Prevents JavaScript access to cookies
- **Implementation**: Set to `true` for all session cookies
- **Protection**: Mitigates XSS cookie theft

#### Secure

- **Purpose**: Ensures cookies are only sent over HTTPS
- **Implementation**: Enabled in production environments
- **Protection**: Prevents cookie interception over HTTP

#### SameSite

- **Purpose**: Controls cross-site cookie sending
- **Value**: `strict`
- **Protection**: Prevents CSRF attacks by blocking cross-site cookie transmission

#### Additional Attributes

- **Max-Age**: 24 hours (86400 seconds)
- **Path**: `/` (application-wide)
- **Domain**: Not set (defaults to current domain)

## Implementation Details

### Middleware Integration

Security headers are applied through Next.js middleware (`middleware.ts`):

- Headers are set on all responses
- CSP is dynamically built from configuration
- HSTS is conditionally applied based on environment

### Next.js Configuration

Additional headers are configured in `next.config.js`:

- Provides fallback header implementation
- Ensures headers are applied even if middleware is bypassed

### Cookie Utilities

Secure cookie handling is provided through `cookies.ts`:

- `getSecureCookieOptions()`: Returns secure cookie configuration
- `setSecureCookie()`: Helper for setting secure cookies in API routes
- `clearSecureCookie()`: Secure cookie removal
- `validateCookieSecurity()`: Cookie security validation
- `auditCookieSecurity()`: Security audit for existing cookies

## Usage Examples

### Setting Secure Cookies in API Routes

```typescript
import { setSecureCookie } from "@/lib/security/cookies";

export async function POST(request: Request) {
  const response = new Response(JSON.stringify({ success: true }));

  // Set a secure session cookie
  setSecureCookie(response, "session_token", "abc123", {
    maxAge: 3600, // 1 hour
  });

  return response;
}
```

### Custom CSP for Specific Routes

```typescript
import { buildCSPString } from "@/lib/security/config";

// In API route or page component
const customCSP = buildCSPString();
response.headers.set("Content-Security-Policy", customCSP);
```

## Security Considerations

### Environment-Specific Settings

- HSTS is only enabled in production to avoid development issues
- Secure cookie flag follows the same pattern
- CSP allows `unsafe-eval` and `unsafe-inline` for development compatibility

### Third-Party Integrations

- Razorpay and Stripe domains are allowlisted in CSP
- Google Fonts are permitted for typography
- Slack webhooks are allowed for notifications

### Monitoring and Maintenance

- Regular security header audits should be performed
- CSP violations should be monitored (consider adding report-uri)
- Cookie security should be validated in production

## Testing Security Headers

Use these tools to verify implementation:

- [Security Headers](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- Browser developer tools Network tab
- `curl -I` commands to inspect headers

## Compliance

This implementation helps meet:

- OWASP Top 10 security recommendations
- PCI DSS requirements for secure applications
- GDPR technical safeguards
- Industry best practices for web application security
