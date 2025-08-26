import { getProductPrice } from '@/app/lib/products';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CartValidationResult {
  isValid: boolean;
  calculatedTotal: number;
  errors: string[];
  validatedItems: CartItem[];
}

/**
 * Validates cart items against server-side product prices
 * @param cartItems - Array of cart items to validate
 * @returns CartValidationResult with validation status and calculated total
 */
export async function validateCart(cartItems: CartItem[]): Promise<CartValidationResult> {
  const errors: string[] = [];
  const validatedItems: CartItem[] = [];
  let calculatedTotal = 0;

  if (!cartItems || cartItems.length === 0) {
    return {
      isValid: false,
      calculatedTotal: 0,
      errors: ['Cart is empty'],
      validatedItems: []
    };
  }

  for (const item of cartItems) {
    try {
      // Validate item structure
      if (!item.id || !item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        errors.push(`Invalid item structure for item: ${item.id || 'unknown'}`);
        continue;
      }

      // Validate quantity
      if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        errors.push(`Invalid quantity for ${item.name}: ${item.quantity}`);
        continue;
      }

      // Get server-side price
      const serverPrice = await getProductPrice(item.id);
      if (serverPrice === null) {
        errors.push(`Product not found: ${item.id}`);
        continue;
      }

      // Validate price against server-side price
      if (Math.abs(item.price - serverPrice) > 0.01) { // Allow for small floating point differences
        errors.push(`Price mismatch for ${item.name}. Expected: ${serverPrice}, Received: ${item.price}`);
        continue;
      }

      // Calculate item total
      const itemTotal = serverPrice * item.quantity;
      calculatedTotal += itemTotal;

      // Add validated item
      validatedItems.push({
        ...item,
        price: serverPrice // Use server-side price
      });

    } catch (error) {
      errors.push(`Error validating item ${item.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return {
    isValid: errors.length === 0 && validatedItems.length > 0,
    calculatedTotal: Math.round(calculatedTotal * 100) / 100, // Round to 2 decimal places
    errors,
    validatedItems
  };
}

/**
 * Calculates 18% GST on the given amount
 * @param amount - Base amount to calculate tax on
 * @returns Tax amount
 */
export function calculateTax(amount: number): number {
  return Math.round(amount * 0.18); // 18% GST
}

/**
 * Calculates total amount including 18% GST
 * @param amount - Base amount
 * @returns Total amount with tax
 */
export function calculateTotal(amount: number): number {
  return amount + calculateTax(amount);
}

/**
 * Validates that the submitted total matches the calculated total (including GST)
 * @param submittedTotal - Total amount submitted by client (including GST)
 * @param calculatedSubtotal - Subtotal calculated from server-side prices (before GST)
 * @param tolerance - Allowed difference (default: 0.01)
 * @returns boolean indicating if totals match
 */
export function validateTotal(submittedTotal: number, calculatedSubtotal: number, tolerance: number = 0.01): boolean {
  const expectedTotal = calculateTotal(calculatedSubtotal);
  return Math.abs(submittedTotal - expectedTotal) <= tolerance;
}

/**
 * Sanitizes cart items by removing any potentially harmful data
 * @param cartItems - Raw cart items from client
 * @returns Sanitized cart items
 */
export function sanitizeCartItems(cartItems: any[]): CartItem[] {
  return cartItems.map(item => ({
    id: String(item.id || '').trim(),
    name: String(item.name || '').trim(),
    price: Number(item.price) || 0,
    quantity: Math.max(1, Math.floor(Number(item.quantity) || 1))
  })).filter(item => item.id && item.name);
}

/**
 * Comprehensive cart validation middleware function
 * @param cartItems - Cart items to validate
 * @param submittedTotal - Total submitted by client (including GST)
 * @returns Promise<CartValidationResult & { totalMatches: boolean, calculatedTotalWithTax: number }>
 */
export async function validateCartAndTotal(cartItems: CartItem[], submittedTotal: number) {
  // Sanitize cart items first
  const sanitizedItems = sanitizeCartItems(cartItems);
  
  // Validate cart
  const cartValidation = await validateCart(sanitizedItems);
  
  // Calculate total with GST
  const calculatedTotalWithTax = cartValidation.isValid ? 
    calculateTotal(cartValidation.calculatedTotal) : 0;
  
  // Validate total (comparing submitted total with calculated total including GST)
  const totalMatches = cartValidation.isValid ? 
    validateTotal(submittedTotal, cartValidation.calculatedTotal) : false;
  
  return {
    ...cartValidation,
    totalMatches,
    calculatedTotalWithTax,
    sanitizedItems
  };
}