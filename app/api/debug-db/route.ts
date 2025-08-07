import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    const hasDirectUrl = !!process.env.DIRECT_URL;
    
    // Show partial URL for debugging (without password)
    const dbUrl = process.env.DATABASE_URL || 'NOT_SET';
    const maskedUrl = dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    
    return NextResponse.json({
      success: true,
      environment: {
        hasDatabaseUrl,
        hasDirectUrl,
        maskedDatabaseUrl: maskedUrl,
        nodeEnv: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL
      },
      message: 'Environment check completed'
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 