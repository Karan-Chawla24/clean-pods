import { prisma } from "./prisma";
import prismaVercel from "./prisma-vercel";
import { safeLogError } from "./security/logging";

// Use Vercel-optimized Prisma client in production, standard client in development
const db = process.env.VERCEL ? prismaVercel : prisma;

export async function saveOrder(orderData: {
  merchantOrderId?: string;
  phonePeOrderId?: string;
  transactionId?: string;
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
  const { safeLog } = await import("./security/logging");
  safeLog('info', 'saveOrder function called with data', {
    hasUserId: !!orderData.userId,
    hasAddress: !!orderData.address,
    userId: orderData.userId,
    address: orderData.address,
    merchantOrderId: orderData.merchantOrderId
  });

  return retryDatabaseOperation(async () => {
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

      // Check if user exists before associating
      let validUserId = null;
      if (orderData.userId) {
        try {
          const userExists = await db.user.findUnique({
            where: { id: orderData.userId }
          });
          if (userExists) {
            validUserId = orderData.userId;
          }
        } catch (error) {
          // User doesn't exist, proceed without userId
          safeLogError("User not found for order, proceeding without userId", { userId: orderData.userId });
        }
      }

      const order = await db.order.create({
        data: {
          merchantOrderId: orderData.merchantOrderId,
          phonePeOrderId: orderData.phonePeOrderId,
          transactionId: orderData.transactionId,
          paymentId: orderData.paymentId,
          customerName,
          customerEmail,
          customerPhone,
          address,
          total: orderData.total,
          userId: validUserId, // Only associate if user exists
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
      return order;
    } catch (error) {
      safeLogError("Error in saveOrder", error);
      throw error;
    }
  });
}

// Retry function for database operations
async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isConnectionError = 
        error?.code === '26000' || // Prepared statement error
        error?.message?.includes('prepared statement') ||
        error?.message?.includes('connection') ||
        error?.message?.includes('timeout');
      
      if (isConnectionError && attempt < maxRetries) {
        safeLogError(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying...`, error);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        continue;
      }
      
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function getOrder(orderId: string) {
  return retryDatabaseOperation(async () => {
    // First try to find by merchantOrderId, then by id
    let order = await db.order.findUnique({
      where: { merchantOrderId: orderId },
      include: { items: true },
    });
    
    // If not found by merchantOrderId, try by id
    if (!order) {
      order = await db.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
    }
    
    return order;
  });
}

export async function getAllOrders() {
  return retryDatabaseOperation(async () => {
    return db.order.findMany({
      include: { items: true },
      orderBy: { orderDate: "desc" },
    });
  });
}
