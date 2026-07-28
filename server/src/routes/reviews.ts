import { Router, Response } from 'express';
import db from '../database/schema';
import { AuthRequest, authenticate, optionalAuth } from '../middleware/auth';
import { reviewSchema } from '../validators';
import { sanitize, getPagination } from '../utils/helpers';

const router = Router();

// GET /api/reviews/eligibility/:productId — Check if user is eligible to write a review
router.get('/eligibility/:productId', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const userId = req.user!.id;

    // Check if user already reviewed
    const existingReview = db.prepare(
      'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?'
    ).get(productId, userId);

    if (existingReview) {
      return res.json({
        canReview: false,
        alreadyReviewed: true,
        reason: 'You have already reviewed this product.',
      });
    }

    // Check if user has purchased the product
    const purchase = db.prepare(`
      SELECT o.id FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = ? AND oi.product_id = ? AND o.status IN ('completed', 'paid', 'processing')
      LIMIT 1
    `).get(userId, productId);

    if (!purchase) {
      return res.json({
        canReview: false,
        verifiedPurchase: false,
        reason: 'Only verified buyers who have purchased this product can leave a review.',
      });
    }

    return res.json({
      canReview: true,
      verifiedPurchase: true,
      reason: 'You are eligible to review this product.',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to check review eligibility' });
  }
});

// GET /api/reviews/:productId — Public product reviews list
router.get('/:productId', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { limit, offset, page } = getPagination(req.query);
    const productId = parseInt(req.params.productId);
    const sortBy = req.query.sortBy as string || 'newest';
    const currentUserId = req.user?.id || null;

    let orderBy = 'r.is_pinned DESC, r.created_at DESC';
    if (sortBy === 'oldest') {
      orderBy = 'r.is_pinned DESC, r.created_at ASC';
    } else if (sortBy === 'highest') {
      orderBy = 'r.is_pinned DESC, r.rating DESC, r.created_at DESC';
    } else if (sortBy === 'lowest') {
      orderBy = 'r.is_pinned DESC, r.rating ASC, r.created_at DESC';
    } else if (sortBy === 'most_helpful') {
      orderBy = 'r.is_pinned DESC, helpful_count DESC, r.created_at DESC';
    }

    const countResult = db.prepare(
      'SELECT COUNT(*) as total FROM reviews WHERE product_id = ? AND is_approved = 1 AND is_hidden = 0'
    ).get(productId) as any;

    const reviews = db.prepare(
      `SELECT r.*, 
        u.name as user_name, 
        u.avatar as user_avatar,
        (SELECT COUNT(*) FROM review_votes WHERE review_id = r.id AND vote = 'helpful') as helpful_count,
        (SELECT COUNT(*) FROM review_votes WHERE review_id = r.id AND vote = 'unhelpful') as unhelpful_count,
        (SELECT reply_text FROM review_replies WHERE review_id = r.id ORDER BY created_at DESC LIMIT 1) as admin_reply,
        ${currentUserId ? `(SELECT vote FROM review_votes WHERE review_id = r.id AND user_id = ${currentUserId})` : 'NULL'} as user_vote
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND r.is_approved = 1 AND r.is_hidden = 0
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`
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
       FROM reviews WHERE product_id = ? AND is_approved = 1 AND is_hidden = 0`
    ).get(productId);

    res.json({
      reviews,
      stats: {
        avg_rating: (stats as any)?.avg_rating || 0,
        total_reviews: (stats as any)?.total_reviews || 0,
        five_star: (stats as any)?.five_star || 0,
        four_star: (stats as any)?.four_star || 0,
        three_star: (stats as any)?.three_star || 0,
        two_star: (stats as any)?.two_star || 0,
        one_star: (stats as any)?.one_star || 0,
      },
      pagination: { page, limit, total: countResult.total, pages: Math.ceil(countResult.total / limit) },
    });
  } catch (error: any) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

// POST /api/reviews — Submit a Review (Verified Buyers Only)
router.post('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const validation = reviewSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const { product_id, rating, title, comment } = req.body;
    const userId = req.user!.id;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5 stars' });
      return;
    }

    // Check existing review
    const existing = db.prepare(
      'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?'
    ).get(product_id, userId);

    if (existing) {
      res.status(409).json({ error: 'You have already reviewed this product' });
      return;
    }

    // Check verified purchase
    const purchase = db.prepare(`
      SELECT o.id FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE o.user_id = ? AND oi.product_id = ? AND o.status IN ('completed', 'paid', 'processing')
      LIMIT 1
    `).get(userId, product_id);

    if (!purchase) {
      res.status(403).json({ error: 'Only verified buyers who purchased this product can leave a review.' });
      return;
    }

    const result = db.prepare(`
      INSERT INTO reviews (product_id, user_id, rating, title, comment, is_approved, verified_purchase)
      VALUES (?, ?, ?, ?, ?, 1, 1)
    `).run(product_id, userId, rating, sanitize(title || ''), sanitize(comment || ''));

    res.status(201).json({
      message: 'Thank you! Your verified review has been published.',
      id: result.lastInsertRowid,
    });
  } catch (error: any) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// POST /api/reviews/:id/vote — Vote Helpful / Unhelpful
router.post('/:id/vote', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const reviewId = parseInt(req.params.id);
    const userId = req.user!.id;
    const { vote } = req.body;

    if (!['helpful', 'unhelpful'].includes(vote)) {
      res.status(400).json({ error: 'Vote must be helpful or unhelpful' });
      return;
    }

    const existingVote = db.prepare(
      'SELECT id, vote FROM review_votes WHERE review_id = ? AND user_id = ?'
    ).get(reviewId, userId) as any;

    if (existingVote) {
      if (existingVote.vote === vote) {
        // Toggle off vote if clicked same
        db.prepare('DELETE FROM review_votes WHERE id = ?').run(existingVote.id);
      } else {
        // Switch vote
        db.prepare('UPDATE review_votes SET vote = ? WHERE id = ?').run(vote, existingVote.id);
      }
    } else {
      db.prepare(
        'INSERT INTO review_votes (review_id, user_id, vote) VALUES (?, ?, ?)'
      ).run(reviewId, userId, vote);
    }

    const helpful = db.prepare("SELECT COUNT(*) as c FROM review_votes WHERE review_id = ? AND vote = 'helpful'").get(reviewId) as any;
    const unhelpful = db.prepare("SELECT COUNT(*) as c FROM review_votes WHERE review_id = ? AND vote = 'unhelpful'").get(reviewId) as any;

    res.json({
      message: 'Vote recorded',
      helpful_count: helpful.c,
      unhelpful_count: unhelpful.c,
    });
  } catch (error: any) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

export default router;
