import { NextRequest, NextResponse } from "next/server";
import { getProductById, getAllProducts } from "@/app/lib/products";
import { safeLogError } from "@/app/lib/security/logging";
import { sanitizeString } from "@/app/lib/security/validation";
import { withUpstashRateLimit } from "@/app/lib/security/upstashRateLimit";

export const GET = withUpstashRateLimit("moderate")(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const rawProductId = searchParams.get("id");

    // If specific product requested
    if (rawProductId) {
      // Validate and sanitize product ID
      const productId = sanitizeString(rawProductId);
      
      // Additional validation for product ID format
      if (!/^[a-zA-Z0-9_-]+$/.test(productId)) {
        return NextResponse.json(
          { error: "Invalid product ID format" },
          { status: 400 },
        );
      }

      const product = getProductById(productId);
      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ product });
    }

    // Return all products
    return NextResponse.json({ products: getAllProducts() });
  } catch (error) {
    safeLogError("Error fetching products", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
