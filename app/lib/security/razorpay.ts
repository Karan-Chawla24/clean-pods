import crypto from 'crypto';
import { safeLogError } from './logging';

export interface RazorpayWebhookPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  [key: string]: any;
}

export function verifyRazorpaySignature(
  rawBody: string, // raw string, not parsed JSON
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch (error) {
    safeLogError('Error verifying Razorpay signature', error);
    return false;
  }
}

export function validateRazorpayOrder(orderId: string): boolean {
  return /^order_[a-zA-Z0-9]+$/.test(orderId);
}

export function validateRazorpayPayment(paymentId: string): boolean {
  return /^pay_[a-zA-Z0-9]+$/.test(paymentId);
}

export function sanitizeRazorpayPayload(payload: any): RazorpayWebhookPayload {
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
