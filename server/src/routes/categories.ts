import { Router, Request, Response } from 'express';
import db from '../database/schema';
import { getPagination } from '../utils/helpers';

const router = Router();

// GET /api/categories
router.get('/', (req: Request, res: Response) => {
  try {
    const categories = db.prepare(
      `SELECT c.*, 
       (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) as product_count
       FROM categories c
       WHERE c.is_active = 1
       ORDER BY c.sort_order ASC`
    ).all();

    res.json({ categories });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// GET /api/categories/:slug
router.get('/:slug', (req: Request, res: Response) => {
  try {
    const category = db.prepare(
      'SELECT * FROM categories WHERE slug = ? AND is_active = 1'
    ).get(req.params.slug) as any;

    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json({ category });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get category' });
  }
});

// GET /api/categories/:slug/products
router.get('/:slug/products', (req: Request, res: Response) => {
  try {
    const category = db.prepare('SELECT * FROM categories WHERE slug = ? AND is_active = 1').get(req.params.slug) as any;
    if (!category) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    const { limit, offset, page } = getPagination(req.query);
    const { sort } = req.query as any;

    let orderBy = 'ORDER BY p.sort_order ASC, p.created_at DESC';
    if (sort === 'newest') orderBy = 'ORDER BY p.created_at DESC';
    else if (sort === 'price_asc') orderBy = 'ORDER BY min_price ASC';
    else if (sort === 'price_desc') orderBy = 'ORDER BY min_price DESC';
    else if (sort === 'popular') orderBy = 'ORDER BY p.view_count DESC';

    const countResult = db.prepare(
      'SELECT COUNT(*) as total FROM products p WHERE p.category_id = ? AND p.is_active = 1'
    ).get(category.id) as any;

    const products = db.prepare(
      `SELECT p.*, 
       (SELECT MIN(gcv.price_usd) FROM gift_card_values gcv JOIN product_regions pr ON gcv.product_region_id = pr.id WHERE pr.product_id = p.id AND gcv.is_active = 1) as min_price,
       (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as avg_rating,
       (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as review_count
       FROM products p
       WHERE p.category_id = ? AND p.is_active = 1
       ${orderBy} LIMIT ? OFFSET ?`
    ).all(category.id, limit, offset) as any[];

    res.json({
      category,
      products: products.map(p => ({ ...p, gallery: p.gallery ? JSON.parse(p.gallery) : [] })),
      pagination: { page, limit, total: countResult.total, pages: Math.ceil(countResult.total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get category products' });
  }
});

export default router;
