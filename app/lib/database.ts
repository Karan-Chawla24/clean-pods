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
  safeLog('info', 'saveOrder function called', {
    hasUserId: !!orderData.userId,
    hasAddress: !!orderData.address,
    hasCustomerData: !!(orderData.customerName || orderData.customer),
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

// Create a pending order before payment initiation to prevent race conditions
export async function createPendingOrder(orderData: {
  merchantOrderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  userId?: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
}) {
  const { safeLog } = await import("./security/logging");
  safeLog('info', 'Creating pending order before payment', {
    merchantOrderId: orderData.merchantOrderId,
    hasUserId: !!orderData.userId,
    itemCount: orderData.items.length,
    total: orderData.total
  });

  return retryDatabaseOperation(async () => {
    try {
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
          safeLogError("User not found for pending order, proceeding without userId", { userId: orderData.userId });
        }
      }

      const order = await db.order.create({
        data: {
          merchantOrderId: orderData.merchantOrderId,
          phonePeOrderId: null, // Will be updated after payment
          transactionId: null, // Will be updated after payment
          paymentId: `pending_${orderData.merchantOrderId}`, // Temporary payment ID
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          address: orderData.address,
          total: orderData.total,
          userId: validUserId,
          paymentState: 'PENDING', // Mark as pending
          items: {
            create: orderData.items.map((item) => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      safeLog('info', 'Pending order created successfully', {
        orderId: order.id,
        merchantOrderId: order.merchantOrderId,
        paymentState: order.paymentState,
        itemCount: order.items.length
      });

      return order;
    } catch (error) {
      safeLogError("Failed to create pending order", {
        error,
        merchantOrderId: orderData.merchantOrderId
      });
      throw error;
    }
  });
}

// Update a pending order with PhonePe transaction details after payment
export async function updatePendingOrderWithPayment(merchantOrderId: string, paymentData: {
  phonePeOrderId: string;
  transactionId: string;
  paymentState: string;
}) {
  const { safeLog } = await import("./security/logging");
  safeLog('info', 'Updating pending order with payment details', {
    merchantOrderId,
    phonePeOrderId: paymentData.phonePeOrderId,
    paymentState: paymentData.paymentState
  });

  return retryDatabaseOperation(async () => {
    const existingOrder = await db.order.findUnique({
      where: { merchantOrderId },
      include: { items: true }
    });

    if (!existingOrder) {
      safeLogError('Pending order not found for payment update', {
        merchantOrderId,
        paymentData
      });
      return null;
    }

    if (existingOrder.paymentState !== 'PENDING') {
      safeLog('warn', 'Order is not in pending state', {
        merchantOrderId,
        currentState: existingOrder.paymentState,
        newState: paymentData.paymentState
      });
    }

    // Update the pending order with payment details
    return await db.order.update({
      where: { merchantOrderId },
      data: {
        phonePeOrderId: paymentData.phonePeOrderId,
        transactionId: paymentData.transactionId,
        paymentId: paymentData.transactionId, // Update from temporary payment ID
        paymentState: paymentData.paymentState,
      },
      include: { items: true },
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
  const { safeLog } = await import("./security/logging");
  safeLog('info', 'Updating order payment details', {
    merchantOrderId,
    hasPaymentMode: !!paymentDetails.paymentMode,
    hasUtr: !!paymentDetails.utr,
    hasBankName: !!paymentDetails.bankName
  });

  return retryDatabaseOperation(async () => {
    // Since we now create pending orders BEFORE payment initiation,
    // the order should always exist when webhook arrives
    const existingOrder = await db.order.findUnique({
      where: { merchantOrderId },
      include: { items: true }
    });

    if (!existingOrder) {
      // This should rarely happen now with the new flow
      safeLogError('Order not found for webhook update - this should not happen with pending order flow', {
        merchantOrderId,
        paymentDetails,
        suggestion: 'Check if pending order creation is working properly'
      });
      return null;
    }

    safeLog('info', 'Order found, updating payment details', {
      merchantOrderId,
      currentPaymentState: existingOrder.paymentState,
      newPaymentState: paymentDetails.paymentState
    });

    // Order exists, update it with payment details
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
