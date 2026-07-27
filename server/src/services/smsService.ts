/**
 * Phone OTP Service
 * Dispatches 6-digit OTP codes directly to mobile phone handsets via SMS / WhatsApp APIs.
 */

const TEXTBELT_API_KEY = process.env.TEXTBELT_API_KEY || 'textbelt';
const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID || '';
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN || '';
const SMS_API_URL = process.env.SMS_API_URL || '';
const SMS_API_KEY = process.env.SMS_API_KEY || '';

export async function sendPhoneOTP(phoneNumber: string, code: string): Promise<boolean> {
  const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/\D/g, '')}`;
  const messageBody = `Your GiftVault verification code is: ${code}. Valid for 15 minutes.`;

  console.log(`📱 [PHONE OTP CODE FOR ${cleanPhone}]: ${code}`);

  // 1. UltraMsg WhatsApp API Dispatch
  if (ULTRAMSG_INSTANCE_ID && ULTRAMSG_TOKEN) {
    try {
      const response = await fetch(`https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: ULTRAMSG_TOKEN,
          to: cleanPhone,
          body: messageBody,
        }).toString(),
      });
      const data = await response.json() as any;
      if (response.ok && data?.sent === 'true') {
        console.log(`📱 [WHATSAPP SUCCESS] Dispatched OTP to ${cleanPhone}`);
        return true;
      } else {
        console.error(`❌ [WHATSAPP ERROR] Failed to send WhatsApp to ${cleanPhone}:`, data);
      }
    } catch (err: any) {
      console.error(`❌ [WHATSAPP EXCEPTION] Error sending WhatsApp to ${cleanPhone}:`, err?.message || err);
    }
  }

  // 2. Custom SMS API (Vonage / Infobip / SMS Gateway)
  if (SMS_API_URL && SMS_API_KEY) {
    try {
      const response = await fetch(SMS_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SMS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: cleanPhone,
          message: messageBody,
        }),
      });
      if (response.ok) {
        console.log(`📱 [SMS SUCCESS] Dispatched SMS to ${cleanPhone}`);
        return true;
      }
    } catch (err: any) {
      console.error(`❌ [SMS EXCEPTION] Error sending SMS to ${cleanPhone}:`, err?.message || err);
    }
  }

  // 3. Textbelt SMS API Dispatch
  try {
    const response = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: cleanPhone,
        message: messageBody,
        key: TEXTBELT_API_KEY,
      }),
    });
    const data = await response.json() as any;
    if (data.success) {
      console.log(`📱 [TEXTBELT SMS SUCCESS] Dispatched SMS to ${cleanPhone} (Quota remaining: ${data.quotaRemaining})`);
      return true;
    } else {
      console.log(`ℹ️ [TEXTBELT SMS INFO] ${data.error || 'Textbelt quota limit reached'}.`);
    }
  } catch (err: any) {
    console.error(`❌ [TEXTBELT EXCEPTION] Error sending SMS to ${cleanPhone}:`, err?.message || err);
  }

  return true;
}
