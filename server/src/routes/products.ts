import { Router, Request, Response } from 'express';
import db from '../database/schema';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth';
import { productSchema } from '../validators';
import { sanitize, generateSlug, getPagination } from '../utils/helpers';

const router = Router();

// GET /api/products — List products with filters & pagination
router.get('/', (req: Request, res: Response) => {
  try {
    const { limit, offset, page } = getPagination(req.query);
    const { category, search, sort, featured, best_seller, region } = req.query as any;

    let where = 'WHERE p.is_active = 1';
    const params: any[] = [];

    if (category) {
      where += ' AND c.slug = ?';
      params.push(category);
    }

    if (search) {
      where += ' AND (p.name_en LIKE ? OR p.name_ar LIKE ? OR p.description_en LIKE ?)';
      const searchTerm = `%${sanitize(search)}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (featured === 'true') {
      where += ' AND p.featured = 1';
    }

    if (best_seller === 'true') {
      where += ' AND p.best_seller = 1';
    }

    if (region) {
      where += ' AND EXISTS (SELECT 1 FROM product_regions pr JOIN regions r ON pr.region_id = r.id WHERE pr.product_id = p.id AND r.code = ?)';
      params.push(region);
    }

    let orderBy = 'ORDER BY p.sort_order ASC, p.created_at DESC';
    if (sort === 'newest') orderBy = 'ORDER BY p.created_at DESC';
    else if (sort === 'price_asc') orderBy = 'ORDER BY min_price ASC';
    else if (sort === 'price_desc') orderBy = 'ORDER BY min_price DESC';
    else if (sort === 'popular') orderBy = 'ORDER BY p.view_count DESC';
    else if (sort === 'name_asc') orderBy = 'ORDER BY p.name_en ASC';
    else if (sort === 'name_desc') orderBy = 'ORDER BY p.name_en DESC';

    const countResult = db.prepare(
      `SELECT COUNT(*) as total FROM products p JOIN categories c ON p.category_id = c.id ${where}`
    ).get(...params) as any;

    const products = db.prepare(
      `SELECT p.*, c.name_en as category_name_en, c.name_ar as category_name_ar, c.slug as category_slug,
       (SELECT MIN(gcv.price_usd) FROM gift_card_values gcv JOIN product_regions pr ON gcv.product_region_id = pr.id WHERE pr.product_id = p.id AND gcv.is_active = 1 AND gcv.is_hidden = 0) as min_price,
       (SELECT MAX(gcv.price_usd) FROM gift_card_values gcv JOIN product_regions pr ON gcv.product_region_id = pr.id WHERE pr.product_id = p.id AND gcv.is_active = 1 AND gcv.is_hidden = 0) as max_price,
       (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as avg_rating,
       (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as review_count
       FROM products p
       JOIN categories c ON p.category_id = c.id
       ${where}
       ${orderBy}
       LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as any[];

    res.json({
      products: products.map(p => ({ ...p, gallery: p.gallery ? JSON.parse(p.gallery) : [] })),
      pagination: {
        page,
        limit,
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit),
      },
    });
  } catch (error: any) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// GET /api/products/featured
router.get('/featured', (req: Request, res: Response) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit as string) || 8);
    const products = db.prepare(
      `SELECT p.*, c.name_en as category_name_en, c.name_ar as category_name_ar, c.slug as category_slug,
       (SELECT MIN(gcv.price_usd) FROM gift_card_values gcv JOIN product_regions pr ON gcv.product_region_id = pr.id WHERE pr.product_id = p.id AND gcv.is_active = 1 AND gcv.is_hidden = 0) as min_price,
       (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as avg_rating,
       (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as review_count
       FROM products p JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = 1 AND p.featured = 1
       ORDER BY p.sort_order ASC LIMIT ?`
    ).all(limit) as any[];

    res.json({ products: products.map(p => ({ ...p, gallery: p.gallery ? JSON.parse(p.gallery) : [] })) });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get featured products' });
  }
});

