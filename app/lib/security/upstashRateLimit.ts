import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limit configurations
export const upstashRateLimitConfigs = {
  strict: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "ratelimit:strict",
  }),
  moderate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    analytics: true,
    prefix: "ratelimit:moderate",
  }),
  lenient: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    analytics: true,
    prefix: "ratelimit:lenient",
  }),
};

// Rate limit configuration type
type RateLimitType = keyof typeof upstashRateLimitConfigs;

// Higher-order function to apply Upstash rate limiting
export function withUpstashRateLimit(limitType: RateLimitType) {
  return function (handler: (request: NextRequest) => Promise<NextResponse>) {
    return async function (request: NextRequest): Promise<NextResponse> {
      try {
        const ratelimit = upstashRateLimitConfigs[limitType];

        // Get client identifier
        const clientId = getClientId(request);

        // Check rate limit
        const { success, limit, remaining, reset } =
          await ratelimit.limit(clientId);

        if (!success) {
          return NextResponse.json(
            {
              success: false,
              error: "Rate limit exceeded. Please try again later.",
              retryAfter: Math.ceil((reset - Date.now()) / 1000),
            },
            {
              status: 429,
              headers: {
                "Retry-After": Math.ceil(
                  (reset - Date.now()) / 1000,
                ).toString(),
                "X-RateLimit-Limit": limit.toString(),
                "X-RateLimit-Remaining": remaining.toString(),
                "X-RateLimit-Reset": reset.toString(),
              },
            },
          );
        }

        // Execute the handler
        const response = await handler(request);

        // Add rate limit headers to successful responses
        response.headers.set("X-RateLimit-Limit", limit.toString());
        response.headers.set("X-RateLimit-Remaining", remaining.toString());
        response.headers.set("X-RateLimit-Reset", reset.toString());

        return response;
      } catch (error) {
        // If rate limiting fails, log the error but don't block the request
        console.error("Rate limiting error:", error);
        return await handler(request);
      }
    };
  };
}

// Get client identifier for rate limiting
function getClientId(request: NextRequest): string {
  // Use IP address as primary identifier
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Add user agent for additional uniqueness
  const userAgent = request.headers.get("user-agent") || "unknown";

  return `${ip}:${userAgent}`;
}

// Export individual rate limiters for direct use
export const strictRateLimit = upstashRateLimitConfigs.strict;
export const moderateRateLimit = upstashRateLimitConfigs.moderate;
export const lenientRateLimit = upstashRateLimitConfigs.lenient;
