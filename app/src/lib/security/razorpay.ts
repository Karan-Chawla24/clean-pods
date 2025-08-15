import crypto from 'crypto';

export interface RazorpayWebhookPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  [key: string]: any;
}

export function verifyRazorpaySignature(
  payload: RazorpayWebhookPayload,
  secret: string
): boolean {
  try {
    const { razorpay_signature, ...data } = payload;
    
    // Create the expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');
    
    // Compare signatures using timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(razorpay_signature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying Razorpay signature:', error);
    return false;
  }
}

export function validateRazorpayOrder(orderId: string): boolean {
  // Basic validation for Razorpay order ID format
  // Razorpay order IDs typically start with 'order_' and contain alphanumeric characters
  const orderIdPattern = /^order_[a-zA-Z0-9]+$/;
  return orderIdPattern.test(orderId);
}

export function validateRazorpayPayment(paymentId: string): boolean {
  // Basic validation for Razorpay payment ID format
  // Razorpay payment IDs typically start with 'pay_' and contain alphanumeric characters
  const paymentIdPattern = /^pay_[a-zA-Z0-9]+$/;
  return paymentIdPattern.test(paymentId);
}

export function sanitizeRazorpayPayload(payload: any): RazorpayWebhookPayload {
  // Remove any potentially dangerous properties and ensure only expected fields remain
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    ...otherFields
  } = payload;
  
  return {
    razorpay_payment_id: String(razorpay_payment_id || ''),
    razorpay_order_id: String(razorpay_order_id || ''),
    razorpay_signature: String(razorpay_signature || ''),
    ...otherFields
  };
} 