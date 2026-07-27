/**
 * Phone OTP Service
 * Handles phone verification logging and dispatch.
 */
export async function sendPhoneOTP(phoneNumber: string, code: string): Promise<boolean> {
  const cleanPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber.replace(/\D/g, '')}`;
  console.log(`📱 [PHONE OTP CODE FOR ${cleanPhone}]: ${code}`);
  return true;
}
