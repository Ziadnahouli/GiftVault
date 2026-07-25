import { Router, Request, Response } from 'express';
import db from '../database/schema';

const router = Router();

// GET /api/faq
router.get('/', (req: Request, res: Response) => {
  try {
    const { category } = req.query as any;
    let query = 'SELECT * FROM faq WHERE is_active = 1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY sort_order ASC';
    const faqs = db.prepare(query).all(...params);
    res.json({ faqs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get FAQ' });
  }
});

export default router;
