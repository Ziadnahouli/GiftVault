import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/schema';
import { AuthRequest, authenticate, generateToken } from '../middleware/auth';
import { registerSchema, loginSchema, updateProfileSchema } from '../validators';
import { sanitize } from '../utils/helpers';

const router = Router();

// POST /api/auth/register
router.post('/register', (req: AuthRequest, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const { name, email, password, country, whatsapp } = validation.data;

    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = bcrypt.hashSync(password, 12);

    const result = db.prepare(
      `INSERT INTO users (name, email, password_hash, country, whatsapp) VALUES (?, ?, ?, ?, ?)`
    ).run(sanitize(name), email.toLowerCase(), passwordHash, sanitize(country || ''), sanitize(whatsapp || ''));

    const user = {
      id: result.lastInsertRowid as number,
      email: email.toLowerCase(),
      role: 'customer',
      name: sanitize(name),
    };

    const token = generateToken(user);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', (req: AuthRequest, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const { email, password } = validation.data;

    const user = db.prepare(
      'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?'
    ).get(email.toLowerCase()) as any;

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const user = db.prepare(
      'SELECT id, name, email, role, avatar, country, whatsapp, preferred_lang, preferred_currency, created_at FROM users WHERE id = ?'
    ).get(req.user!.id) as any;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
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
    if (data.country) { updates.push('country = ?'); values.push(sanitize(data.country)); }
    if (data.whatsapp) { updates.push('whatsapp = ?'); values.push(sanitize(data.whatsapp)); }
    if (data.preferred_lang) { updates.push('preferred_lang = ?'); values.push(data.preferred_lang); }
    if (data.preferred_currency) { updates.push('preferred_currency = ?'); values.push(data.preferred_currency); }

    if (updates.length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user!.id);

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const user = db.prepare(
      'SELECT id, name, email, role, avatar, country, whatsapp, preferred_lang, preferred_currency FROM users WHERE id = ?'
    ).get(req.user!.id);

    res.json({ message: 'Profile updated', user });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT /api/auth/password
router.put('/password', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'Invalid password data' });
      return;
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as any;

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const newHash = bcrypt.hashSync(newPassword, 12);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newHash, req.user!.id);

    res.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

export default router;
