import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    // If specific product requested
    if (productId) {
      const product = PRODUCTS[productId as keyof typeof PRODUCTS];
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ product });
    }

    // Return all products
    return NextResponse.json({ products: Object.values(PRODUCTS) });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get product by ID (for internal use)
export function getProductById(id: string) {
  return PRODUCTS[id as keyof typeof PRODUCTS] || null;
}

// Helper function to validate product exists and get price
export function getProductPrice(id: string): number | null {
  const product = PRODUCTS[id as keyof typeof PRODUCTS];
  return product ? product.price : null;
}