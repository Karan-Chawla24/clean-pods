import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { withRateLimit, rateLimitConfigs } from '@/app/lib/security/rateLimit';
import { validateRequest, adminLoginSchema } from '@/app/lib/security/validation';
import { generateAdminToken, setAdminCookie } from '@/app/lib/security/jwt';

// Function to hash password with salt using PBKDF2
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

// Function to verify password
function verifyPassword(inputPassword: string, storedHash: string, salt: string): boolean {
  const inputHash = hashPassword(inputPassword, salt);
  return crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(storedHash, 'hex'));
}

export const POST = withRateLimit(rateLimitConfigs.strict)(async (request: NextRequest) => {
  try {
    // Validate request body with Zod schema
    const validationResult = await validateRequest(request, adminLoginSchema);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 400 }
      );
    }

    const { password } = validationResult.data;
    
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
      // Generate JWT token for admin
      const adminId = 'admin'; // In production, this would come from database
      const token = generateAdminToken(adminId);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Set HTTP-only cookie for better security
      const response = NextResponse.json({
        success: true,
        expiresAt: expiresAt.toISOString(),
        token: token // Include token in response for client-side storage if needed
      });
      
      // Set secure JWT cookie
      setAdminCookie(response, token);
      
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
});