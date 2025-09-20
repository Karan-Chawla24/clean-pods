import { NextRequest, NextResponse } from 'next/server';
import { createPhonePeOAuthClient } from '@/app/lib/phonepe-oauth';
import { safeLog, safeLogError } from '@/app/lib/security/logging';
import { saveOrder } from '@/app/lib/database';
import { prisma } from '@/app/lib/prisma';
import prismaVercel from '@/app/lib/prisma-vercel';
import { sanitizeString } from '@/app/lib/security/validation';
import { withUpstashRateLimit } from '@/app/lib/security/upstashRateLimit';

// Use Vercel-optimized Prisma client in production, standard client in development
const db = process.env.VERCEL ? prismaVercel : prisma;

// Type for stored metadata
interface OrderMetadata {
  userId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  cart: any[];
  timestamp: number;
}

// Access the global cache
declare global {
  var orderMetadataCache: Map<string, OrderMetadata> | undefined;
}

const orderMetadataCache = global.orderMetadataCache || new Map<string, OrderMetadata>();

export const GET = withUpstashRateLimit("strict")(async (request: NextRequest) => {
  return handleCallback(request);
});

export const POST = withUpstashRateLimit("strict")(async (request: NextRequest) => {
  return handleCallback(request);
});

// Handle both redirect callbacks (GET) and status checks
async function handleCallback(request: NextRequest) {
  safeLog('info', 'PhonePe callback handler started');
  
  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get('code');
  const rawState = searchParams.get('state');
  const rawMerchantOrderId = searchParams.get('merchantOrderId');
  
  // Sanitize and validate input parameters
  const code = rawCode ? sanitizeString(rawCode) : null;
  const state = rawState ? sanitizeString(rawState) : null;
  const merchantOrderId = rawMerchantOrderId ? sanitizeString(rawMerchantOrderId) : null;
  
  // Validate merchantOrderId format if present
  if (merchantOrderId && !/^[a-zA-Z0-9_-]+$/.test(merchantOrderId)) {
    safeLogError('Invalid merchantOrderId format in callback', { merchantOrderId: 'REDACTED' });
    return NextResponse.redirect(new URL('/checkout?error=invalid_callback', request.url));
  }
  
  safeLog('info', 'Processing callback parameters', { 
    hasCode: !!code, 
    hasState: !!state, 
    merchantOrderId 
  });
  
  safeLog('info', 'PhonePe callback received', {
       method: request.method,
       merchantOrderId,
       hasCode: !!code,
       hasState: !!state
     });
  
  if (!merchantOrderId) {
    safeLogError('No merchantOrderId in callback', {});
    return NextResponse.redirect(new URL('/checkout?error=invalid_callback', request.url));
  }

  try {
    safeLog('info', 'Checking order status and redirect', { merchantOrderId });
    const result = await checkOrderStatusAndRedirect(merchantOrderId, request);
    safeLog('info', 'Order status check completed successfully', { merchantOrderId });
    return result;
  } catch (error) {
    safeLogError('Error in PhonePe callback', error);
    return NextResponse.redirect(new URL('/checkout?error=callback_error', request.url));
  }
}

