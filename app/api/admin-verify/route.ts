import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get session token from HTTP-only cookie instead of request body
    const sessionToken = request.cookies.get('adminSessionToken')?.value;
    
    // In production, verify against database/Redis
    // For now, we'll use a simple approach
    if (sessionToken && sessionToken.length === 64) {
      return NextResponse.json({
        success: true,
        isAdmin: true
      });
    } else {
      // Clear the invalid cookie
      const response = NextResponse.json({
        success: false,
        isAdmin: false
      });
      
      // If there was an invalid cookie, clear it
      if (sessionToken) {
        response.cookies.set({
          name: 'adminSessionToken',
          value: '',
          expires: new Date(0),
          path: '/'
        });
      }
      
      return response;
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, isAdmin: false },
      { status: 500 }
    );
  }
}

// Add a GET endpoint for easier verification from client-side
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('adminSessionToken')?.value;
    
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