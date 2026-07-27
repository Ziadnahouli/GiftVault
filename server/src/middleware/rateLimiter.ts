import { Request, Response, NextFunction } from 'express';
import db from '../database/schema';
import { config } from '../config';

/**
 * Checks whether an account identified by email or phone is currently locked.
 */
export function isAccountLocked(identifier: string): { locked: boolean; remainingMinutes?: number } {
  const user = db.prepare(`
    SELECT failed_login_attempts, locked_until FROM users WHERE email = ? OR phone_number = ?
  `).get(identifier.toLowerCase(), identifier) as { failed_login_attempts: number; locked_until: string | null } | undefined;

  if (!user || !user.locked_until) {
    return { locked: false };
  }

  const lockedUntilTime = new Date(user.locked_until).getTime();
  const now = Date.now();

  if (now < lockedUntilTime) {
    const remainingMinutes = Math.ceil((lockedUntilTime - now) / (60 * 1000));
    return { locked: true, remainingMinutes };
  }

  // Lock expired — reset failed attempts
  db.prepare(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE email = ? OR phone_number = ?`).run(identifier.toLowerCase(), identifier);
  return { locked: false };
}

/**
 * Record a failed login attempt for an identifier.
 */
export function recordFailedLogin(identifier: string): { lockedNow: boolean; remainingAttempts: number } {
  const user = db.prepare(`
    SELECT id, failed_login_attempts FROM users WHERE email = ? OR phone_number = ?
  `).get(identifier.toLowerCase(), identifier) as { id: number; failed_login_attempts: number } | undefined;

  if (!user) {
    return { lockedNow: false, remainingAttempts: 4 };
  }

  const newAttempts = (user.failed_login_attempts || 0) + 1;
  const maxAttempts = config.auth.lockoutMaxAttempts;

  if (newAttempts >= maxAttempts) {
    const lockoutUntil = new Date(Date.now() + config.auth.lockoutDurationMinutes * 60 * 1000).toISOString();
    db.prepare(`UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?`).run(newAttempts, lockoutUntil, user.id);
    return { lockedNow: true, remainingAttempts: 0 };
  } else {
    db.prepare(`UPDATE users SET failed_login_attempts = ? WHERE id = ?`).run(newAttempts, user.id);
    return { lockedNow: false, remainingAttempts: maxAttempts - newAttempts };
  }
}

/**
 * Reset failed login attempts on successful login.
 */
export function resetFailedLogin(userId: number): void {
  db.prepare(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?`).run(userId);
}

// In-memory rate limiting map for endpoints (OTP, resend verification)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, limit = 5, windowMs = 15 * 60 * 1000): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetInSeconds: Math.ceil(windowMs / 1000) };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetInSeconds: Math.ceil((entry.resetTime - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count, resetInSeconds: Math.ceil((entry.resetTime - now) / 1000) };
}

export function otpRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || '127.0.0.1';
  const key = `otp_${ip}`;
  const result = checkRateLimit(key, 3, 60 * 1000); // 3 OTP requests per minute max

  if (!result.allowed) {
    res.status(429).json({ error: `Too many OTP requests. Please wait ${result.resetInSeconds} seconds.` });
    return;
  }
  next();
}
