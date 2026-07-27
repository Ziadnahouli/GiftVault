import nodemailer from 'nodemailer';
import { config } from '../config';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

let transporter: nodemailer.Transporter | null = null;

if (config.email.user && config.email.pass) {
  const isPort465 = config.email.port === 465;
  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: isPort465,
    family: 4, // Force IPv4 to prevent Railway Docker IPv6 ENETUNREACH errors
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  } as any);
} else {
  console.log('📧 SMTP credentials not configured. Emails will be logged to console in dev mode.');
}

function renderBaseTemplate(title: string, bodyContent: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #090d16;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .content {
      padding: 32px 28px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #f8fafc;
      margin-top: 0;
      margin-bottom: 16px;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 20px;
    }
    .btn {
      display: inline-block;
      padding: 14px 28px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      border-radius: 10px;
      text-align: center;
      margin: 16px 0;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }
    .badge {
      display: inline-block;
      padding: 6px 12px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #818cf8;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .footer {
      background-color: #0b0f19;
      padding: 20px 28px;
      text-align: center;
      border-top: 1px solid #1f2937;
      font-size: 12px;
      color: #64748b;
    }
    .footer a {
      color: #818cf8;
      text-decoration: none;
    }
    .alert-box {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 10px;
      padding: 16px;
      color: #fca5a5;
      margin: 16px 0;
      font-size: 14px;
    }
    .code-box {
      font-size: 24px;
      letter-spacing: 4px;
      font-weight: 700;
      background: #1e293b;
      padding: 12px 24px;
      border-radius: 8px;
      display: inline-block;
      color: #38bdf8;
      margin: 16px 0;
      border: 1px dashed #334155;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎁 GiftVault</div>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      <p style="margin: 0;">© ${new Date().getFullYear()} GiftVault Inc. All rights reserved.</p>
      <p style="margin: 6px 0 0 0;">If you did not request this email, please secure your account immediately.</p>
    </div>
  </div>
</body>
</html>
  `;
}

async function sendMail(to: string, subject: string, html: string): Promise<boolean> {
  // Skip sending network email to internal dummy placeholder domains
  if (!to || to.endsWith('.internal') || to.endsWith('.user') || to.endsWith('@giftvault.com')) {
    console.log(`ℹ️ [EMAIL SERVICE] Skipping email to internal dummy address: ${to}`);
    return true;
  }

  // 1. Primary Email Engine: Resend REST API (HTTPS Port 443 - Never blocked by Railway)
  if (RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: [to],
          subject,
          html,
        }),
      });

      const data = await response.json() as any;

      if (response.ok && data.id) {
        console.log(`✉️ [RESEND SUCCESS] Sent email to ${to} (ID: ${data.id})`);
        return true;
      } else {
        console.error(`❌ [RESEND API ERROR] Failed to send email to ${to}:`, data);
      }
    } catch (resendErr: any) {
      console.error(`❌ [RESEND EXCEPTION] Error sending email to ${to}:`, resendErr?.message || resendErr);
    }
  }

  // 2. Fallback: Nodemailer SMTP Transport
  if (transporter) {
    try {
      const fromHeader = (config.email.from && !config.email.from.includes('noreply@giftvault.com'))
        ? config.email.from
        : (config.email.user ? `GiftVault <${config.email.user}>` : 'GiftVault <noreply@giftvault.com>');

      await transporter.sendMail({
        from: fromHeader,
        to,
        subject,
        html,
      });
      console.log(`✉️ [EMAIL SERVICE] Successfully sent email to ${to}`);
      return true;
    } catch (err: any) {
      console.error(`Failed to send email to ${to}:`, err.message);
      return false;
    }
  } else {
    console.log(`\n============== MOCK EMAIL LOG ==============`);
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`============================================\n`);
    return true;
  }
}

export async function sendWelcomeEmail(name: string, to: string): Promise<boolean> {
  const html = renderBaseTemplate(
    'Welcome to GiftVault',
    `
      <div class="badge">Welcome Aboard</div>
      <h1>Welcome to GiftVault, ${name}!</h1>
      <p>We are thrilled to have you with us. GiftVault lets you seamlessly purchase, manage, and redeem digital gift cards worldwide with top-tier security.</p>
      <p>Get started by exploring our featured gift cards and exclusive deals.</p>
      <a href="${config.clientUrl}/shop" class="btn">Explore Shop</a>
    `
  );
  return sendMail(to, 'Welcome to GiftVault! 🎁', html);
}

export async function sendVerificationEmail(name: string, to: string, verificationLink: string): Promise<boolean> {
  const html = renderBaseTemplate(
    'Verify Your Email',
    `
      <div class="badge">Account Security</div>
      <h1>Verify Your Email Address</h1>
      <p>Hi ${name}, thank you for registering with GiftVault. Please verify your email address to activate all features on your account.</p>
      <a href="${verificationLink}" class="btn">Verify Email Address</a>
      <p>This verification link will expire in 24 hours.</p>
      <p style="font-size: 12px; color: #64748b;">If the button above does not work, copy and paste this link into your browser:<br><a href="${verificationLink}" style="color: #818cf8; word-break: break-all;">${verificationLink}</a></p>
    `
  );
  return sendMail(to, 'Verify Your Email Address - GiftVault', html);
}

export async function sendVerificationCodeEmail(name: string, to: string, code: string): Promise<boolean> {
  const html = renderBaseTemplate(
    'Your Verification Code',
    `
      <div class="badge">Account Verification</div>
      <h1>Your 6-Digit Verification Code</h1>
      <p>Hi ${name}, thank you for registering with GiftVault. Use the 6-digit code below to complete your verification:</p>
      <div style="text-align: center; margin: 20px 0;">
        <div class="code-box" style="font-size: 32px; letter-spacing: 6px; font-family: monospace;">${code}</div>
      </div>
      <p>This code is valid for 15 minutes. For your security, do not share this code with anyone.</p>
    `
  );
  return sendMail(to, `${code} is your GiftVault Verification Code`, html);
}

export async function sendPasswordResetEmail(name: string, to: string, resetLink: string): Promise<boolean> {
  const html = renderBaseTemplate(
    'Reset Your Password',
    `
      <div class="badge">Password Reset</div>
      <h1>Password Reset Request</h1>
      <p>Hi ${name}, we received a request to reset your password for your GiftVault account.</p>
      <a href="${resetLink}" class="btn">Reset Password</a>
      <p>This link is valid for 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
      <p style="font-size: 12px; color: #64748b;">Link: <a href="${resetLink}" style="color: #818cf8; word-break: break-all;">${resetLink}</a></p>
    `
  );
  return sendMail(to, 'Reset Your GiftVault Password', html);
}

export async function sendEmailChangedNotification(name: string, oldEmail: string, newEmail: string): Promise<boolean> {
  const html = renderBaseTemplate(
    'Email Address Updated',
    `
      <div class="badge">Security Notification</div>
      <h1>Email Address Changed</h1>
      <p>Hi ${name}, your GiftVault account email address was recently changed from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.</p>
      <div class="alert-box">If you did not perform this change, please contact our support team immediately to recover your account.</div>
    `
  );
  return sendMail(oldEmail, 'Security Alert: Email Address Changed', html);
}

export async function sendPhoneChangedNotification(name: string, to: string, newPhone: string): Promise<boolean> {
  const html = renderBaseTemplate(
    'Phone Number Updated',
    `
      <div class="badge">Security Notification</div>
      <h1>Phone Number Updated</h1>
      <p>Hi ${name}, your registered phone number was updated to <strong>${newPhone}</strong>.</p>
      <p>If you made this change, no further action is required.</p>
    `
  );
  return sendMail(to, 'Security Alert: Phone Number Updated', html);
}

export async function sendSecurityAlert(name: string, to: string, details: string): Promise<boolean> {
  const html = renderBaseTemplate(
    'Security Alert',
    `
      <div class="badge" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: #f87171;">Account Alert</div>
      <h1>Security Alert</h1>
      <p>Hi ${name}, we detected important security activity on your account:</p>
      <div class="alert-box">${details}</div>
      <p>If this was not you, please log in and change your password immediately.</p>
    `
  );
  return sendMail(to, 'GiftVault Security Alert', html);
}

export async function sendNewLoginAlert(name: string, to: string, deviceInfo: { ip: string; browser: string; os: string; time: string }): Promise<boolean> {
  const html = renderBaseTemplate(
    'New Login Detected',
    `
      <div class="badge">New Session</div>
      <h1>New Login to Your Account</h1>
      <p>Hi ${name}, your GiftVault account was signed into from a new device.</p>
      <div style="background: #1e293b; padding: 16px; border-radius: 10px; margin: 16px 0; font-size: 14px;">
        <p style="margin: 4px 0; color: #cbd5e1;"><strong>Device:</strong> ${deviceInfo.browser} on ${deviceInfo.os}</p>
        <p style="margin: 4px 0; color: #cbd5e1;"><strong>IP Address:</strong> ${deviceInfo.ip}</p>
        <p style="margin: 4px 0; color: #cbd5e1;"><strong>Time:</strong> ${deviceInfo.time}</p>
      </div>
      <p>If this was you, you can ignore this email. If you suspect unauthorized access, revoke the session from your Security Settings.</p>
    `
  );
  return sendMail(to, 'New Login Alert - GiftVault', html);
}
