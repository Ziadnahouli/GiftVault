import { config } from '../config';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER || '';

/**
 * Dispatches a 6-digit OTP code to a mobile phone number via Twilio SMS or WhatsApp HTTP API.
 */
export async function sendPhoneOTP(phoneNumber: string, code: string): Promise<boolean> {
  const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/\D/g, '')}`;

  console.log(`📱 [PHONE OTP CODE FOR ${cleanPhone}]: ${code}`);

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
    try {
      const isWhatsApp = TWILIO_PHONE_NUMBER.startsWith('whatsapp:');
      const fromNumber = TWILIO_PHONE_NUMBER;
      const toNumber = isWhatsApp ? (cleanPhone.startsWith('whatsapp:') ? cleanPhone : `whatsapp:${cleanPhone}`) : cleanPhone;

      const bodyParams = new URLSearchParams({
        To: toNumber,
        From: fromNumber,
        Body: `Your GiftVault verification code is: ${code}. Valid for 15 minutes.`,
      });

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
      const authHeader = 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      const data = await response.json() as any;

      if (response.ok && data.sid) {
        console.log(`📱 [TWILIO SUCCESS] Dispatched SMS/OTP to ${cleanPhone} (SID: ${data.sid})`);
        return true;
      } else {
        console.error(`❌ [TWILIO ERROR] Failed to send SMS to ${cleanPhone}:`, JSON.stringify(data));
        return false;
      }
    } catch (err: any) {
      console.error(`❌ [TWILIO EXCEPTION] Error sending SMS to ${cleanPhone}:`, err?.message || err);
      return false;
    }
  } else {
    console.log(`ℹ️ [SMS SERVICE] Twilio credentials not set in Railway. Code logged above for phone ${cleanPhone}.`);
    return true;
  }
}
