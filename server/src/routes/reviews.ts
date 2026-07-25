import { Router, Response } from 'express';
import db from '../database/schema';
import { AuthRequest, authenticate } from '../middleware/auth';
import { reviewSchema } from '../validators';
import { sanitize, getPagination } from '../utils/helpers';

const router = Router();

// GET /api/reviews/:productId
router.get('/:productId', (req: any, res: Response) => {
  try {
    const { limit, offset, page } = getPagination(req.query);
    const productId = parseInt(req.params.productId);

    const countResult = db.prepare(
      'SELECT COUNT(*) as total FROM reviews WHERE product_id = ? AND is_approved = 1'
    ).get(productId) as any;

    const reviews = db.prepare(
      `SELECT r.*, u.name as user_name FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND r.is_approved = 1
       ORDER BY r.created_at DESC LIMIT ? OFFSET ?`
    ).all(productId, limit, offset);

    const stats = db.prepare(
      `SELECT 
        ROUND(AVG(rating), 1) as avg_rating,
        COUNT(*) as total_reviews,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
       FROM reviews WHERE product_id = ? AND is_approved = 1`
    ).get(productId);

    res.json({
      reviews,
      stats,
      pagination: { page, limit, total: countResult.total, pages: Math.ceil(countResult.total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// POST /api/reviews
router.post('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const validation = reviewSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const { product_id, rating, comment } = validation.data;

    // Check if user already reviewed
    const existing = db.prepare(
      'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?'
    ).get(product_id, req.user!.id);

    if (existing) {
      res.status(409).json({ error: 'You have already reviewed this product' });
      return;
    }

    const result = db.prepare(
      'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)'
    ).run(product_id, req.user!.id, rating, sanitize(comment || ''));

    res.status(201).json({ message: 'Review submitted for approval', id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

export default router;
