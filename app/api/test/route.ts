import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API routes are working!',
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({
    success: true,
    message: 'POST request received',
    data: body,
    timestamp: new Date().toISOString(),
  });
} 