import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import db from '../database/schema';
import { isDbMaintenanceActive } from '../services/databaseManager';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    name: string;
  };
}

export function isAdminRole(role?: string): boolean {
  return role === 'admin' || role === 'super_admin';
}

export function isSuperAdminRole(role?: string): boolean {
  return role === 'super_admin';
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: number;
      email: string;
      role: string;
      name: string;
    };

    // During DB maintenance the connection may be closed — trust JWT claims briefly
    if (isDbMaintenanceActive()) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
      };
      next();
      return;
    }

    // Verify user still exists and is active
    const user = db.prepare('SELECT id, email, role, name FROM users WHERE id = ? AND is_active = 1').get(decoded.id) as any;

    if (!user) {
      res.status(401).json({ error: 'User not found or deactivated.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    if (isDbMaintenanceActive()) {
      req.user = { id: decoded.id, email: decoded.email, role: decoded.role, name: decoded.name };
      next();
      return;
    }

    const user = db.prepare('SELECT id, email, role, name FROM users WHERE id = ? AND is_active = 1').get(decoded.id) as any;
    if (user) {
      req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    }
  } catch {}

  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || !isAdminRole(req.user.role)) {
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    return;
  }
  next();
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user || !isSuperAdminRole(req.user.role)) {
    res.status(403).json({ error: 'Access denied. Super Admin privileges required.' });
    return;
  }
  next();
}

export function generateToken(user: { id: number; email: string; role: string; name: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn as any }
  );
}
