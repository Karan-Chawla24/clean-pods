import { z } from 'zod';

// Contact form validation schema
export const contactFormSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters'),
  
  subject: z.string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters')
    .regex(/^[a-zA-Z0-9\s\-_.,!?]+$/, 'Subject contains invalid characters'),
  
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters')
    .regex(/^[a-zA-Z0-9\s\-_.,!?@#$%^&*()+=<>{}[\]|\\/:;"'`~]+$/, 'Message contains invalid characters')
});

// Order creation validation schema
export const createOrderSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .min(1, 'Amount must be at least 1')
    .max(1000000, 'Amount cannot exceed 10,00,000'),
  
  currency: z.string()
    .default('INR')
    .refine((val) => /^[A-Z]{3}$/.test(val), 'Currency must be a 3-letter code'),
  
  receipt: z.string()
    .min(1, 'Receipt is required')
    .max(100, 'Receipt must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Receipt can only contain letters, numbers, hyphens, and underscores')
});

// Razorpay webhook validation schema
export const razorpayWebhookSchema = z.object({
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
  // Add other fields as needed based on your webhook payload
});

// Generic validation function
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = (error as any).errors?.map((e: any) => e.message)?.join(', ') || 'Validation failed';
      return { success: false, error: `Validation failed: ${errorMessage}` };
    }
    return { success: false, error: 'Invalid request body' };
  }
}

// Sanitize function to remove potentially dangerous characters
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}