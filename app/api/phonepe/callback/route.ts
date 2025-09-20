import { NextRequest, NextResponse } from 'next/server';
import { createPhonePeOAuthClient } from '@/app/lib/phonepe-oauth';
import { safeLog, safeLogError } from '@/app/lib/security/logging';
import { saveOrder } from '@/app/lib/database';
import { prisma } from '@/app/lib/prisma';
import prismaVercel from '@/app/lib/prisma-vercel';

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

export async function GET(request: NextRequest) {
  return handleCallback(request);
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}

// Handle both redirect callbacks (GET) and status checks
async function handleCallback(request: NextRequest) {
  console.log('🚀 CALLBACK DEBUG: PhonePe callback handler started');
  
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const merchantOrderId = searchParams.get('merchantOrderId');
  
  console.log('🚀 CALLBACK DEBUG: Callback parameters:', { code, state, merchantOrderId });
  console.log('🚀 CALLBACK DEBUG: Full URL:', request.url);
  console.log('🚀 CALLBACK DEBUG: All search params:', Object.fromEntries(searchParams.entries()));
  
  safeLog('info', 'PhonePe callback received', {
       method: request.method,
       merchantOrderId,
       code,
       state,
       allParams: Object.fromEntries(searchParams.entries())
     });
  
  if (!merchantOrderId) {
    console.error('❌ CALLBACK DEBUG: Missing merchantOrderId in callback');
    safeLogError('No merchantOrderId in callback', {});
    return NextResponse.redirect(new URL('/checkout?error=invalid_callback', request.url));
  }
  
  try {
    console.log('🔄 CALLBACK DEBUG: Calling checkOrderStatusAndRedirect...');
    const result = await checkOrderStatusAndRedirect(merchantOrderId, request);
    console.log('✅ CALLBACK DEBUG: checkOrderStatusAndRedirect completed successfully');
    return result;
  } catch (error) {
    console.error('❌ CALLBACK DEBUG: Error in PhonePe callback:', error);
    console.error('❌ CALLBACK DEBUG: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
  console.log('🔄 CALLBACK DEBUG: Starting saveOrderToDatabase');
  console.log('🔄 CALLBACK DEBUG: Payment details received:', JSON.stringify(paymentDetails, null, 2));
  
  try {
    // Extract customer info and cart from PhonePe metaInfo
    const metaInfo = paymentDetails.metaInfo || {};
    console.log('🔄 CALLBACK DEBUG: MetaInfo extracted:', JSON.stringify(metaInfo, null, 2));
    console.log('🔄 CALLBACK DEBUG: MetaInfo keys:', Object.keys(metaInfo));
    console.log('🔄 CALLBACK DEBUG: Has userId in metaInfo:', !!metaInfo.userId);
    console.log('🔄 CALLBACK DEBUG: Has address in metaInfo:', !!metaInfo.address);
    
    // Try to get stored order metadata if metaInfo is incomplete
    global.orderMetadataCache = global.orderMetadataCache || new Map();
    const storedMetadata = global.orderMetadataCache.get(merchantOrderId);
    console.log('🔄 CALLBACK DEBUG: Stored metadata found:', !!storedMetadata);
    
    if (storedMetadata) {
      console.log('🔄 CALLBACK DEBUG: Using stored metadata:', {
        hasUserId: !!storedMetadata.userId,
        hasCustomerInfo: !!storedMetadata.customerInfo,
        hasCart: !!storedMetadata.cart
      });
    }
    
    // Use metaInfo first, fallback to stored metadata
    const customerName = metaInfo.udf1 || storedMetadata?.customerInfo?.name || 'Unknown Customer';
    const customerEmail = metaInfo.udf2 || storedMetadata?.customerInfo?.email || '';
    const customerPhone = metaInfo.udf3 || storedMetadata?.customerInfo?.phone || '';
    const cartItemsJson = metaInfo.udf4 || (storedMetadata?.cart ? JSON.stringify(storedMetadata.cart.slice(0, 3)) : '[]');
    const itemsCount = metaInfo.udf5 || (storedMetadata?.cart ? `items:${storedMetadata.cart.length}` : 'items:0');
    
    console.log('🔄 CALLBACK DEBUG: Extracted fields:', {
      customerName,
      customerEmail,
      customerPhone,
      cartItemsJson,
      itemsCount
    });
    
    let cartItems = [];
    try {
      cartItems = JSON.parse(cartItemsJson);
      console.log('🔄 CALLBACK DEBUG: Parsed cart items:', JSON.stringify(cartItems, null, 2));
    } catch (e) {
      console.error('❌ CALLBACK DEBUG: Failed to parse cart items:', e);
      safeLogError('Failed to parse cart items from metaInfo', { cartItemsJson, error: e });
    }

    // Get userId from metaInfo or stored metadata
    const userId = metaInfo.userId || storedMetadata?.userId;
    console.log('🔄 CALLBACK DEBUG: Final userId to use:', userId);
    
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
    console.log('🔄 CALLBACK DEBUG: Prepared order data for saving:', JSON.stringify(orderData, null, 2));
    const savedOrder = await saveOrder(orderData);
    console.log('✅ CALLBACK DEBUG: Order saved successfully with ID:', savedOrder.id);
    console.log('✅ CALLBACK DEBUG: Saved order details:', JSON.stringify(savedOrder, null, 2));
    
    safeLog('info', 'Order saved to database successfully', {
      orderId: savedOrder.id,
      merchantOrderId,
      phonePeOrderId,
      transactionId
    });
    
    return savedOrder;
  } catch (error) {
    console.error('❌ CALLBACK DEBUG: Error saving order to database:', error);
    console.error('❌ CALLBACK DEBUG: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
  console.log('🔍 CALLBACK DEBUG: Starting checkOrderStatusAndRedirect for order:', merchantOrderId);
  
  const baseUrl = typeof request === 'string' ? request : (process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://bubblebeads.in'
    : 'http://localhost:3000');
  console.log('🔍 CALLBACK DEBUG: Base URL:', baseUrl);
    
  try {
    // Initialize PhonePe OAuth client
    console.log('🔍 CALLBACK DEBUG: Initializing PhonePe OAuth client...');
    let phonePeClient;
    try {
      phonePeClient = createPhonePeOAuthClient();
    } catch (error) {
      console.error('❌ CALLBACK DEBUG: PhonePe OAuth client initialization failed:', error);
      safeLogError("PhonePe OAuth client initialization failed in callback", error);
      return NextResponse.redirect(new URL("/checkout?error=system_error", baseUrl));
    }

    // Check order status using OAuth API
    console.log('🔍 CALLBACK DEBUG: Checking order status with PhonePe...');
    const orderStatus = await phonePeClient.getOrderStatus(merchantOrderId, true);
    console.log('🔍 CALLBACK DEBUG: Order status response:', JSON.stringify(orderStatus, null, 2));

    const isPaymentSuccessful = orderStatus.state === 'COMPLETED';
    const isPaymentPending = orderStatus.state === 'PENDING';
    const isPaymentFailed = orderStatus.state === 'FAILED';

    if (isPaymentSuccessful) {
      console.log('✅ CALLBACK DEBUG: Payment successful, processing order...');
      
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
      console.log('🔄 CALLBACK DEBUG: Attempting to save order to database...');
      try {
        await saveOrderToDatabase({
          merchantOrderId,
          phonePeOrderId: orderStatus.orderId,
          transactionId,
          amount: orderStatus.amount,
          paymentDetails: orderStatus
        });
        console.log('✅ CALLBACK DEBUG: Order saved successfully, redirecting to success page...');
        
        // Clean up stored metadata after successful processing
        if (orderMetadataCache.has(merchantOrderId)) {
          orderMetadataCache.delete(merchantOrderId);
          console.log('🧹 CALLBACK DEBUG: Cleaned up stored metadata for order:', merchantOrderId);
        }
      } catch (error) {
        console.error('❌ CALLBACK DEBUG: Failed to save order, but payment was successful:', error);
        console.error('❌ CALLBACK DEBUG: Save error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
      console.log('✅ CALLBACK DEBUG: Redirecting to:', successUrl.toString());
      return NextResponse.redirect(successUrl);
    } else if (isPaymentPending) {
      console.log('⏳ CALLBACK DEBUG: Payment is still pending...');
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
      console.log('❌ CALLBACK DEBUG: Payment failed or cancelled');
      console.log('❌ CALLBACK DEBUG: Order status details:', JSON.stringify(orderStatus, null, 2));
      safeLogError("PhonePe OAuth payment failed", {
        merchantOrderId,
        phonePeOrderId: orderStatus.orderId,
        state: orderStatus.state,
        orderStatus
      });

      // Redirect to checkout with error
      return NextResponse.redirect(
        new URL(`/checkout?error=payment_failed&orderId=${merchantOrderId}`, baseUrl)
      );
    }

  } catch (error) {
    console.error('❌ CALLBACK DEBUG: Error checking order status:', error);
    console.error('❌ CALLBACK DEBUG: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    safeLogError("PhonePe OAuth callback processing error", error);
    return NextResponse.redirect(new URL("/checkout?error=callback_error", baseUrl));
  }
}