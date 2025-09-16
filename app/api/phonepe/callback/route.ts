import { NextRequest, NextResponse } from 'next/server';
import { createPhonePeOAuthClient } from '@/app/lib/phonepe-oauth';
import { safeLog, safeLogError } from '@/app/lib/security/logging';
import { saveOrder } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  return handleCallback(request);
}

export async function POST(request: NextRequest) {
  return handleCallback(request);
}

// Handle both redirect callbacks (GET) and status checks
async function handleCallback(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const merchantOrderId = searchParams.get('merchantOrderId');
  
  safeLog('info', 'PhonePe callback received', {
       method: request.method,
       merchantOrderId,
       allParams: Object.fromEntries(searchParams.entries())
     });
  
  if (!merchantOrderId) {
    safeLogError('No merchantOrderId in callback', {});
    return NextResponse.redirect(new URL('/checkout?error=invalid_callback', request.url));
  }
  
  // Check order status using PhonePe Order Status API
  return checkOrderStatusAndRedirect(merchantOrderId, request);
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
  try {
    // Extract customer info and cart from PhonePe metaInfo
    const metaInfo = paymentDetails.metaInfo || {};
    const customerName = metaInfo.udf1 || 'Unknown Customer';
    const customerEmail = metaInfo.udf2 || '';
    const customerPhone = metaInfo.udf3 || '';
    const cartItemsJson = metaInfo.udf4 || '[]';
    const itemsCount = metaInfo.udf5 || 'items:0';
    
    let cartItems = [];
    try {
      cartItems = JSON.parse(cartItemsJson);
    } catch (e) {
      safeLogError('Failed to parse cart items from metaInfo', { cartItemsJson, error: e });
    }

    // If userId is available, create/update user in database first
    let validUserId = undefined;
    if (metaInfo.userId) {
      try {
        // Import required modules for user creation
        const { prisma } = await import('@/app/lib/prisma');
        const prismaVercel = await import('@/app/lib/prisma-vercel');
        const db = process.env.VERCEL ? prismaVercel.default : prisma;
        
        // Try to find existing user
        let user = await db.user.findUnique({
          where: { id: metaInfo.userId }
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
      address: metaInfo.address || 'Address not provided', // Add address from metaInfo or default
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
    console.log('DEBUG: About to save order with data:', JSON.stringify(orderData, null, 2));
    const savedOrder = await saveOrder(orderData);
    console.log('DEBUG: Order saved successfully:', savedOrder);
    
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
async function checkOrderStatusAndRedirect(merchantOrderId: string, request: NextRequest) {
  // Get the correct base URL for redirects (use localhost instead of 0.0.0.0)
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'https://your-domain.com'
    : 'http://localhost:3000';
    
  try {
    // Initialize PhonePe OAuth client
    let phonePeClient;
    try {
      phonePeClient = createPhonePeOAuthClient();
    } catch (error) {
      safeLogError("PhonePe OAuth client initialization failed in callback", error);
      return NextResponse.redirect(new URL("/checkout?error=system_error", baseUrl));
    }

    // Check order status using OAuth API
    const orderStatus = await phonePeClient.getOrderStatus(merchantOrderId, true);

    const isPaymentSuccessful = orderStatus.state === 'COMPLETED';
    const isPaymentPending = orderStatus.state === 'PENDING';
    const isPaymentFailed = orderStatus.state === 'FAILED';

    if (isPaymentSuccessful) {
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
      console.log('DEBUG: Payment successful, about to save order to database');
      try {
        await saveOrderToDatabase({
          merchantOrderId,
          phonePeOrderId: orderStatus.orderId,
          transactionId,
          amount: orderStatus.amount,
          paymentDetails: orderStatus
        });
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
      return NextResponse.redirect(
        new URL(`/order-success?order_id=${merchantOrderId}&transactionId=${transactionId}&phonePeOrderId=${orderStatus.orderId}`, baseUrl)
      );
    } else if (isPaymentPending) {
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
    safeLogError("PhonePe OAuth callback processing error", error);
    return NextResponse.redirect(new URL("/checkout?error=callback_error", baseUrl));
  }
}