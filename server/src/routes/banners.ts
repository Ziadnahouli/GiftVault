import { Router, Request, Response } from 'express';
import db from '../database/schema';

const router = Router();

// GET /api/banners
router.get('/', (req: Request, res: Response) => {
  try {
    const banners = db.prepare(
      'SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC'
    ).all();
    res.json({ banners });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get banners' });
  }
});

export default router;
