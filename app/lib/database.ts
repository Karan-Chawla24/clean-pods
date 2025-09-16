import { prisma } from "./prisma";
import prismaVercel from "./prisma-vercel";
import { safeLogError } from "./security/logging";

// Use Vercel-optimized Prisma client in production, standard client in development
const db = process.env.VERCEL ? prismaVercel : prisma;

export async function saveOrder(orderData: {
  merchantOrderId?: string;
  phonePeOrderId?: string;
  paymentId: string;
  customer?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  address?: string;
  userId?: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
}) {
  // saveOrder invoked

  try {
    // Handle both legacy format (with customer object) and new format (with direct fields)
    const customerName =
      orderData.customerName ||
      (orderData.customer
        ? `${orderData.customer.firstName} ${orderData.customer.lastName}`
        : "");
    const customerEmail =
      orderData.customerEmail || orderData.customer?.email || "";
    const customerPhone =
      orderData.customerPhone || orderData.customer?.phone || "";
    const address =
      orderData.address ||
      (orderData.customer
        ? `${orderData.customer.address}, ${orderData.customer.city}, ${orderData.customer.state} ${orderData.customer.pincode}`
        : "");

    const order = await db.order.create({
        data: {
          merchantOrderId: orderData.merchantOrderId,
          phonePeOrderId: orderData.phonePeOrderId,
          paymentId: orderData.paymentId,
          customerName,
        customerEmail,
        customerPhone,
        address,
        total: orderData.total,
        userId: orderData.userId, // Associate with user if provided
        items: {
          create: orderData.items.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    // Order created
    return order.id;
  } catch (error) {
    safeLogError("Error in saveOrder", error);
    throw error;
  }
}

export async function getOrder(orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
}

export async function getAllOrders() {
  return db.order.findMany({
    include: { items: true },
    orderBy: { orderDate: "desc" },
  });
}
