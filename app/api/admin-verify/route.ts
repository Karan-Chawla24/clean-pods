import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionToken } = await request.json();
    
    // In production, verify against database/Redis
    // For now, we'll use a simple approach
    if (sessionToken && sessionToken.length === 64) {
      return NextResponse.json({
        success: true,
        isAdmin: true
      });
    } else {
      return NextResponse.json({
        success: false,
        isAdmin: false
      });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, isAdmin: false },
      { status: 500 }
    );
  }
} 