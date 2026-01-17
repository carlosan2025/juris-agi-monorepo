import nodemailer from 'nodemailer';

// Email configuration from environment variables
export const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
  from: {
    email: process.env.SMTP_FROM_EMAIL || '',
    name: process.env.SMTP_FROM_NAME || 'Juris AGI',
  },
};

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

export function getEmailTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: emailConfig.auth,
    });
  }
  return transporter;
}

// Email sending interface
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

// Send email function
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transport = getEmailTransporter();

    const mailOptions = {
      from: `"${emailConfig.from.name}" <${emailConfig.from.email}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      replyTo: options.replyTo || emailConfig.from.email,
    };

    const result = await transport.sendMail(mailOptions);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Test email connection
export async function testEmailConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const transport = getEmailTransporter();
    await transport.verify();
    return { success: true };
  } catch (error) {
    console.error('Email connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

// Email templates
export const emailTemplates = {
  userInvitation: (inviterName: string, companyName: string, inviteLink: string) => ({
    subject: `You've been invited to join ${companyName} on Juris AGI`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">You've been invited!</h2>
        <p style="color: #4a4a4a; font-size: 16px;">
          ${inviterName} has invited you to join <strong>${companyName}</strong> on Juris AGI.
        </p>
        <p style="color: #4a4a4a; font-size: 16px;">
          Click the button below to accept the invitation and set up your account.
        </p>
        <div style="margin: 30px 0;">
          <a href="${inviteLink}"
             style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Accept Invitation
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #888; font-size: 12px;">
          Juris AGI - Intelligent Due Diligence Platform
        </p>
      </div>
    `,
    text: `
      You've been invited!

      ${inviterName} has invited you to join ${companyName} on Juris AGI.

      Click the link below to accept the invitation and set up your account:
      ${inviteLink}

      If you didn't expect this invitation, you can safely ignore this email.
    `,
  }),

  passwordReset: (resetLink: string) => ({
    subject: 'Reset your Juris AGI password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Reset your password</h2>
        <p style="color: #4a4a4a; font-size: 16px;">
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}"
             style="background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
            Reset Password
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #888; font-size: 12px;">
          Juris AGI - Intelligent Due Diligence Platform
        </p>
      </div>
    `,
    text: `
      Reset your password

      We received a request to reset your password. Click the link below to create a new password:
      ${resetLink}

      This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
    `,
  }),

  notificationDigest: (notifications: { title: string; message: string }[]) => ({
    subject: 'Your Juris AGI Activity Summary',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Activity Summary</h2>
        <p style="color: #4a4a4a; font-size: 16px;">
          Here's what happened since your last visit:
        </p>
        <div style="margin: 20px 0;">
          ${notifications.map(n => `
            <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
              <h4 style="margin: 0 0 5px 0; color: #1a1a1a;">${n.title}</h4>
              <p style="margin: 0; color: #4a4a4a; font-size: 14px;">${n.message}</p>
            </div>
          `).join('')}
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #888; font-size: 12px;">
          Juris AGI - Intelligent Due Diligence Platform
        </p>
      </div>
    `,
    text: notifications.map(n => `${n.title}\n${n.message}`).join('\n\n'),
  }),
};