// Save order to database using data from PhonePe order status
async function saveOrderToDatabase({
  merchantOrderId,
  phonePeOrderId,
  transactionId,
  amount,
  paymentDetails
}: {
  merchantOrderId: string;
  phonePeOrderId: string;
  transactionId: string;
  amount: number;
  paymentDetails: any;
}) {
  safeLog('info', 'Starting saveOrderToDatabase', { merchantOrderId });
  
  try {
    // Extract customer info and cart from PhonePe metaInfo
    const metaInfo = paymentDetails.metaInfo || {};
    safeLog('info', 'Processing payment callback', { 
      hasMetaInfo: !!metaInfo,
      hasUserId: !!metaInfo.userId,
      hasAddress: !!metaInfo.address 
    });
    
    // Try to get stored order metadata if metaInfo is incomplete
    global.orderMetadataCache = global.orderMetadataCache || new Map();
    const storedMetadata = global.orderMetadataCache.get(merchantOrderId);
    safeLog('info', 'Checking stored metadata', { hasStoredMetadata: !!storedMetadata });
    
    if (storedMetadata) {
      safeLog('info', 'Using stored metadata for order', {
        hasUserId: !!storedMetadata.userId,
        hasCustomerInfo: !!storedMetadata.customerInfo,
        hasCart: !!storedMetadata.cart,
        merchantOrderId
      });
    }
    
    // Use metaInfo first, fallback to stored metadata
    const customerName = metaInfo.udf1 || storedMetadata?.customerInfo?.name || 'Unknown Customer';
    const customerEmail = metaInfo.udf2 || storedMetadata?.customerInfo?.email || '';
    const customerPhone = metaInfo.udf3 || storedMetadata?.customerInfo?.phone || '';
    const cartItemsJson = metaInfo.udf4 || (storedMetadata?.cart ? JSON.stringify(storedMetadata.cart.slice(0, 3)) : '[]');
    const itemsCount = metaInfo.udf5 || (storedMetadata?.cart ? `items:${storedMetadata.cart.length}` : 'items:0');
    
    safeLog('info', 'Extracted order fields', {
      hasCustomerName: !!customerName,
      hasCustomerEmail: !!customerEmail,
      hasCustomerPhone: !!customerPhone,
      hasCartItems: !!cartItemsJson,
      itemsCount,
      merchantOrderId
    });
    
    let cartItems = [];
    try {
      cartItems = JSON.parse(cartItemsJson);
      safeLog('info', 'Parsed cart items successfully', { 
        itemCount: cartItems.length,
        merchantOrderId 
      });
    } catch (e) {
      safeLogError('Failed to parse cart items from metaInfo', { 
        hasCartItemsJson: !!cartItemsJson,
        error: e instanceof Error ? e.message : 'Unknown error',
        merchantOrderId 
      });
    }

    // Get userId from metaInfo or stored metadata
    const userId = metaInfo.userId || storedMetadata?.userId;
    safeLog('info', 'Processing order for user', { 
      hasUserId: !!userId,
      merchantOrderId 
    });
    
    // If userId is available, create/update user in database first
    let validUserId = undefined;
    if (userId) {
      try {
        // Import required modules for user creation
        const { prisma } = await import('@/app/lib/prisma');
        const prismaVercel = await import('@/app/lib/prisma-vercel');
        const db = process.env.VERCEL ? prismaVercel.default : prisma;
        
        // Try to find existing user
        let user = await db.user.findUnique({
          where: { id: userId }
        });
        
        if (!user) {
          // Check if user exists with same email but different ID
          const existingUserByEmail = await db.user.findUnique({
            where: { email: customerEmail }
          });
          
          if (existingUserByEmail) {
            // Update existing user with new Clerk ID
            user = await db.user.update({
              where: { email: customerEmail },
              data: {
                id: metaInfo.userId,
                name: customerName,
              },
            });
          } else {
            // Create new user
            user = await db.user.create({
              data: {
                id: metaInfo.userId,
                email: customerEmail,
                name: customerName,
              },
            });
          }
        }
        
        validUserId = user.id;
        safeLog('info', 'User created/updated for PhonePe order', {
          userId: validUserId,
          customerName,
          customerEmail
        });
      } catch (error) {
        safeLogError('Failed to create/update user for PhonePe order', {
          error,
          userId: metaInfo.userId,
          customerEmail
        });
        // Continue without userId if user creation fails
      }
    }

    // Prepare order data for database
    const orderData = {
      merchantOrderId,
      phonePeOrderId,
      transactionId,
      paymentId: transactionId, // Use transactionId as paymentId for compatibility
      total: amount / 100, // Convert from paise to rupees
      customerName,
      customerEmail,
      customerPhone,
      address: metaInfo.address || storedMetadata?.customerInfo?.address || 'Address not provided', // Add address from metaInfo, stored metadata, or default
      userId: validUserId, // Use the validated userId
      items: cartItems.length > 0 ? cartItems : [
        {
          name: 'PhonePe Order',
          price: amount / 100,
          quantity: 1
        }
      ]
    };

    // Save order to database
    safeLog('info', 'Saving order to database', { 
      merchantOrderId,
      hasOrderData: !!orderData,
      itemCount: orderData.items?.length || 0
    });
    const savedOrder = await saveOrder(orderData);
    safeLog('info', 'Order saved successfully', { 
      orderId: savedOrder.id,
      merchantOrderId 
    });
    
    safeLog('info', 'Order saved to database successfully', {
      orderId: savedOrder.id,
      merchantOrderId,
      phonePeOrderId,
      transactionId
    });
    
    return savedOrder;
  } catch (error) {
    safeLogError('Failed to save order to database', {
      error,
      merchantOrderId,
      phonePeOrderId,
      transactionId
    });
    throw error;
  }
}

