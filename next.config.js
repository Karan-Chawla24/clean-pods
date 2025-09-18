/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@prisma/client"],

  async headers() {
    const isProd = process.env.NODE_ENV === "production";

    const ContentSecurityPolicy = [
      "default-src 'self'",
      `script-src 'self' ${isProd ? "" : "'unsafe-eval'"} https://js.stripe.com https://*.clerk.accounts.dev https://*.clerk.com https://*.phonepe.com https://mercury.phonepe.com https://mercury-t2.phonepe.com https://mercurystatic.phonepe.com https://linchpin.phonepe.com https://www.google-analytics.com https://dgq88cldibal5.cloudfront.net`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://hooks.slack.com https://*.clerk.accounts.dev https://*.clerk.com https://api.clerk.com https://api.phonepe.com https://api-preprod.phonepe.com https://mercury.phonepe.com https://mercury-t2.phonepe.com https://sentry.phonepe.com https://mercurystatic.phonepe.com https://linchpin.phonepe.com https://www.google-analytics.com",
      "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://*.phonepe.com https://mercury.phonepe.com https://mercury-t2.phonepe.com",
      "worker-src 'self' blob: https://mercury.phonepe.com https://mercury-t2.phonepe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join("; ") + ";"

    const headers = [
      { key: "Content-Security-Policy", value: ContentSecurityPolicy },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-site" },
    ];

    if (isProd) {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/(.*)",
        headers,
      },
    ];
  },

  webpack: (config) => {
    config.externals.push({
      "utf-8-validate": "commonjs utf-8-validate",
      bufferutil: "commonjs bufferutil",
    });
    return config;
  },
};

module.exports = nextConfig;
