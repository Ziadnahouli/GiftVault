import { Router, Response } from 'express';
import db from '../database/schema';
import { AuthRequest, authenticate } from '../middleware/auth';

const router = Router();

// GET /api/wishlist
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const items = db.prepare(
      `SELECT w.id, w.created_at, p.id as product_id, p.name_en, p.name_ar, p.slug, p.image,
       (SELECT MIN(gcv.price_usd) FROM gift_card_values gcv JOIN product_regions pr ON gcv.product_region_id = pr.id WHERE pr.product_id = p.id AND gcv.is_active = 1) as min_price,
       (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as avg_rating
       FROM wishlist w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ?
       ORDER BY w.created_at DESC`
    ).all(req.user!.id);

    res.json({ wishlist: items });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get wishlist' });
  }
});

// POST /api/wishlist
router.post('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { product_id } = req.body;
    if (!product_id) {
      res.status(400).json({ error: 'Product ID required' });
      return;
    }

    const existing = db.prepare(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?'
    ).get(req.user!.id, product_id);

    if (existing) {
      res.status(409).json({ error: 'Already in wishlist' });
      return;
    }

    db.prepare('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)').run(req.user!.id, product_id);
    res.status(201).json({ message: 'Added to wishlist' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', authenticate, (req: AuthRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?').run(req.user!.id, parseInt(req.params.productId));
    res.json({ message: 'Removed from wishlist' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// GET /api/wishlist/check/:productId
router.get('/check/:productId', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const item = db.prepare(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?'
    ).get(req.user!.id, parseInt(req.params.productId));

    res.json({ inWishlist: !!item });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to check wishlist' });
  }
});

export default router;
