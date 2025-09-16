// Security configuration constants
export const SECURITY_CONFIG = {
  // JWT Configuration - removed, now using Clerk for authentication

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
  
    ],
    STYLE_SRC: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    FONT_SRC: ["'self'", "https://fonts.gstatic.com"],
    IMG_SRC: ["'self'", "data:", "https:", "blob:"],
    CONNECT_SRC: [
      "'self'",
  
      "https://hooks.slack.com",
    ],
    FRAME_SRC: ["'self'"],
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
      ? "max-age=31536000; includeSubDomains"
      : undefined,
});

// Map config keys to valid CSP directives
const CSP_DIRECTIVE_MAP: Record<string, string> = {
  DEFAULT_SRC: "default-src",
  SCRIPT_SRC: "script-src",
  STYLE_SRC: "style-src",
  FONT_SRC: "font-src",
  IMG_SRC: "img-src",
  CONNECT_SRC: "connect-src",
  FRAME_SRC: "frame-src",
  OBJECT_SRC: "object-src",
  BASE_URI: "base-uri",
  FORM_ACTION: "form-action",
  FRAME_ANCESTORS: "frame-ancestors",
};

// Helper function to build CSP string
export const buildCSPString = (): string => {
  const csp = Object.entries(SECURITY_CONFIG.CSP)
    .map(([key, values]) => {
      const directive = CSP_DIRECTIVE_MAP[key] || key.toLowerCase();
      return `${directive} ${values.join(" ")}`;
    })
    .join("; ");

  return csp;
};
