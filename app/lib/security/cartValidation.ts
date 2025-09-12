import { getProductPrice } from "@/app/lib/products";

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
export async function validateCart(
  cartItems: CartItem[],
): Promise<CartValidationResult> {
  const errors: string[] = [];
  const validatedItems: CartItem[] = [];
  let calculatedTotal = 0;

  if (!cartItems || cartItems.length === 0) {
    return {
      isValid: false,
      calculatedTotal: 0,
      errors: ["Cart is empty"],
      validatedItems: [],
    };
  }

  for (const item of cartItems) {
    try {
      // Validate item structure
      if (
        !item.id ||
        !item.name ||
        typeof item.price !== "number" ||
        typeof item.quantity !== "number"
      ) {
        errors.push(`Invalid item structure for item: ${item.id || "unknown"}`);
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
      if (Math.abs(item.price - serverPrice) > 0.01) {
        // Allow for small floating point differences
        errors.push(
          `Price mismatch for ${item.name}. Expected: ${serverPrice}, Received: ${item.price}`,
        );
        continue;
      }

      // Calculate item total
      const itemTotal = serverPrice * item.quantity;
      calculatedTotal += itemTotal;

      // Add validated item
      validatedItems.push({
        ...item,
        price: serverPrice, // Use server-side price
      });
    } catch (error) {
      errors.push(
        `Error validating item ${item.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return {
    isValid: errors.length === 0 && validatedItems.length > 0,
    calculatedTotal: Math.round(calculatedTotal * 100) / 100, // Round to 2 decimal places
    errors,
    validatedItems,
  };
}

/**
 * Validates that the submitted total matches the calculated total (no GST)
 * @param submittedTotal - Total amount submitted by client
 * @param calculatedTotal - Total calculated from server-side prices
 * @param tolerance - Allowed difference (default: 0.01)
 * @returns boolean indicating if totals match
 */
export function validateTotal(
  submittedTotal: number,
  calculatedTotal: number,
  tolerance: number = 0.01,
): boolean {
  return Math.abs(submittedTotal - calculatedTotal) <= tolerance;
}

/**
 * Sanitizes cart items by removing any potentially harmful data
 * @param cartItems - Raw cart items from client
 * @returns Sanitized cart items
 */
export function sanitizeCartItems(cartItems: any[]): CartItem[] {
  return cartItems
    .map((item) => ({
      id: String(item.id || "").trim(),
      name: String(item.name || "").trim(),
      price: Number(item.price) || 0,
      quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
    }))
    .filter((item) => item.id && item.name);
}

/**
 * Calculates shipping cost based on cart items
 * @param cartItems - Cart items to calculate shipping for
 * @returns Shipping cost
 */
export function calculateShipping(cartItems: CartItem[]): number {
  // Calculate total boxes based on product IDs
  const totalBoxes = cartItems.reduce((total, item) => {
    let boxesPerItem = 1; // default
    if (item.id === 'combo-2box') boxesPerItem = 2;
    if (item.id === 'combo-3box') boxesPerItem = 3;
    return total + (boxesPerItem * item.quantity);
  }, 0);
  
  // Shipping logic: 3+ boxes = free, 2 boxes = 49, 1 box = 99
  return totalBoxes >= 3 ? 0 : totalBoxes >= 2 ? 49 : 99;
}

/**
 * Comprehensive cart validation middleware function
 * @param cartItems - Cart items to validate
 * @param submittedTotal - Total submitted by client (including shipping, no GST)
 * @returns Promise<CartValidationResult & { totalMatches: boolean, calculatedTotalWithTax: number }>
 */
export async function validateCartAndTotal(
  cartItems: CartItem[],
  submittedTotal: number,
) {
  // Sanitize cart items first
  const sanitizedItems = sanitizeCartItems(cartItems);

  // Validate cart
  const cartValidation = await validateCart(sanitizedItems);

  if (!cartValidation.isValid) {
    return {
      ...cartValidation,
      totalMatches: false,
      calculatedTotalWithTax: 0,
      sanitizedItems,
    };
  }

  // Calculate shipping (no GST applied)
  const shipping = calculateShipping(sanitizedItems);
  
  // Calculate final total (product price + shipping, no GST)
  const calculatedTotalWithTax = cartValidation.calculatedTotal + shipping;

  // Validate total (comparing submitted total with calculated total)
  const totalMatches = Math.abs(submittedTotal - calculatedTotalWithTax) <= 0.01;

  return {
    ...cartValidation,
    totalMatches,
    calculatedTotalWithTax,
    sanitizedItems,
    shipping,
  };
}
