import { Router, Request, Response } from 'express';
import db from '../database/schema';

const router = Router();

// GET /api/regions
router.get('/', (req: Request, res: Response) => {
  try {
    const regions = db.prepare(
      'SELECT * FROM regions WHERE is_active = 1 ORDER BY sort_order ASC'
    ).all();

    res.json({ regions });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get regions' });
  }
});

// GET /api/regions/:code
router.get('/:code', (req: Request, res: Response) => {
  try {
    const region = db.prepare(
      'SELECT * FROM regions WHERE code = ? AND is_active = 1'
    ).get(req.params.code) as any;

    if (!region) {
      res.status(404).json({ error: 'Region not found' });
      return;
    }

    res.json({ region });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get region' });
  }
});

export default router;