// Check order status via PhonePe Order Status API and redirect accordingly
async function checkOrderStatusAndRedirect(merchantOrderId: string, request: NextRequest | string) {
  safeLog('info', 'Starting order status check', { merchantOrderId });
  
  const baseUrl = typeof request === 'string' ? request : (process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://bubblebeads.in'
    : 'http://localhost:3000');
  safeLog('info', 'Using base URL for redirects', { 
    baseUrl: baseUrl.replace(/\/+$/, ''),
    merchantOrderId 
  });
    
  try {
    // Initialize PhonePe OAuth client
    safeLog('info', 'Initializing PhonePe OAuth client', { merchantOrderId });
    let phonePeClient;
    try {
      phonePeClient = createPhonePeOAuthClient();
    } catch (error) {
      safeLogError("PhonePe OAuth client initialization failed in callback", error);
      return NextResponse.redirect(new URL("/checkout?error=system_error", baseUrl));
    }

    // Check order status using OAuth API
    safeLog('info', 'Checking order status with PhonePe', { merchantOrderId });
    const orderStatus = await phonePeClient.getOrderStatus(merchantOrderId, true);
    safeLog('info', 'Order status received', { 
      merchantOrderId,
      state: orderStatus.state,
      hasOrderId: !!orderStatus.orderId,
      hasAmount: !!orderStatus.amount
    });

    const isPaymentSuccessful = orderStatus.state === 'COMPLETED';
    const isPaymentPending = orderStatus.state === 'PENDING';
    const isPaymentFailed = orderStatus.state === 'FAILED';

    if (isPaymentSuccessful) {
      safeLog('info', 'Payment successful, processing order', { merchantOrderId });
      
      // Extract transaction ID for successful payments
      const transactionId = phonePeClient.extractTransactionId(orderStatus) || `txn_${merchantOrderId}_${Date.now()}`;
      
      safeLog("info", "PhonePe OAuth payment successful", {
        merchantOrderId,
        phonePeOrderId: orderStatus.orderId,
        transactionId,
        state: orderStatus.state,
        amount: orderStatus.amount
      });

      // Save order to database after successful payment
      safeLog('info', 'Attempting to save order to database', { merchantOrderId });
      try {
        await saveOrderToDatabase({
          merchantOrderId,
          phonePeOrderId: orderStatus.orderId,
          transactionId,
          amount: orderStatus.amount,
          paymentDetails: orderStatus
        });
        safeLog('info', 'Order saved successfully', { merchantOrderId });
        
        // Clean up stored metadata after successful processing
        if (orderMetadataCache.has(merchantOrderId)) {
          orderMetadataCache.delete(merchantOrderId);
          safeLog('info', 'Cleaned up stored metadata', { merchantOrderId });
        }
      } catch (error) {
        safeLogError("Failed to save order to database", {
          error,
          merchantOrderId,
          phonePeOrderId: orderStatus.orderId,
          transactionId
        });
        // Continue with redirect even if database save fails
      }

      // Redirect to success page with order details
      const successUrl = new URL(`/order-success?order_id=${merchantOrderId}&transactionId=${transactionId}&phonePeOrderId=${orderStatus.orderId}`, baseUrl);
      safeLog('info', 'Redirecting to success page', { 
        merchantOrderId,
        hasTransactionId: !!transactionId,
        hasPhonePeOrderId: !!orderStatus.orderId
      });
      return NextResponse.redirect(successUrl);
    } else if (isPaymentPending) {
      safeLog('info', 'Payment is still pending', { merchantOrderId });
      safeLog("info", "PhonePe OAuth payment pending", {
        merchantOrderId,
        phonePeOrderId: orderStatus.orderId,
        state: orderStatus.state
      });

      // Redirect back to checkout with pending status
      return NextResponse.redirect(
        new URL(`/checkout?status=pending&orderId=${merchantOrderId}&message=Payment is still pending. Please complete the payment.`, baseUrl)
      );
    } else {
      safeLog('warn', 'Payment failed or cancelled', { 
      });
      safeLogError("PhonePe OAuth payment failed", {
        merchantOrderId,
        phonePeOrderId: orderStatus.orderId,
        state: orderStatus.state,
        hasOrderStatus: !!orderStatus
      });

      // Redirect to checkout with error
      return NextResponse.redirect(
        new URL(`/checkout?error=payment_failed&orderId=${merchantOrderId}`, baseUrl)
      );
    }

  } catch (error) {
    safeLogError("PhonePe OAuth callback processing error", error);
    return NextResponse.redirect(new URL("/checkout?error=callback_error", baseUrl));
  }
}
