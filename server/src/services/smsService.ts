/**
 * Phone OTP Service
 * Dispatches 6-digit OTP codes directly to mobile phone handsets via SMS / WhatsApp APIs.
 */

const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY || '';
const TEXTBELT_API_KEY = process.env.TEXTBELT_API_KEY || 'textbelt';
const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID || '';
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN || '';

export async function sendPhoneOTP(phoneNumber: string, code: string): Promise<boolean> {
  const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/\D/g, '')}`;
  const messageBody = `Your GiftVault verification code is: ${code}. Valid for 15 minutes.`;

  console.log(`📱 [PHONE OTP CODE FOR ${cleanPhone}]: ${code}`);

  // 1. Callmebot Free WhatsApp API (100% Free WhatsApp Delivery)
  if (CALLMEBOT_API_KEY) {
    try {
      const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&text=${encodeURIComponent(messageBody)}&apikey=${encodeURIComponent(CALLMEBOT_API_KEY)}`;
      const response = await fetch(callmebotUrl);
      if (response.ok) {
        console.log(`📱 [CALLMEBOT WHATSAPP SUCCESS] Dispatched free WhatsApp OTP to ${cleanPhone}`);
        return true;
      }
    } catch (err: any) {
      console.error(`❌ [CALLMEBOT EXCEPTION] Error sending WhatsApp to ${cleanPhone}:`, err?.message || err);
    }
  }

  // 2. UltraMsg WhatsApp API Dispatch
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
      }
    } catch (err: any) {
      console.error(`❌ [WHATSAPP EXCEPTION] Error sending WhatsApp to ${cleanPhone}:`, err?.message || err);
    }
  }

  // 3. Textbelt Free/Paid SMS API Dispatch
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
      console.log(`ℹ️ [TEXTBELT SMS INFO] ${data.error || 'Textbelt free daily quota reached'}.`);
    }
  } catch (err: any) {
    console.error(`❌ [TEXTBELT EXCEPTION] Error sending SMS to ${cleanPhone}:`, err?.message || err);
  }

  return true;
}
