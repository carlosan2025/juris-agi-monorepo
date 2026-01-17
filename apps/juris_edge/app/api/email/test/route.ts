import { NextResponse } from 'next/server';
import { testEmailConnection, sendEmail, emailConfig } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, to } = body;

    if (action === 'test-connection') {
      const result = await testEmailConnection();
      return NextResponse.json(result);
    }

    if (action === 'send-test') {
      if (!to) {
        return NextResponse.json(
          { success: false, error: 'Recipient email address is required' },
          { status: 400 }
        );
      }

      const result = await sendEmail({
        to,
        subject: 'Juris AGI - Test Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Test Email Successful!</h2>
            <p style="color: #4a4a4a; font-size: 16px;">
              This is a test email from Juris AGI. If you're receiving this, your email configuration is working correctly.
            </p>
            <p style="color: #888; font-size: 14px; margin-top: 20px;">
              Sent from: ${emailConfig.from.email}
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="color: #888; font-size: 12px;">
              Juris AGI - Intelligent Due Diligence Platform
            </p>
          </div>
        `,
        text: 'This is a test email from Juris AGI. If you\'re receiving this, your email configuration is working correctly.',
      });

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return current email configuration (without sensitive data)
  return NextResponse.json({
    configured: Boolean(emailConfig.auth.user && emailConfig.auth.pass),
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    fromEmail: emailConfig.from.email,
    fromName: emailConfig.from.name,
  });
}
