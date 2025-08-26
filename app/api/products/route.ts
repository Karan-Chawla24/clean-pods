import { NextRequest, NextResponse } from 'next/server';
import { getProductById, getAllProducts } from '@/app/lib/products';
import { safeLogError } from '@/app/lib/security/logging';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    // If specific product requested
    if (productId) {
      const product = getProductById(productId);
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ product });
    }

    // Return all products
    return NextResponse.json({ products: getAllProducts() });
  } catch (error) {
    safeLogError('Error fetching products', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}