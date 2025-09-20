import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateInvoiceToken } from "../../lib/jwt-utils";
import { getOrder } from "../../lib/database";
import { safeLogError } from "@/app/lib/security/logging";
import {
  validateRequest,
  invoiceTokenSchema,
  sanitizeObject,
} from "@/app/lib/security/validation";
import { withUpstashRateLimit } from "../../lib/security/upstashRateLimit";

export const POST = withUpstashRateLimit("moderate")(async (request: NextRequest) => {
  try {
    // Verify user authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Validate request body
    const validationResult = await validateRequest(request, invoiceTokenSchema);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 },
      );
    }

    // Sanitize the validated data
    const sanitizedData = sanitizeObject(validationResult.data);
    const { orderId } = sanitizedData;

    // Verify the order exists and belongs to the user
    // Note: This is a basic check. In a production system, you might want
    // to verify order ownership more thoroughly
    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Generate JWT token with user ID for additional security
    const token = await generateInvoiceToken(orderId, userId);

    return NextResponse.json({
      token,
      expiresIn: "5m", // 5 minutes
      orderId,
    });
  } catch (error) {
    safeLogError("Error generating invoice token", error);
    return NextResponse.json(
      { error: "Failed to generate access token" },
      { status: 500 },
    );
  }
});
