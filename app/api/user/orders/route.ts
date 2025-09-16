import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prisma";
import prismaVercel from "../../../lib/prisma-vercel";

// Use Vercel-optimized Prisma client in production
const db = process.env.VERCEL ? prismaVercel : prisma;
import { assertSameOrigin } from "../../../lib/security/origin";
import { safeLogError } from "../../../lib/security/logging";

export async function GET(request: NextRequest) {
  try {
    // Get authentication info from Clerk using standard cookie-based session
    const authResult = await auth();
    const user = await currentUser();
    
    // Fallback: if auth() doesn't return userId, try to extract from JWT
    let userId = authResult.userId;
    if (!userId) {
      const sessionCookie = request.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('__session'));
      if (sessionCookie) {
        try {
          const jwt = sessionCookie.split('=')[1];
          const payload = jwt.split('.')[1];
          const jwtPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
          userId = jwtPayload?.sub;
        } catch (e) {
          // JWT decode failed
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await db.order.findMany({
      where: {
        userId: userId,
      },
      include: {
        items: true,
      },
      orderBy: {
        orderDate: "desc",
      },
    });

    // console.log('Orders API Debug:', {
    //   userId,
    //   ordersCount: orders.length,
    //   orders: orders.map(o => ({ id: o.id, userId: o.userId, total: o.total, itemsCount: o.items.length }))
    // });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // CSRF Protection: Validate origin header
    try {
      assertSameOrigin(request);
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid Origin") {
        return NextResponse.json({ error: "Invalid Origin" }, { status: 403 });
      }
      throw error;
    }

    // Get authentication info from Clerk using standard cookie-based session
    const authResult = await auth();
    
    // Fallback: if auth() doesn't return userId, try to extract from JWT
    let userId = authResult.userId;
    if (!userId) {
      const sessionCookie = request.headers.get('cookie')?.split(';').find(c => c.trim().startsWith('__session'));
      if (sessionCookie) {
        try {
          const jwt = sessionCookie.split('=')[1];
          const payload = jwt.split('.')[1];
          const jwtPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
          userId = jwtPayload?.sub;
        } catch (e) {
          // JWT decode failed
        }
      }
    }
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    // ...existing code ...
    // Received user order request

    // Validate required fields
    if (!data.paymentId || !data.items || !data.total) {
      console.error("Missing required fields:", {
        hasPaymentId: !!data.paymentId,
        hasItems: !!data.items,
        hasTotal: !!data.total,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Ensure user exists in database (sync with Clerk)
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Use transaction to ensure atomicity and avoid prepared statement conflicts
    const result = await db.$transaction(async (tx) => {
      // First, try to find existing user
      let user = await tx.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        // Check if user exists with same email but different ID
        const existingUserByEmail = await tx.user.findUnique({
          where: { email: clerkUser.emailAddresses[0]?.emailAddress || "" }
        });

        if (existingUserByEmail) {
          // Update existing user with new Clerk ID
          user = await tx.user.update({
            where: { email: clerkUser.emailAddresses[0]?.emailAddress || "" },
            data: {
              id: userId,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
            },
          });
        } else {
          // Create new user if doesn't exist
          user = await tx.user.create({
            data: {
              id: userId,
              email: clerkUser.emailAddresses[0]?.emailAddress || "",
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
            },
          });
        }
      } else {
        // Update existing user
        user = await tx.user.update({
          where: { id: userId },
          data: {
            email: clerkUser.emailAddresses[0]?.emailAddress || "",
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
          },
        });
      }

      // Create order with user association
      const order = await tx.order.create({
          data: {
            merchantOrderId: data.merchantOrderId,
            phonePeOrderId: data.phonePeOrderId,
            paymentId: data.paymentId,
            total: data.total,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          address: data.address,
          userId: userId, // Associate with authenticated user
          items: {
            create: data.items.map((item: any) => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      return { user, order };
    });

    // Order created successfully

    return NextResponse.json({ success: true, orderId: result.order.id });
  } catch (error) {
    safeLogError("POST /api/user/orders error:", error);
    return NextResponse.json(
      {
        error: "Failed to create order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
