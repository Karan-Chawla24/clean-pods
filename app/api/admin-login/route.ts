import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Function to hash password with salt using PBKDF2
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// Function to verify password
function verifyPassword(inputPassword: string, storedHash: string, salt: string): boolean {
  const inputHash = hashPassword(inputPassword, salt);
  return crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(storedHash, 'hex'));
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    // Server-side password validation
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminPasswordSalt = process.env.ADMIN_PASSWORD_SALT;
    
    if (!adminPassword || !adminPasswordSalt) {
      return NextResponse.json(
        { success: false, error: 'Admin credentials not properly configured' },
        { status: 500 }
      );
    }
    
    // In a real application, the salt and hash would be stored in a database
    // For this demo, we're using environment variables
    const isPasswordValid = verifyPassword(password, adminPassword, adminPasswordSalt);
    
    if (isPasswordValid) {
      // Generate a secure session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // In production, store this in a database or Redis with the user ID
      // For now, we'll use a simple approach
      
      // Set HTTP-only cookie for better security
      const response = NextResponse.json({
        success: true,
        expiresAt: expiresAt.toISOString()
      });
      
      // Set secure HTTP-only cookie
      response.cookies.set({
        name: 'adminSessionToken',
        value: sessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: expiresAt,
        path: '/'
      });
      
      return response;
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