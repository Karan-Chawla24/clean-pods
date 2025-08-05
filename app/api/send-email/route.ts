import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Set your SendGrid API Key in Vercel environment variables as SENDGRID_API_KEY
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { to, subject, text, html } = await req.json();

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL!, // Set this in your env vars
      subject,
      text,
      html,
    };

    await sgMail.send(msg);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