// GET /api/products/best-sellers
router.get('/best-sellers', (req: Request, res: Response) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit as string) || 8);
    const products = db.prepare(
      `SELECT p.*, c.name_en as category_name_en, c.name_ar as category_name_ar,
       (SELECT MIN(gcv.price_usd) FROM gift_card_values gcv JOIN product_regions pr ON gcv.product_region_id = pr.id WHERE pr.product_id = p.id AND gcv.is_active = 1 AND gcv.is_hidden = 0) as min_price,
       (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as avg_rating,
       (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as review_count
       FROM products p JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = 1 AND p.best_seller = 1
       ORDER BY p.view_count DESC LIMIT ?`
    ).all(limit) as any[];

    res.json({ products: products.map(p => ({ ...p, gallery: p.gallery ? JSON.parse(p.gallery) : [] })) });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get best sellers' });
  }
});

// GET /api/products/recent
router.get('/recent', (req: Request, res: Response) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit as string) || 8);
    const products = db.prepare(
      `SELECT p.*, c.name_en as category_name_en, c.name_ar as category_name_ar,
       (SELECT MIN(gcv.price_usd) FROM gift_card_values gcv JOIN product_regions pr ON gcv.product_region_id = pr.id WHERE pr.product_id = p.id AND gcv.is_active = 1 AND gcv.is_hidden = 0) as min_price,
       (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as avg_rating
       FROM products p JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = 1
       ORDER BY p.created_at DESC LIMIT ?`
    ).all(limit) as any[];

    res.json({ products: products.map(p => ({ ...p, gallery: p.gallery ? JSON.parse(p.gallery) : [] })) });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get recent products' });
  }
});

// GET /api/products/:slug — Get single product with all regions, values
router.get('/:slug', (req: Request, res: Response) => {
  try {
    const product = db.prepare(
      `SELECT p.*, c.name_en as category_name_en, c.name_ar as category_name_ar, c.slug as category_slug,
       (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as avg_rating,
       (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id AND r.is_approved = 1) as review_count
       FROM products p JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ? AND p.is_active = 1`
    ).get(req.params.slug) as any;

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Increment view count
    db.prepare('UPDATE products SET view_count = view_count + 1 WHERE id = ?').run(product.id);

    // Get product regions with values
    const productRegions = db.prepare(
      `SELECT pr.*, r.name_en as region_name_en, r.name_ar as region_name_ar, r.code as region_code, r.flag_emoji
       FROM product_regions pr
       JOIN regions r ON pr.region_id = r.id
       WHERE pr.product_id = ? AND pr.is_active = 1
       ORDER BY r.sort_order ASC`
    ).all(product.id) as any[];

    for (const pr of productRegions) {
      pr.values = db.prepare(
        `SELECT * FROM gift_card_values WHERE product_region_id = ? AND is_active = 1 AND is_hidden = 0 ORDER BY face_value ASC`
      ).all(pr.id);
    }

    // Get reviews
    const reviews = db.prepare(
      `SELECT r.*, u.name as user_name FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND r.is_approved = 1
       ORDER BY r.created_at DESC LIMIT 20`
    ).all(product.id);

    // Get related products
    const related = db.prepare(
      `SELECT p.*, 
       (SELECT MIN(gcv.price_usd) FROM gift_card_values gcv JOIN product_regions pr ON gcv.product_region_id = pr.id WHERE pr.product_id = p.id) as min_price,
       (SELECT ROUND(AVG(rv.rating), 1) FROM reviews rv WHERE rv.product_id = p.id AND rv.is_approved = 1) as avg_rating
       FROM products p
       WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
       ORDER BY p.sort_order ASC LIMIT 4`
    ).all(product.category_id, product.id);

    res.json({
      product: {
        ...product,
        gallery: product.gallery ? JSON.parse(product.gallery) : [],
        regions: productRegions,
        reviews,
        related: related.map((r: any) => ({ ...r, gallery: r.gallery ? JSON.parse(r.gallery) : [] })),
      },
    });
  } catch (error: any) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

export default router;
