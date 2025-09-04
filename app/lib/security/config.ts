// Security configuration constants
export const SECURITY_CONFIG = {
  // Rate Limiting Configuration
  RATE_LIMIT: {
    STRICT: { maxRequests: 5, windowMs: 60000 },
    MODERATE: { maxRequests: 20, windowMs: 60000 },
    LENIENT: { maxRequests: 100, windowMs: 60000 },
  },

  // Password Security
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
  },

  // Session Security
  SESSION: {
    HTTP_ONLY: true,
    SECURE: process.env.NODE_ENV === "production",
    SAME_SITE: "strict" as const,
    MAX_AGE: 24 * 60 * 60, // 24 hours in seconds
  },

  // CORS Configuration
  CORS: {
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    ALLOWED_METHODS: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    ALLOWED_HEADERS: ["Content-Type", "Authorization", "X-Requested-With"],
  },

  // Content Security Policy
  CSP: {
    DEFAULT_SRC: ["'self'"],
    SCRIPT_SRC: [
      "'self'",
      "'unsafe-eval'",
      "'unsafe-inline'",
      "https://js.stripe.com",
      "https://checkout.razorpay.com",
      "https://challenges.cloudflare.com",
      "https://*.clerk.accounts.dev",
      "https://*.clerk.com",
      "https://clerk.bubblebeads.in",
    ],
    WORKER_SRC: ["'self'", "blob:"],
    STYLE_SRC: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://cdnjs.cloudflare.com",
      "https://cdn.jsdelivr.net",
    ],
    FONT_SRC: [
      "'self'",
      "https://fonts.gstatic.com",
      "https://cdnjs.cloudflare.com",
      "https://cdn.jsdelivr.net",
    ],
    IMG_SRC: ["'self'", "data:", "https:", "blob:"],
    CONNECT_SRC: [
      "'self'",
      "https://api.razorpay.com",
      "https://lumberjack.razorpay.com",
      "https://hooks.slack.com",
      "https://*.clerk.accounts.dev",
      "https://*.clerk.com",
      "https://api.clerk.com",
      "https://clerk.bubblebeads.in",
      "ws://localhost:*",
      "ws://127.0.0.1:*",
      "wss://*",
    ],
    FRAME_SRC: [
      "'self'",
      "https://checkout.razorpay.com",
      "https://api.razorpay.com",
      "https://*.clerk.accounts.dev",
      "https://*.clerk.com",
      "https://clerk.bubblebeads.in",
    ],
    OBJECT_SRC: ["'none'"],
    BASE_URI: ["'self'"],
    FORM_ACTION: ["'self'"],
    FRAME_ANCESTORS: ["'none'"],
  },
};

// Environment-specific security settings
export const getSecurityHeaders = () => ({
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security":
    process.env.NODE_ENV === "production"
      ? "max-age=31536000; includeSubDomains; preload"
      : undefined,
  "X-DNS-Prefetch-Control": "off",
  "X-Download-Options": "noopen",
  "X-Permitted-Cross-Domain-Policies": "none",
});

// Helper function to build CSP string
export const buildCSPString = (): string => {
  const csp = Object.entries(SECURITY_CONFIG.CSP)
    .map(([key, values]) => {
      // Convert UPPER_CASE to kebab-case properly
      const directive = key
        .toLowerCase() // Convert to lowercase first
        .replace(/_/g, "-"); // Replace underscores with hyphens
      return `${directive} ${values.join(" ")}`;
    })
    .join("; ");

  return csp;
};
