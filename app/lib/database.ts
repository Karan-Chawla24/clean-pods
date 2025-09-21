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
  // Enhanced payment details for all payment methods
  paymentMode?: string; // UPI_QR, CARD, WALLET, NET_BANKING, etc.
  paymentTransactionId?: string; // UPI Transaction ID, Card Transaction ID, Wallet Transaction ID, etc.
  utr?: string; // Unique Transaction Reference (for UPI/Bank transfers)
  feeAmount?: number; // Transaction fee charged
  payableAmount?: number; // Amount actually paid (may differ from total due to offers)
  bankName?: string; // Bank name for UPI/Card payments
  accountType?: string; // SAVINGS, CURRENT, CREDIT_CARD, etc.
  cardLast4?: string; // Last 4 digits of card (for card payments)
  paymentState?: string; // COMPLETED, PENDING, FAILED
  paymentTimestamp?: Date; // When payment was actually processed
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
          // Enhanced payment details
          paymentMode: orderData.paymentMode,
          paymentTransactionId: orderData.paymentTransactionId,
          utr: orderData.utr,
          feeAmount: orderData.feeAmount,
          payableAmount: orderData.payableAmount,
          bankName: orderData.bankName,
          accountType: orderData.accountType,
          cardLast4: orderData.cardLast4,
          paymentState: orderData.paymentState || 'COMPLETED',
          paymentTimestamp: orderData.paymentTimestamp,
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
    return await db.order.findMany({
      include: { items: true },
      orderBy: { orderDate: "desc" },
    });
  });
}

export async function updateOrderPaymentDetails(merchantOrderId: string, paymentDetails: {
  paymentMode?: string;
  paymentTransactionId?: string;
  utr?: string;
  feeAmount?: number;
  payableAmount?: number;
  bankName?: string;
  accountType?: string;
  cardLast4?: string;
  paymentState?: string;
  paymentTimestamp?: Date;
}) {
  return retryDatabaseOperation(async () => {
    const { safeLog } = await import("./security/logging");
    safeLog('info', 'updateOrderPaymentDetails function called', {
      merchantOrderId,
      paymentMode: paymentDetails.paymentMode,
      paymentTransactionId: paymentDetails.paymentTransactionId
    });

    // First, try to find the order to see if it exists
    const existingOrder = await db.order.findUnique({
      where: { merchantOrderId },
      include: { items: true }
    });

    if (!existingOrder) {
      // Order doesn't exist yet - this is a race condition
      // Wait a bit and try again (webhook arrived before order was saved)
      safeLog('warn', 'Order not found for webhook update, retrying...', {
        merchantOrderId,
        retryReason: 'Race condition - webhook arrived before order creation'
      });
      
      // Wait 2 seconds and try again
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const retryOrder = await db.order.findUnique({
        where: { merchantOrderId },
        include: { items: true }
      });
      
      if (!retryOrder) {
        // Still not found - log error but don't throw (webhook will retry)
        safeLogError('Order still not found after retry', {
          merchantOrderId,
          paymentDetails,
          suggestion: 'Order may not have been created yet or merchantOrderId mismatch'
        });
        return null;
      }
    }

    // Order exists, proceed with update
    return await db.order.update({
      where: { merchantOrderId },
      data: {
        paymentMode: paymentDetails.paymentMode,
        paymentTransactionId: paymentDetails.paymentTransactionId,
        utr: paymentDetails.utr,
        feeAmount: paymentDetails.feeAmount,
        payableAmount: paymentDetails.payableAmount,
        bankName: paymentDetails.bankName,
        accountType: paymentDetails.accountType,
        cardLast4: paymentDetails.cardLast4,
        paymentState: paymentDetails.paymentState,
        paymentTimestamp: paymentDetails.paymentTimestamp,
      },
      include: { items: true },
    });
  });
}
