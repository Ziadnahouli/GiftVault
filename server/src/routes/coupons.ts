import { Router, Request, Response } from 'express';
import db from '../database/schema';

const router = Router();

// POST /api/coupons/validate
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Coupon code required' });
      return;
    }

    const coupon = db.prepare(
      `SELECT id, code, type, value, min_order FROM coupons 
       WHERE code = ? AND is_active = 1 
       AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
       AND (max_uses = 0 OR used_count < max_uses)`
    ).get(code.toUpperCase()) as any;

    if (!coupon) {
      res.status(404).json({ error: 'Invalid or expired coupon' });
      return;
    }

    res.json({ coupon });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

export default router;
