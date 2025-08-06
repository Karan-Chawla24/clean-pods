import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    // Server-side password validation
    const adminPassword = process.env.ADMIN_PASSWORD; // Remove NEXT_PUBLIC_
    
    if (!adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Admin password not configured' },
        { status: 500 }
      );
    }
    
    if (password === adminPassword) {
      // Generate a secure session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // In production, store this in a database or Redis
      // For now, we'll use a simple approach
      
      return NextResponse.json({
        success: true,
        sessionToken,
        expiresAt: expiresAt.toISOString()
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
} 