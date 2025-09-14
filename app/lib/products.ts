// Product data and utilities

// Server-side product data with secure pricing
const PRODUCTS = {
  "single-box": {
    id: "single-box",
    name: "5-in-1 Laundry Pod",
    price: 450,
    originalPrice: 750,
    discount: 40,
    quantity: "30 Pods",
    boxes: 1,
    shipping: 99,
    description:
      "Perfect starter pack with 30 premium 5-in-1 laundry pods.",
    features: [
      "Powerful Stain Removal",
      "Soften the Clothes",
      "Long Lasting Fragrance",
      "Colour Protection",
      "Dust Removal",
    ],
    image: "/pod_image.jpg",
    ingredients:
      "Sodium carbonate, essential oils (lemon, eucalyptus), natural surfactants, enzymes, fabric softening agents",
    usage:
      "Drop one pod into your washing machine drum before adding clothes. For heavily soiled loads, use two pods.",
  },
  "combo-2box": {
    id: "combo-2box",
    name: "5-in-1 Laundry Pod - 2 Box Combo",
    price: 900,
    originalPrice: 1500,
    discount: 40,
    quantity: "60 Pods",
    boxes: 2,
    shipping: 49,
    description:
      "Great value combo pack with 60 pods.",
    features: [
      "Powerful Stain Removal",
      "Soften the Clothes",
      "Long Lasting Fragrance",
      "Colour Protection",
      "Dust Removal",
    ],
    image: "/pod_image.jpg",
    ingredients:
      "Sodium carbonate, essential oils (lemon, eucalyptus), natural surfactants, enzymes, fabric softening agents",
    usage:
      "Drop one pod into your washing machine drum before adding clothes. For heavily soiled loads, use two pods.",
  },
  "combo-3box": {
    id: "combo-3box",
    name: "5-in-1 Laundry Pod - 3 Box Combo",
    price: 1350,
    originalPrice: 2250,
    discount: 40,
    quantity: "90 Pods",
    boxes: 3,
    shipping: 0,
    description:
      "Best value family pack with 90 pods and FREE shipping.",
    features: [
      "Powerful Stain Removal",
      "Soften the Clothes",
      "Long Lasting Fragrance",
      "Colour Protection",
      "Dust Removal",
    ],
    image: "/pod_image.jpg",
    ingredients:
      "Sodium carbonate, essential oils (lemon, eucalyptus), natural surfactants, enzymes, fabric softening agents",
    usage:
      "Drop one pod into your washing machine drum before adding clothes. For heavily soiled loads, use two pods.",
  },
};

// Helper function to get product by ID
export function getProductById(id: string) {
  return PRODUCTS[id as keyof typeof PRODUCTS] || null;
}

// Helper function to validate product exists and get price
export function getProductPrice(id: string): number | null {
  const product = PRODUCTS[id as keyof typeof PRODUCTS];
  return product ? product.price : null;
}

// Get all products
export function getAllProducts() {
  return Object.values(PRODUCTS);
}

export { PRODUCTS };
