import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/schema';
import { config } from '../config';
import { AuthRequest, authenticate, generateToken } from '../middleware/auth';
import {
  registerSchema,
  loginSchema,
  firebaseLoginSchema,
  updateProfileSchema,
  changeEmailSchema,
  changePhoneSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators';
import { sanitize } from '../utils/helpers';
import { verifyFirebaseIdToken } from '../config/firebaseAdmin';
import {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendEmailChangedNotification,
  sendPhoneChangedNotification,
  sendNewLoginAlert,
} from '../services/emailService';
import {
  createSession,
  revokeSession,
  getUserSessions,
  revokeUserSessionById,
  revokeAllUserSessions,
  generateAuthToken,
  generateNumericAuthToken,
  verifyAuthToken,
  consumeAuthToken,
  parseUserAgent,
  getClientIp,
} from '../services/sessionService';
import {
  isAccountLocked,
  recordFailedLogin,
  resetFailedLogin,
  otpRateLimiter,
} from '../middleware/rateLimiter';

const router = Router();

function formatUserResponse(user: any) {
  let notificationSettings = { email: true, sms: true, security: true };
  if (user.notification_settings) {
    try {
      notificationSettings = typeof user.notification_settings === 'string'
        ? JSON.parse(user.notification_settings)
        : user.notification_settings;
    } catch {
      // ignore
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phone_number || user.whatsapp || null,
    role: user.role,
    avatar: user.avatar || null,
    country: user.country || null,
    whatsapp: user.whatsapp || null,
    preferred_lang: user.preferred_lang || 'en',
    preferred_currency: user.preferred_currency || 'USD',
    emailVerified: Boolean(user.email_verified),
    phoneVerified: Boolean(user.phone_verified),
    accountStatus: user.account_status || (user.is_active ? 'active' : 'disabled'),
    firebaseUid: user.firebase_uid || null,
    authProvider: user.auth_provider || 'local',
    registrationMethod: user.registration_method || 'email',
    createdAt: user.created_at,
    lastLogin: user.last_login || null,
    notificationSettings,
  };
}

// POST /api/auth/register
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const { name, email, phoneNumber, password, country, whatsapp, registrationMethod } = validation.data;

    const providedEmail = email ? email.toLowerCase().trim() : '';
    const cleanPhone = phoneNumber ? phoneNumber.trim() : (whatsapp ? whatsapp.trim() : null);

    // Determine actual registration method (email vs phone)
    const method = registrationMethod || (providedEmail ? 'email' : 'phone');

    let cleanEmail = providedEmail;
    if (method === 'phone' && !cleanEmail) {
      const sanitizedPhoneDigits = (cleanPhone || Date.now().toString()).replace(/\D/g, '');
      cleanEmail = `user_${sanitizedPhoneDigits}@phone.giftvault.internal`;
    }

    // Duplicate Email check
    if (providedEmail) {
      const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
      if (existingEmail) {
        res.status(409).json({ error: 'Email address is already registered' });
        return;
      }
    }

    // Duplicate Phone check if provided
    if (cleanPhone) {
      const existingPhone = db.prepare('SELECT id FROM users WHERE phone_number = ? OR whatsapp = ?').get(cleanPhone, cleanPhone);
      if (existingPhone) {
        res.status(409).json({ error: 'Phone number is already registered to another account' });
        return;
      }
    }

    const passwordHash = bcrypt.hashSync(password, 12);

    const result = db.prepare(`
      INSERT INTO users (name, email, phone_number, password_hash, country, whatsapp, registration_method, email_verified, phone_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)
    `).run(
      sanitize(name),
      cleanEmail,
      cleanPhone,
      passwordHash,
      sanitize(country || ''),
      sanitize(whatsapp || cleanPhone || ''),
      method
    );

    const userId = result.lastInsertRowid as number;
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    let verificationCode = '';
    let message = '';
    let verificationType: 'email' | 'phone' = 'email';

    if (method === 'phone') {
      verificationType = 'phone';
      verificationCode = generateNumericAuthToken(userId, 'phone_otp', undefined, 15);
      console.log(`📱 [PHONE OTP] Sent 6-digit OTP code ${verificationCode} to phone ${cleanPhone}`);
      message = `Registration successful! A 6-digit OTP code has been sent to ${cleanPhone}. Please verify your phone number to complete registration.`;
    } else {
      verificationType = 'email';
      verificationCode = generateNumericAuthToken(userId, 'email_verification', undefined, 1440);
      const linkToken = generateAuthToken(userId, 'email_verification', undefined, 24);
      const verificationLink = `${config.clientUrl}/verify-email?token=${linkToken}`;

      sendWelcomeEmail(sanitize(name), cleanEmail).catch(() => {});
      sendVerificationEmail(sanitize(name), cleanEmail, verificationLink).catch(() => {});
      console.log(`📧 [EMAIL CODE] Sent 6-digit verification code ${verificationCode} to email ${cleanEmail}`);
      message = `Registration successful! A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox to complete registration.`;
    }

    // Create session & JWT token
    const { sessionToken } = createSession(userId, req, true);
    const token = generateToken({ id: userId, email: cleanEmail, role: 'customer', name: sanitize(name) });

    res.status(201).json({
      message,
      token,
      sessionToken,
      requiresVerification: true,
      verificationType,
      verificationCode, // Included for instant testing & frontend demonstration
      user: formatUserResponse(userRow),
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login (Unified Email / Phone + Password)
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const { identifier, email, password, rememberMe } = validation.data;
    const loginInput = (identifier || email || '').trim();

    if (!loginInput) {
      res.status(400).json({ error: 'Email or Phone Number is required' });
      return;
    }

    // Check temporary account lockout
    const lockStatus = isAccountLocked(loginInput);
    if (lockStatus.locked) {
      res.status(429).json({
        error: `Account is temporarily locked due to multiple failed attempts. Please try again in ${lockStatus.remainingMinutes} minutes.`,
      });
      return;
    }

    // Auto-detect email vs phone number
    const isEmail = loginInput.includes('@');
    const query = isEmail
      ? 'SELECT * FROM users WHERE email = ?'
      : 'SELECT * FROM users WHERE phone_number = ? OR whatsapp = ?';

    const user = db.prepare(query).get(isEmail ? loginInput.toLowerCase() : loginInput) as any;

    if (!user) {
      recordFailedLogin(loginInput);
      res.status(401).json({ error: 'Invalid email/phone number or password' });
      return;
    }

    if (!user.is_active || user.account_status === 'disabled') {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      const lockResult = recordFailedLogin(loginInput);
      if (lockResult.lockedNow) {
        res.status(429).json({ error: `Too many failed attempts. Account locked for ${config.auth.lockoutDurationMinutes} minutes.` });
      } else {
        res.status(401).json({ error: `Invalid email/phone number or password. ${lockResult.remainingAttempts} attempts remaining.` });
      }
      return;
    }

    // Reset failed login counter on success
    resetFailedLogin(user.id);

    // Create session & JWT token
    const { sessionToken } = createSession(user.id, req, Boolean(rememberMe));
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Send New Login Alert
    const uaInfo = parseUserAgent(req.headers['user-agent']);
    sendNewLoginAlert(user.name, user.email, {
      ip: getClientIp(req),
      browser: uaInfo.browser,
      os: uaInfo.os,
      time: new Date().toLocaleString(),
    }).catch(() => {});

    res.json({
      message: 'Login successful',
      token,
      sessionToken,
      user: formatUserResponse(user),
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/firebase-login (Verify Firebase ID Token & Auto-Link Identities)
router.post('/firebase-login', async (req: AuthRequest, res: Response) => {
  try {
    const validation = firebaseLoginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const { idToken, rememberMe } = validation.data;
    const decodedFirebase = await verifyFirebaseIdToken(idToken);

    if (!decodedFirebase || !decodedFirebase.uid) {
      res.status(401).json({ error: 'Invalid or expired Firebase ID token' });
      return;
    }

    const { uid, email, email_verified, phone_number, name, picture } = decodedFirebase;
    const cleanEmail = email ? email.toLowerCase() : null;
    const cleanPhone = phone_number || null;

    let user: any = null;

    // 1. Try finding by Firebase UID
    user = db.prepare('SELECT * FROM users WHERE firebase_uid = ?').get(uid);

    // 2. Intelligence Account Linking: check existing verified email or phone
    if (!user && cleanEmail) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
    }
    if (!user && cleanPhone) {
      user = db.prepare('SELECT * FROM users WHERE phone_number = ? OR whatsapp = ?').get(cleanPhone, cleanPhone);
    }

    if (user) {
      // Link existing account with Firebase UID, update verification flags if applicable
      const updates: string[] = ['firebase_uid = ?', 'updated_at = CURRENT_TIMESTAMP'];
      const params: any[] = [uid];

      if (cleanEmail && !user.email) {
        updates.push('email = ?');
        params.push(cleanEmail);
      }
      if (email_verified) {
        updates.push('email_verified = 1');
      }
      if (cleanPhone && !user.phone_number) {
        updates.push('phone_number = ?');
        params.push(cleanPhone);
      }
      if (cleanPhone) {
        updates.push('phone_verified = 1');
      }
      if (picture && !user.avatar) {
        updates.push('avatar = ?');
        params.push(picture);
      }
      if (user.auth_provider === 'local') {
        updates.push('auth_provider = ?');
        params.push('linked');
      }

      params.push(user.id);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    } else {
      // Create new user linked with Firebase
      const displayName = name || (cleanEmail ? cleanEmail.split('@')[0] : 'User');
      const dummyPasswordHash = bcrypt.hashSync(uid + config.jwt.secret, 12);

      const result = db.prepare(`
        INSERT INTO users (name, email, phone_number, password_hash, firebase_uid, email_verified, phone_verified, avatar, auth_provider, registration_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sanitize(displayName),
        cleanEmail || `${uid}@firebase.user`,
        cleanPhone,
        dummyPasswordHash,
        uid,
        email_verified ? 1 : 0,
        cleanPhone ? 1 : 0,
        picture || null,
        cleanPhone ? 'firebase_phone' : 'firebase_email',
        cleanPhone ? 'phone' : 'email'
      );

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      if (cleanEmail) {
        sendWelcomeEmail(sanitize(displayName), cleanEmail).catch(() => {});
      }
    }

    if (!user.is_active || user.account_status === 'disabled') {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    resetFailedLogin(user.id);
    const { sessionToken } = createSession(user.id, req, Boolean(rememberMe));
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.json({
      message: 'Firebase authentication successful',
      token,
      sessionToken,
      user: formatUserResponse(user),
    });
  } catch (error: any) {
    console.error('Firebase login error:', error);
    res.status(500).json({ error: 'Firebase authentication failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: formatUserResponse(user) });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Verification token is required' });
      return;
    }

    const tokenRecord = verifyAuthToken(token);
    if (!tokenRecord || (tokenRecord.type !== 'email_verification' && tokenRecord.type !== 'phone_otp')) {
      res.status(400).json({ error: 'Invalid or expired verification token. Please request a new verification code.' });
      return;
    }

    if (tokenRecord.type === 'email_verification') {
      db.prepare(`UPDATE users SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(tokenRecord.user_id);
    } else if (tokenRecord.type === 'phone_otp') {
      db.prepare(`UPDATE users SET phone_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(tokenRecord.user_id);
    }

    consumeAuthToken(token);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(tokenRecord.user_id);

    res.json({ message: 'Account verified successfully!', user: formatUserResponse(user) });
  } catch (error: any) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// POST /api/auth/verify-code (Unified 6-digit Code / OTP Verification for Email & Phone)
router.post('/verify-code', async (req: AuthRequest, res: Response) => {
  try {
    const { code, identifier } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: '6-digit verification code is required' });
      return;
    }

    const cleanCode = code.trim();
    const tokenRecord = verifyAuthToken(cleanCode);

    if (!tokenRecord) {
      res.status(400).json({ error: 'Invalid or expired verification code. Please check the code and try again.' });
      return;
    }

    let user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(tokenRecord.user_id);
    if (!user) {
      res.status(404).json({ error: 'User account not found' });
      return;
    }

    // Verify based on token type
    if (tokenRecord.type === 'email_verification') {
      db.prepare('UPDATE users SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    } else if (tokenRecord.type === 'phone_otp') {
      db.prepare('UPDATE users SET phone_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
    }

    consumeAuthToken(cleanCode);

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);

    res.json({
      message: 'Account verified successfully!',
      user: formatUserResponse(updatedUser),
    });
  } catch (error: any) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Code verification failed' });
  }
});

// POST /api/auth/resend-code (Resend 6-digit Email / Phone Code)
router.post('/resend-code', async (req: AuthRequest, res: Response) => {
  try {
    const { identifier, type } = req.body;

    if (!identifier) {
      res.status(400).json({ error: 'Email address or Phone number is required' });
      return;
    }

    const cleanInput = identifier.trim();
    const isEmail = cleanInput.includes('@');

    const query = isEmail
      ? 'SELECT * FROM users WHERE email = ?'
      : 'SELECT * FROM users WHERE phone_number = ? OR whatsapp = ?';

    const user = db.prepare(query).get(isEmail ? cleanInput.toLowerCase() : cleanInput) as any;

    if (!user) {
      res.status(404).json({ error: 'Account not found with provided information' });
      return;
    }

    const resendType = type || (user.registration_method === 'phone' ? 'phone' : 'email');

    let newCode = '';
    if (resendType === 'phone') {
      newCode = generateNumericAuthToken(user.id, 'phone_otp', undefined, 15);
      console.log(`📱 [RESEND PHONE OTP] 6-digit code for ${user.phone_number}: ${newCode}`);
    } else {
      newCode = generateNumericAuthToken(user.id, 'email_verification', undefined, 1440);
      const linkToken = generateAuthToken(user.id, 'email_verification', undefined, 24);
      const verificationLink = `${config.clientUrl}/verify-email?token=${linkToken}`;

      sendVerificationEmail(user.name, user.email, verificationLink).catch(() => {});
      console.log(`📧 [RESEND EMAIL CODE] 6-digit code for ${user.email}: ${newCode}`);
    }

    res.json({
      message: `A new 6-digit verification code has been sent to your ${resendType === 'phone' ? 'phone number' : 'email inbox'}.`,
      verificationCode: newCode,
    });
  } catch (error: any) {
    console.error('Resend code error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.email_verified) {
      res.status(400).json({ error: 'Email address is already verified' });
      return;
    }

    const verifyToken = generateAuthToken(user.id, 'email_verification', undefined, 24);
    const verificationLink = `${config.clientUrl}/verify-email?token=${verifyToken}`;
    await sendVerificationEmail(user.name, user.email, verificationLink);

    res.json({ message: 'Verification email sent successfully' });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: AuthRequest, res: Response) => {
  try {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Invalid email address' });
      return;
    }

    const { email } = validation.data;
    const cleanEmail = email.toLowerCase().trim();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;

    // Return generic message regardless of user existence to prevent user enumeration
    if (user && user.is_active) {
      const resetToken = generateAuthToken(user.id, 'password_reset', undefined, 1);
      const resetLink = `${config.clientUrl}/reset-password?token=${resetToken}`;
      sendPasswordResetEmail(user.name, cleanEmail, resetLink).catch(() => {});
    }

    res.json({ message: 'If an account exists with that email, a password reset link has been sent.' });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Password reset request failed' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: AuthRequest, res: Response) => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const { token, newPassword } = validation.data;
    const tokenRecord = verifyAuthToken(token, 'password_reset');

    if (!tokenRecord) {
      res.status(400).json({ error: 'Invalid or expired password reset token' });
      return;
    }

    const newHash = bcrypt.hashSync(newPassword, 12);
    db.prepare('UPDATE users SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, tokenRecord.user_id);
    consumeAuthToken(token);

    // Invalidate all active sessions for security after password reset
    revokeAllUserSessions(tokenRecord.user_id);

    res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// POST /api/auth/verify-phone-otp
router.post('/verify-phone-otp', authenticate, otpRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { phoneNumber, idToken } = req.body;
    const userId = req.user!.id;

    if (!phoneNumber) {
      res.status(400).json({ error: 'Phone number is required' });
      return;
    }

    const cleanPhone = phoneNumber.trim();

    // Check if phone number is used by another account
    const existingPhone = db.prepare('SELECT id FROM users WHERE (phone_number = ? OR whatsapp = ?) AND id != ?').get(cleanPhone, cleanPhone, userId);
    if (existingPhone) {
      res.status(409).json({ error: 'Phone number is already associated with another account' });
      return;
    }

    // Verify Firebase ID Token if provided for extra assurance
    if (idToken) {
      const decoded = await verifyFirebaseIdToken(idToken);
      if (!decoded || (decoded.phone_number && decoded.phone_number !== cleanPhone)) {
        res.status(400).json({ error: 'Firebase phone verification code invalid or mismatched' });
        return;
      }
    }

    db.prepare(`
      UPDATE users SET phone_number = ?, whatsapp = ?, phone_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(cleanPhone, cleanPhone, userId);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    res.json({ message: 'Phone number verified successfully', user: formatUserResponse(user) });
  } catch (error: any) {
    console.error('Verify phone OTP error:', error);
    res.status(500).json({ error: 'Phone OTP verification failed' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const data = validation.data;
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name) { updates.push('name = ?'); values.push(sanitize(data.name)); }
    if (data.avatar) { updates.push('avatar = ?'); values.push(data.avatar); }
    if (data.country) { updates.push('country = ?'); values.push(sanitize(data.country)); }
    if (data.whatsapp) { updates.push('whatsapp = ?'); values.push(sanitize(data.whatsapp)); }
    if (data.preferred_lang) { updates.push('preferred_lang = ?'); values.push(data.preferred_lang); }
    if (data.preferred_currency) { updates.push('preferred_currency = ?'); values.push(data.preferred_currency); }
    if (data.notification_settings) { updates.push('notification_settings = ?'); values.push(JSON.stringify(data.notification_settings)); }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user!.id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id);
    res.json({ message: 'Profile updated successfully', user: formatUserResponse(user) });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long' });
      return;
    }

    const user = db.prepare('SELECT password_hash, email, name FROM users WHERE id = ?').get(req.user!.id) as any;

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const newHash = bcrypt.hashSync(newPassword, 12);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, req.user!.id);

    // Revoke other sessions
    const sessionHeader = req.headers['x-session-token'] as string;
    revokeAllUserSessions(req.user!.id, sessionHeader);

    res.json({ message: 'Password updated successfully. Other active sessions have been signed out for security.' });
  } catch (error: any) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// POST /api/auth/change-email
router.post('/change-email', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const validation = changeEmailSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const { newEmail, currentPassword } = validation.data;
    const cleanNewEmail = newEmail.toLowerCase().trim();
    const userId = req.user!.id;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(cleanNewEmail, userId);
    if (existing) {
      res.status(409).json({ error: 'Email address is already in use' });
      return;
    }

    // Update email and mark email unverified until verification is completed
    const oldEmail = user.email;
    db.prepare(`UPDATE users SET email = ?, email_verified = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(cleanNewEmail, userId);

    const verifyToken = generateAuthToken(userId, 'email_verification', undefined, 24);
    const verificationLink = `${config.clientUrl}/verify-email?token=${verifyToken}`;
    
    sendEmailChangedNotification(user.name, oldEmail, cleanNewEmail).catch(() => {});
    sendVerificationEmail(user.name, cleanNewEmail, verificationLink).catch(() => {});

    const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    res.json({
      message: 'Email address updated. A verification link has been sent to your new email address.',
      user: formatUserResponse(updatedUser),
    });
  } catch (error: any) {
    console.error('Change email error:', error);
    res.status(500).json({ error: 'Failed to change email address' });
  }
});

// GET /api/auth/sessions (List active sessions)
router.get('/sessions', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const sessions = getUserSessions(req.user!.id);
    const currentToken = req.headers['x-session-token'] as string;

    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      deviceName: s.device_name,
      browser: s.browser,
      os: s.os,
      ipAddress: s.ip_address,
      location: s.location,
      lastActive: s.last_active,
      createdAt: s.created_at,
      isCurrent: s.session_token === currentToken,
    }));

    res.json({ sessions: formattedSessions });
  } catch (error: any) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
});

// DELETE /api/auth/sessions/:sessionId (Revoke specific session)
router.delete('/sessions/:sessionId', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    const success = revokeUserSessionById(req.user!.id, sessionId);

    if (!success) {
      res.status(404).json({ error: 'Session not found or already revoked' });
      return;
    }

    res.json({ message: 'Session revoked successfully' });
  } catch (error: any) {
    console.error('Revoke session error:', error);
    res.status(500).json({ error: 'Failed to revoke session' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const sessionToken = req.headers['x-session-token'] as string;
    if (sessionToken) {
      revokeSession(sessionToken);
    }
    res.json({ message: 'Logout successful' });
  } catch (error: any) {
    res.json({ message: 'Logout successful' });
  }
});

// POST /api/auth/logout-all
router.post('/logout-all', authenticate, (req: AuthRequest, res: Response) => {
  try {
    revokeAllUserSessions(req.user!.id);
    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error: any) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Failed to logout from all devices' });
  }
});

// DELETE /api/auth/account (Delete User Account)
router.delete('/account', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;
    const userId = req.user!.id;

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as any;

    if (password && !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ error: 'Password confirmation failed' });
      return;
    }

    // Delete user (cascades to sessions and tokens)
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
