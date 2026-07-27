import crypto from 'crypto';
import { Request } from 'express';
import db from '../database/schema';

export interface UserSession {
  id: number;
  user_id: number;
  session_token: string;
  refresh_token: string | null;
  device_name: string;
  browser: string;
  os: string;
  ip_address: string;
  location: string;
  last_active: string;
  expires_at: string;
  created_at: string;
}

export function parseUserAgent(userAgentHeader?: string): { device: string; browser: string; os: string } {
  const ua = userAgentHeader || '';
  
  let browser = 'Unknown Browser';
  if (/chrome|crios|crmo/i.test(ua) && !/edg|opr|opera/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome|crios|crmo/i.test(ua)) browser = 'Safari';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';

  let os = 'Unknown OS';
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  let device = 'Desktop';
  if (/mobile|android|iphone|ipod/i.test(ua)) device = 'Mobile';
  else if (/ipad|tablet/i.test(ua)) device = 'Tablet';

  return { device, browser, os };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',');
    return ips[0].trim();
  }
  return req.socket?.remoteAddress || '127.0.0.1';
}

export function createSession(userId: number, req: Request, rememberMe = false): { sessionToken: string; refreshToken: string } {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const refreshToken = crypto.randomBytes(32).toString('hex');
  
  const { device, browser, os } = parseUserAgent(req.headers['user-agent']);
  const ipAddress = getClientIp(req);
  
  // Expiration: 30 days for Remember Me, 7 days default
  const expirationDays = rememberMe ? 30 : 7;
  const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO user_sessions (user_id, session_token, refresh_token, device_name, browser, os, ip_address, location, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userId, sessionToken, refreshToken, device, browser, os, ipAddress, 'Local/Unknown', expiresAt);

  // Update user's last login and remember_me_token if requested
  db.prepare(`
    UPDATE users SET last_login = CURRENT_TIMESTAMP${rememberMe ? ', remember_me_token = ?' : ''} WHERE id = ?
  `).run(...(rememberMe ? [refreshToken, userId] : [userId]));

  return { sessionToken, refreshToken };
}

export function validateSession(sessionToken: string): UserSession | null {
  const session = db.prepare(`
    SELECT * FROM user_sessions WHERE session_token = ? AND expires_at > CURRENT_TIMESTAMP
  `).get(sessionToken) as UserSession | undefined;

  if (session) {
    // Refresh last active timestamp asynchronously / best-effort
    try {
      db.prepare(`UPDATE user_sessions SET last_active = CURRENT_TIMESTAMP WHERE id = ?`).run(session.id);
    } catch {
      // ignore update error
    }
    return session;
  }
  return null;
}

export function revokeSession(sessionToken: string): void {
  db.prepare(`DELETE FROM user_sessions WHERE session_token = ?`).run(sessionToken);
}

export function revokeUserSessionById(userId: number, sessionId: number): boolean {
  const result = db.prepare(`DELETE FROM user_sessions WHERE id = ? AND user_id = ?`).run(sessionId, userId);
  return result.changes > 0;
}

export function revokeAllUserSessions(userId: number, currentSessionToken?: string): number {
  if (currentSessionToken) {
    const result = db.prepare(`DELETE FROM user_sessions WHERE user_id = ? AND session_token != ?`).run(userId, currentSessionToken);
    return result.changes;
  } else {
    const result = db.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).run(userId);
    return result.changes;
  }
}

export function getUserSessions(userId: number): UserSession[] {
  return db.prepare(`
    SELECT id, user_id, session_token, device_name, browser, os, ip_address, location, last_active, created_at, expires_at
    FROM user_sessions
    WHERE user_id = ?
    ORDER BY last_active DESC
  `).all(userId) as UserSession[];
}

export function generateAuthToken(userId: number, type: 'email_verification' | 'phone_otp' | 'password_reset' | 'email_change' | 'phone_change', newValue?: string, expiresInHours = 24): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

  // Invalidate previous tokens of same type for user
  db.prepare(`DELETE FROM auth_tokens WHERE user_id = ? AND type = ?`).run(userId, type);

  db.prepare(`
    INSERT INTO auth_tokens (user_id, token, type, new_value, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, token, type, newValue || null, expiresAt);

  return token;
}

export function generateNumericAuthToken(
  userId: number,
  type: 'email_verification' | 'phone_otp' | 'password_reset' | 'email_change' | 'phone_change',
  newValue?: string,
  expiresInMinutes = 15
): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

  // Invalidate previous tokens of same type for user
  try {
    db.prepare(`DELETE FROM auth_tokens WHERE user_id = ? AND (type = ? OR type = 'phone_change')`).run(userId, type);

    db.prepare(`
      INSERT INTO auth_tokens (user_id, token, type, new_value, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, code, type, newValue || null, expiresAt);
  } catch (err) {
    // Fallback if legacy SQLite table has rigid CHECK constraint without 'phone_otp'
    const fallbackType = type === 'phone_otp' ? 'phone_change' : type;
    db.prepare(`
      INSERT INTO auth_tokens (user_id, token, type, new_value, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, code, fallbackType, newValue || null, expiresAt);
  }

  return code;
}

export function verifyAuthToken(token: string, type?: 'email_verification' | 'phone_otp' | 'password_reset' | 'email_change' | 'phone_change'): { id: number; user_id: number; new_value?: string; type: string } | null {
  let query = 'SELECT * FROM auth_tokens WHERE token = ? AND expires_at > CURRENT_TIMESTAMP';
  const params: any[] = [token];
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  const record = db.prepare(query).get(...params) as any;
  return record || null;
}

export function consumeAuthToken(token: string): void {
  db.prepare(`DELETE FROM auth_tokens WHERE token = ?`).run(token);
}
