// Product data and utilities

// Server-side product data with secure pricing
const PRODUCTS = {
  essential: {
    id: 'essential',
    name: 'Essential Clean Pod',
    price: 450,
    description: 'Our signature cleaning pod with essential oils for a fresh, natural clean.',
    features: [
      'Natural essential oils',
      'Biodegradable formula',
      'Concentrated cleaning power',
      'Fresh citrus scent'
    ],
    image: '/pod_image.jpg',
    ingredients: 'Sodium carbonate, essential oils (lemon, eucalyptus), natural surfactants',
    usage: 'Drop one pod into your washing machine drum before adding clothes. Suitable for all fabric types.'
  }
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