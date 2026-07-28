/**
 * Phone OTP Service
 * Dispatches 6-digit OTP codes directly to mobile phone handsets via SMS / WhatsApp APIs.
 */

const VONAGE_API_KEY = process.env.VONAGE_API_KEY || '';
const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET || '';
const GREEN_API_INSTANCE_ID = process.env.GREEN_API_INSTANCE_ID || '';
const GREEN_API_TOKEN = process.env.GREEN_API_TOKEN || '';
const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY || '';
const TEXTBELT_API_KEY = process.env.TEXTBELT_API_KEY || 'textbelt';

export async function sendPhoneOTP(phoneNumber: string, code: string): Promise<boolean> {
  const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/\D/g, '')}`;
  const messageBody = `Your GiftVault verification code is: ${code}. Valid for 15 minutes.`;

  console.log(`📱 [PHONE OTP CODE FOR ${cleanPhone}]: ${code}`);

  // 1. Vonage (Nexmo) SMS API Dispatch (Free $2.00 trial credit)
  if (VONAGE_API_KEY && VONAGE_API_SECRET) {
    try {
      const response = await fetch('https://rest.nexmo.com/sms/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: VONAGE_API_KEY,
          api_secret: VONAGE_API_SECRET,
          from: 'GiftVault',
          to: cleanPhone.replace('+', ''),
          text: messageBody,
        }),
      });
      const data = await response.json() as any;
      if (response.ok && data?.messages?.[0]?.status === '0') {
        console.log(`📱 [VONAGE SMS SUCCESS] Dispatched SMS OTP to ${cleanPhone}`);
        return true;
      } else {
        console.error(`❌ [VONAGE SMS ERROR] Failed to send SMS to ${cleanPhone}:`, JSON.stringify(data));
      }
    } catch (err: any) {
      console.error(`❌ [VONAGE SMS EXCEPTION] Error sending SMS to ${cleanPhone}:`, err?.message || err);
    }
  }

  // 2. Green API Free WhatsApp Dispatch
  if (GREEN_API_INSTANCE_ID && GREEN_API_TOKEN) {
    try {
      const response = await fetch(`https://api.green-api.com/waInstance${GREEN_API_INSTANCE_ID}/sendMessage/${GREEN_API_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${cleanPhone.replace('+', '')}@c.us`,
          message: messageBody,
        }),
      });
      const data = await response.json() as any;
      if (response.ok && data?.idMessage) {
        console.log(`📱 [GREEN API WHATSAPP SUCCESS] Dispatched WhatsApp OTP to ${cleanPhone}`);
        return true;
      }
    } catch (err: any) {
      console.error(`❌ [GREEN API EXCEPTION] Error sending WhatsApp to ${cleanPhone}:`, err?.message || err);
    }
  }

  // 1. Callmebot Free WhatsApp API Dispatch
  if (CALLMEBOT_API_KEY) {
    try {
      const digitsOnly = cleanPhone.replace(/\D/g, '');
      const callmebotPhone = process.env.CALLMEBOT_PHONE || digitsOnly;
      const callmebotUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(callmebotPhone)}&text=${encodeURIComponent(messageBody)}&apikey=${encodeURIComponent(CALLMEBOT_API_KEY)}`;
      const response = await fetch(callmebotUrl);
      const respText = await response.text();
      if (response.ok && (respText.includes('Message queued') || respText.includes('Message sent') || respText.includes('OK') || response.status === 200)) {
        console.log(`📱 [CALLMEBOT WHATSAPP SUCCESS] Dispatched free WhatsApp OTP code ${code} to ${callmebotPhone}`);
        return true;
      } else {
        console.warn(`⚠️ [CALLMEBOT API RESPONSE] ${respText}`);
      }
    } catch (err: any) {
      console.error(`❌ [CALLMEBOT EXCEPTION] Error sending WhatsApp to ${cleanPhone}:`, err?.message || err);
    }
  }

  // 4. Textbelt Free/Paid SMS API Dispatch Fallback
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
    }
  } catch (err: any) {
    console.error(`❌ [TEXTBELT EXCEPTION] Error sending SMS to ${cleanPhone}:`, err?.message || err);
  }

  return true;
}
