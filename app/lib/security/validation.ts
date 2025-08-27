import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

// Enhanced email validation with strict format
const emailSchema = z
  .string()
  .email("Invalid email format")
  .max(255, "Email must be less than 255 characters")
  .regex(
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    "Invalid email format",
  );

// Enhanced phone validation
const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number must be less than 15 digits");

// Enhanced address validation
const addressSchema = z.object({
  street: z
    .string()
    .min(1, "Street address is required")
    .max(200, "Street address must be less than 200 characters")
    .regex(
      /^[a-zA-Z0-9\s\-.,#]+$/,
      "Street address contains invalid characters",
    ),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be less than 100 characters")
    .regex(
      /^[a-zA-Z\s\-']+$/,
      "City can only contain letters, spaces, hyphens, and apostrophes",
    ),
  state: z
    .string()
    .min(1, "State is required")
    .max(100, "State must be less than 100 characters")
    .regex(
      /^[a-zA-Z\s\-']+$/,
      "State can only contain letters, spaces, hyphens, and apostrophes",
    ),
  zipCode: z.string().regex(/^[0-9]{5,10}$/, "Invalid zip code format"),
  country: z
    .string()
    .min(2, "Country is required")
    .max(100, "Country must be less than 100 characters")
    .regex(
      /^[a-zA-Z\s\-']+$/,
      "Country can only contain letters, spaces, hyphens, and apostrophes",
    ),
});

// Contact form validation schema
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),

  email: emailSchema,

  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject must be less than 200 characters")
    .regex(/^[a-zA-Z0-9\s\-_.,!?]+$/, "Subject contains invalid characters"),

  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be less than 2000 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_.,!?@#$%^&*()+=<>{}[\]|\\/:;"'`~]+$/,
      "Message contains invalid characters",
    ),
});

// User profile validation schema
export const userProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  email: emailSchema,
  phone: phoneSchema.optional(),
  address: addressSchema.optional(),
});

// Admin grant role validation schema
export const grantRoleSchema = z.object({
  userId: z
    .string()
    .min(1, "User ID is required")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid user ID format"),
  role: z.enum(["admin", "user"], {
    errorMap: () => ({ message: "Role must be either admin or user" }),
  }),
});

// Order ID validation schema
export const orderIdSchema = z.object({
  id: z
    .string()
    .min(1, "Order ID is required")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid order ID format"),
});

// Product ID validation schema
export const productIdSchema = z.object({
  productId: z
    .string()
    .min(1, "Product ID is required")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid product ID format"),
});

// Invoice token validation schema
export const invoiceTokenSchema = z.object({
  orderId: z
    .string()
    .min(1, "Order ID is required")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid order ID format"),
});

// Cart item validation schema
export const cartItemSchema = z.object({
  id: z.string().min(1, "Product ID is required"),
  name: z.string().min(1, "Product name is required"),
  price: z.number().positive("Price must be positive"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
});

// Order creation validation schema
export const createOrderSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be positive")
    .min(1, "Amount must be at least 1")
    .max(1000000, "Amount cannot exceed 10,00,000"),

  currency: z
    .string()
    .default("INR")
    .refine(
      (val) => /^[A-Z]{3}$/.test(val),
      "Currency must be a 3-letter code",
    ),

  receipt: z
    .string()
    .min(1, "Receipt is required")
    .max(100, "Receipt must be less than 100 characters")
    .regex(
      /^[a-zA-Z0-9\-_]+$/,
      "Receipt can only contain letters, numbers, hyphens, and underscores",
    ),

  cart: z
    .array(cartItemSchema)
    .min(1, "Cart must contain at least one item")
    .max(50, "Cart cannot contain more than 50 items"),
});

// Razorpay webhook validation schema
export const razorpayWebhookSchema = z.object({
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
  // Add other fields as needed based on your webhook payload
});

// Generic validation function
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage =
        (error as any).errors?.map((e: any) => e.message)?.join(", ") ||
        "Validation failed";
      return { success: false, error: `Validation failed: ${errorMessage}` };
    }
    return { success: false, error: "Invalid request body" };
  }
}

// Enhanced sanitization functions
export function sanitizeString(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(/[<>]/g, "") // Remove < and > to prevent HTML injection
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .trim();
}

// Sanitize HTML content using DOMPurify
export function sanitizeHtml(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["p", "br", "strong", "em", "u"],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

// Sanitize email input
export function sanitizeEmail(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .toLowerCase()
    .replace(/[^a-z0-9@._+-]/g, "")
    .trim();
}

// Sanitize phone number input
export function sanitizePhone(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input.replace(/[^0-9+]/g, "").trim();
}

// Sanitize numeric input
export function sanitizeNumber(input: any): number | null {
  const num = Number(input);
  return isNaN(num) ? null : num;
}

// Sanitize object by applying sanitization to all string properties
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      (sanitized as any)[key] = sanitizeString(sanitized[key] as string);
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      (sanitized as any)[key] = sanitizeObject(sanitized[key]);
    }
  }

  return sanitized;
}

// Escape HTML for output
export function escapeHtml(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
