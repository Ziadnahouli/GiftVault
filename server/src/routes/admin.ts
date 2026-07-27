import { Router, Response } from 'express';
import db from '../database/schema';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth';
import { productSchema, categorySchema, regionSchema, bannerSchema, faqSchema, couponSchema } from '../validators';
import { sanitize, generateSlug, getPagination } from '../utils/helpers';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ==================== DASHBOARD ====================

router.get('/dashboard', (req: AuthRequest, res: Response) => {
  try {
    const totalRevenue = db.prepare('SELECT COALESCE(SUM(total_usd), 0) as total FROM orders WHERE status != ?').get('cancelled') as any;
    const totalOrders = db.prepare('SELECT COUNT(*) as total FROM orders').get() as any;
    const pendingOrders = db.prepare("SELECT COUNT(*) as total FROM orders WHERE status = 'pending'").get() as any;
    const totalProducts = db.prepare('SELECT COUNT(*) as total FROM products').get() as any;
    const totalCustomers = db.prepare("SELECT COUNT(*) as total FROM users WHERE role = 'customer'").get() as any;
    
    // Inventory stats
    const totalRegions = db.prepare('SELECT COUNT(*) as total FROM regions').get() as any;
    const totalDenominations = db.prepare('SELECT COUNT(*) as total FROM gift_card_values').get() as any;
    const lowStockItems = db.prepare('SELECT COUNT(*) as total FROM gift_card_values WHERE stock > 0 AND stock <= 5').get() as any;
    const outOfStockItems = db.prepare('SELECT COUNT(*) as total FROM gift_card_values WHERE stock = 0').get() as any;

    const recentOrders = db.prepare(
      `SELECT o.*, 
       (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
       FROM orders o ORDER BY o.created_at DESC LIMIT 10`
    ).all();

    const topProducts = db.prepare(
      `SELECT p.name_en, p.name_ar, p.image, p.slug,
       COUNT(oi.id) as order_count,
       SUM(oi.quantity) as total_sold,
       SUM(oi.price_usd * oi.quantity) as total_revenue
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       GROUP BY oi.product_id
       ORDER BY total_sold DESC LIMIT 10`
    ).all();

    const monthlySales = db.prepare(
      `SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as orders,
        COALESCE(SUM(total_usd), 0) as revenue
       FROM orders WHERE status != 'cancelled'
       GROUP BY month ORDER BY month DESC LIMIT 12`
    ).all();

    res.json({
      stats: {
        revenue: totalRevenue.total,
        orders: totalOrders.total,
        pendingOrders: pendingOrders.total,
        products: totalProducts.total,
        customers: totalCustomers.total,
        regions: totalRegions.total,
        denominations: totalDenominations.total,
        lowStock: lowStockItems.total,
        outOfStock: outOfStockItems.total,
      },
      recentOrders,
      topProducts,
      monthlySales,
    });
  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// ==================== PRODUCTS ====================

router.get('/products', (req: AuthRequest, res: Response) => {
  try {
    const { limit, offset, page } = getPagination(req.query);
    const { search, category } = req.query as any;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      where += ' AND (p.name_en LIKE ? OR p.name_ar LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      where += ' AND p.category_id = ?';
      params.push(parseInt(category));
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM products p ${where}`).get(...params) as any;
    const products = db.prepare(
      `SELECT p.*, c.name_en as category_name_en FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id
       ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as any[];

    // Attach regions to each product
    for (const product of products) {
      product.gallery = product.gallery ? JSON.parse(product.gallery) : [];
      product.regions = db.prepare(
        `SELECT pr.*, r.name_en as region_name_en, r.name_ar as region_name_ar, r.code as region_code, r.flag_emoji
         FROM product_regions pr JOIN regions r ON pr.region_id = r.id
         WHERE pr.product_id = ?`
      ).all(product.id) as any[];

      for (const pr of product.regions) {
        pr.values = db.prepare('SELECT * FROM gift_card_values WHERE product_region_id = ?').all(pr.id);
      }
    }

    res.json({
      products,
      pagination: { page, limit, total: countResult.total, pages: Math.ceil(countResult.total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get products' });
  }
});

router.get('/products/:id', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    product.gallery = product.gallery ? JSON.parse(product.gallery) : [];
    product.regions = db.prepare(
      `SELECT pr.*, r.name_en as region_name_en, r.name_ar as region_name_ar, r.code as region_code, r.flag_emoji
       FROM product_regions pr JOIN regions r ON pr.region_id = r.id
       WHERE pr.product_id = ?`
    ).all(id) as any[];

    for (const pr of product.regions) {
      pr.values = db.prepare('SELECT * FROM gift_card_values WHERE product_region_id = ?').all(pr.id);
    }

    res.json({ product });
  } catch (error: any) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

router.post('/products', (req: AuthRequest, res: Response) => {
  try {
    const validation = productSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const data = validation.data;
    let slug = generateSlug(data.name_en);

    // Ensure unique slug
    let existing = db.prepare('SELECT id FROM products WHERE slug = ?').get(slug);
    if (existing) slug = `${slug}-${Date.now()}`;

    const result = db.prepare(
      `INSERT INTO products (name_en, name_ar, slug, category_id, description_en, description_ar, short_description_en, short_description_ar, image, gallery, featured, best_seller, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      sanitize(data.name_en), sanitize(data.name_ar), slug, data.category_id,
      sanitize(data.description_en || ''), sanitize(data.description_ar || ''),
      sanitize(data.short_description_en || ''), sanitize(data.short_description_ar || ''),
      data.image || '', JSON.stringify(data.gallery || []),
      data.featured ? 1 : 0, data.best_seller ? 1 : 0,
      data.is_active !== false ? 1 : 0, data.sort_order || 0
    );

    const productId = result.lastInsertRowid as number;

    // Add regions and values
    if (data.regions) {
      for (const region of data.regions) {
        const prResult = db.prepare(
          `INSERT INTO product_regions 
           (product_id, region_id, currency_code, description_en, description_ar, image, sort_order) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          productId, region.region_id, region.currency_code, 
          region.description_en || '', region.description_ar || '', 
          region.image || '', region.sort_order || 0
        );

        const prId = prResult.lastInsertRowid;
        for (const val of region.values) {
          db.prepare(
            `INSERT INTO gift_card_values 
             (product_region_id, face_value, price_usd, discount_price_usd, stock, sku, is_featured, is_hidden, supplier_id, supplier_product_id, supplier_region_id, api_mapping) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            prId, val.face_value, val.price_usd, val.discount_price_usd || null, 
            val.stock || 0, val.sku || '', val.is_featured ? 1 : 0, val.is_hidden ? 1 : 0,
            val.supplier_id || '', val.supplier_product_id || '', val.supplier_region_id || '', val.api_mapping || ''
          );
        }
      }
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    res.status(201).json({ message: 'Product created', product });
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/products/:id', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (data.name_en !== undefined) { updates.push('name_en = ?'); values.push(sanitize(data.name_en)); }
    if (data.name_ar !== undefined) { updates.push('name_ar = ?'); values.push(sanitize(data.name_ar)); }
    if (data.category_id !== undefined) { updates.push('category_id = ?'); values.push(data.category_id); }
    if (data.description_en !== undefined) { updates.push('description_en = ?'); values.push(sanitize(data.description_en)); }
    if (data.description_ar !== undefined) { updates.push('description_ar = ?'); values.push(sanitize(data.description_ar)); }
    if (data.short_description_en !== undefined) { updates.push('short_description_en = ?'); values.push(sanitize(data.short_description_en)); }
    if (data.short_description_ar !== undefined) { updates.push('short_description_ar = ?'); values.push(sanitize(data.short_description_ar)); }
    if (data.image !== undefined) { updates.push('image = ?'); values.push(data.image); }
    if (data.gallery !== undefined) { updates.push('gallery = ?'); values.push(JSON.stringify(data.gallery)); }
    if (data.featured !== undefined) { updates.push('featured = ?'); values.push(data.featured ? 1 : 0); }
    if (data.best_seller !== undefined) { updates.push('best_seller = ?'); values.push(data.best_seller ? 1 : 0); }
    if (data.is_active !== undefined) { updates.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }
    if (data.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(data.sort_order); }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    // Update regions if provided
    if (data.regions) {
      // Delete existing regions and values
      const existingPRs = db.prepare('SELECT id FROM product_regions WHERE product_id = ?').all(id) as any[];
      for (const pr of existingPRs) {
        db.prepare('DELETE FROM gift_card_values WHERE product_region_id = ?').run(pr.id);
      }
      db.prepare('DELETE FROM product_regions WHERE product_id = ?').run(id);

      // Re-insert
      for (const region of data.regions) {
        const prResult = db.prepare(
          `INSERT INTO product_regions 
           (product_id, region_id, currency_code, description_en, description_ar, image, sort_order) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          id, region.region_id, region.currency_code, 
          region.description_en || '', region.description_ar || '', 
          region.image || '', region.sort_order || 0
        );

        const prId = prResult.lastInsertRowid;
        for (const val of region.values) {
          db.prepare(
            `INSERT INTO gift_card_values 
             (product_region_id, face_value, price_usd, discount_price_usd, stock, sku, is_featured, is_hidden, supplier_id, supplier_product_id, supplier_region_id, api_mapping) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            prId, val.face_value, val.price_usd, val.discount_price_usd || null, 
            val.stock || 0, val.sku || '', val.is_featured ? 1 : 0, val.is_hidden ? 1 : 0,
            val.supplier_id || '', val.supplier_product_id || '', val.supplier_region_id || '', val.api_mapping || ''
          );
        }
      }
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    res.json({ message: 'Product updated', product });
  } catch (error: any) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/products/:id', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    // Check for existing orders
    const orderItems = db.prepare('SELECT id FROM order_items WHERE product_id = ? LIMIT 1').get(id);
    if (orderItems) {
      res.status(400).json({ error: 'Cannot delete product because it has associated orders. Please hide it instead.' });
      return;
    }

    // Delete associated regions and values
    const regions = db.prepare('SELECT id FROM product_regions WHERE product_id = ?').all(id) as any[];
    for (const region of regions) {
      db.prepare('DELETE FROM gift_card_values WHERE product_region_id = ?').run(region.id);
    }
    db.prepare('DELETE FROM product_regions WHERE product_id = ?').run(id);
    
    // Finally delete product
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ message: 'Product deleted' });
  } catch (error: any) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ==================== CATEGORIES ====================

router.get('/categories', (req: AuthRequest, res: Response) => {
  try {
    const categories = db.prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count
       FROM categories c ORDER BY c.sort_order ASC`
    ).all();
    res.json({ categories });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

router.post('/categories', (req: AuthRequest, res: Response) => {
  try {
    const validation = categorySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }
    const data = validation.data;
    let slug = generateSlug(data.name_en);
    const existing = db.prepare('SELECT id FROM categories WHERE slug = ?').get(slug);
    if (existing) slug = `${slug}-${Date.now()}`;

    const result = db.prepare(
      'INSERT INTO categories (name_en, name_ar, slug, icon, image, description_en, description_ar, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(sanitize(data.name_en), sanitize(data.name_ar), slug, data.icon || '', data.image || '', sanitize(data.description_en || ''), sanitize(data.description_ar || ''), data.sort_order || 0, data.is_active !== false ? 1 : 0);

    res.status(201).json({ message: 'Category created', id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/categories/:id', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name_en !== undefined) { updates.push('name_en = ?'); values.push(sanitize(data.name_en)); }
    if (data.name_ar !== undefined) { updates.push('name_ar = ?'); values.push(sanitize(data.name_ar)); }
    if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon); }
    if (data.image !== undefined) { updates.push('image = ?'); values.push(data.image); }
    if (data.description_en !== undefined) { updates.push('description_en = ?'); values.push(sanitize(data.description_en)); }
    if (data.description_ar !== undefined) { updates.push('description_ar = ?'); values.push(sanitize(data.description_ar)); }
    if (data.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(data.sort_order); }
    if (data.is_active !== undefined) { updates.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    res.json({ message: 'Category updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/categories/:id', (req: AuthRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM categories WHERE id = ?').run(parseInt(req.params.id));
    res.json({ message: 'Category deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ==================== REGIONS ====================

router.get('/regions', (req: AuthRequest, res: Response) => {
  try {
    const regions = db.prepare('SELECT * FROM regions ORDER BY sort_order ASC').all();
    res.json({ regions });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get regions' });
  }
});

router.post('/regions', (req: AuthRequest, res: Response) => {
  try {
    const validation = regionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }
    const data = validation.data;
    const result = db.prepare(
      'INSERT INTO regions (name_en, name_ar, code, flag_emoji, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(sanitize(data.name_en), sanitize(data.name_ar), data.code.toUpperCase(), data.flag_emoji || '', data.sort_order || 0, data.is_active !== false ? 1 : 0);

    res.status(201).json({ message: 'Region created', id: result.lastInsertRowid });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'A region with this Code already exists.' });
      return;
    }
    res.status(500).json({ error: 'Failed to create region' });
  }
});

router.put('/regions/:id', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name_en !== undefined) { updates.push('name_en = ?'); values.push(sanitize(data.name_en)); }
    if (data.name_ar !== undefined) { updates.push('name_ar = ?'); values.push(sanitize(data.name_ar)); }
    if (data.code !== undefined) { updates.push('code = ?'); values.push(data.code.toUpperCase()); }
    if (data.flag_emoji !== undefined) { updates.push('flag_emoji = ?'); values.push(data.flag_emoji); }
    if (data.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(data.sort_order); }
    if (data.is_active !== undefined) { updates.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE regions SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    res.json({ message: 'Region updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update region' });
  }
});

router.delete('/regions/:id', (req: AuthRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM regions WHERE id = ?').run(parseInt(req.params.id));
    res.json({ message: 'Region deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete region' });
  }
});

// ==================== ORDERS ====================

router.get('/orders', (req: AuthRequest, res: Response) => {
  try {
    const { limit, offset, page } = getPagination(req.query);
    const { status, search } = req.query as any;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (status) { where += ' AND o.status = ?'; params.push(status); }
    if (search) {
      where += ' AND (o.order_number LIKE ? OR o.full_name LIKE ? OR o.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM orders o ${where}`).get(...params) as any;
    const orders = db.prepare(
      `SELECT o.* FROM orders o ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as any[];

    for (const order of orders) {
      order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    }

    res.json({
      orders,
      pagination: { page, limit, total: countResult.total, pages: Math.ceil(countResult.total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

router.put('/orders/:id/status', (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, parseInt(req.params.id));
    res.json({ message: 'Order status updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// ==================== USERS ====================

router.get('/users', (req: AuthRequest, res: Response) => {
  try {
    const { limit, offset, page } = getPagination(req.query);
    const { search, role } = req.query as any;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      where += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (role) { where += ' AND role = ?'; params.push(role); }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM users ${where}`).get(...params) as any;
    const users = db.prepare(
      `SELECT id, name, email, role, country, whatsapp, is_active, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    res.json({
      users,
      pagination: { page, limit, total: countResult.total, pages: Math.ceil(countResult.total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get users' });
  }
});

router.put('/users/:id', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { role, is_active } = req.body;

    const target = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id) as
      | { id: number; role: string }
      | undefined;

    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const actorIsSuperAdmin = req.user?.role === 'super_admin';

    // Only Super Admins can assign/remove super_admin, or modify Super Admin accounts
    if (target.role === 'super_admin' && !actorIsSuperAdmin) {
      res.status(403).json({ error: 'Only Super Admins can modify Super Admin accounts.' });
      return;
    }

    if (role !== undefined) {
      const allowedRoles = actorIsSuperAdmin
        ? ['customer', 'admin', 'super_admin']
        : ['customer', 'admin'];

      if (!allowedRoles.includes(role)) {
        res.status(403).json({ error: 'You do not have permission to assign this role.' });
        return;
      }

      // Prevent removing the last Super Admin
      if (target.role === 'super_admin' && role !== 'super_admin') {
        const count = (
          db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'super_admin'`).get() as { c: number }
        ).c;
        if (count <= 1) {
          res.status(400).json({ error: 'Cannot demote the last Super Admin.' });
          return;
        }
      }

      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    }

    if (is_active !== undefined) {
      if (target.role === 'super_admin' && !is_active) {
        const count = (
          db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'super_admin' AND is_active = 1`).get() as {
            c: number;
          }
        ).c;
        if (count <= 1) {
          res.status(400).json({ error: 'Cannot deactivate the last active Super Admin.' });
          return;
        }
      }
      db.prepare('UPDATE users SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, id);
    }

    res.json({ message: 'User updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ==================== REVIEWS ====================

router.get('/reviews', (req: AuthRequest, res: Response) => {
  try {
    const { limit, offset, page } = getPagination(req.query);
    const { approved } = req.query as any;

    let where = 'WHERE 1=1';
    const params: any[] = [];

    if (approved !== undefined) {
      where += ' AND r.is_approved = ?';
      params.push(approved === 'true' ? 1 : 0);
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM reviews r ${where}`).get(...params) as any;
    const reviews = db.prepare(
      `SELECT r.*, u.name as user_name, u.email as user_email, p.name_en as product_name
       FROM reviews r JOIN users u ON r.user_id = u.id JOIN products p ON r.product_id = p.id
       ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    res.json({
      reviews,
      pagination: { page, limit, total: countResult.total, pages: Math.ceil(countResult.total / limit) },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get reviews' });
  }
});

router.put('/reviews/:id', (req: AuthRequest, res: Response) => {
  try {
    const { is_approved } = req.body;
    db.prepare('UPDATE reviews SET is_approved = ? WHERE id = ?').run(is_approved ? 1 : 0, parseInt(req.params.id));
    res.json({ message: 'Review updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update review' });
  }
});

router.delete('/reviews/:id', (req: AuthRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM reviews WHERE id = ?').run(parseInt(req.params.id));
    res.json({ message: 'Review deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// ==================== BANNERS ====================

router.get('/banners', (req: AuthRequest, res: Response) => {
  try {
    const banners = db.prepare('SELECT * FROM banners ORDER BY sort_order ASC').all();
    res.json({ banners });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get banners' });
  }
});

router.post('/banners', (req: AuthRequest, res: Response) => {
  try {
    const validation = bannerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }
    const data = validation.data;
    const result = db.prepare(
      'INSERT INTO banners (title_en, title_ar, subtitle_en, subtitle_ar, image, link, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(data.title_en || '', data.title_ar || '', data.subtitle_en || '', data.subtitle_ar || '', data.image || '', data.link || '', data.sort_order || 0, data.is_active !== false ? 1 : 0);
    res.status(201).json({ message: 'Banner created', id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create banner' });
  }
});

router.put('/banners/:id', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    for (const key of ['title_en', 'title_ar', 'subtitle_en', 'subtitle_ar', 'image', 'link']) {
      if (data[key] !== undefined) { updates.push(`${key} = ?`); values.push(data[key]); }
    }
    if (data.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(data.sort_order); }
    if (data.is_active !== undefined) { updates.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE banners SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    res.json({ message: 'Banner updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update banner' });
  }
});

router.delete('/banners/:id', (req: AuthRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM banners WHERE id = ?').run(parseInt(req.params.id));
    res.json({ message: 'Banner deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete banner' });
  }
});

// ==================== FAQ ====================

router.get('/faq', (req: AuthRequest, res: Response) => {
  try {
    const faqs = db.prepare('SELECT * FROM faq ORDER BY sort_order ASC').all();
    res.json({ faqs });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get FAQ' });
  }
});

router.post('/faq', (req: AuthRequest, res: Response) => {
  try {
    const validation = faqSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }
    const data = validation.data;
    const result = db.prepare(
      'INSERT INTO faq (question_en, question_ar, answer_en, answer_ar, category, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(sanitize(data.question_en), sanitize(data.question_ar), sanitize(data.answer_en), sanitize(data.answer_ar), data.category || 'general', data.sort_order || 0, data.is_active !== false ? 1 : 0);
    res.status(201).json({ message: 'FAQ created', id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create FAQ' });
  }
});

router.put('/faq/:id', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    for (const key of ['question_en', 'question_ar', 'answer_en', 'answer_ar', 'category']) {
      if (data[key] !== undefined) { updates.push(`${key} = ?`); values.push(sanitize(data[key])); }
    }
    if (data.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(data.sort_order); }
    if (data.is_active !== undefined) { updates.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE faq SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    res.json({ message: 'FAQ updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

router.delete('/faq/:id', (req: AuthRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM faq WHERE id = ?').run(parseInt(req.params.id));
    res.json({ message: 'FAQ deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// ==================== SETTINGS ====================

router.get('/settings', (req: AuthRequest, res: Response) => {
  try {
    const settings = db.prepare('SELECT * FROM settings').all() as any[];
    const settingsMap: Record<string, string> = {};
    for (const s of settings) settingsMap[s.key] = s.value;
    res.json({ settings: settingsMap });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

router.put('/settings', (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    const upsert = db.prepare(
      'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP'
    );

    const updateMany = db.transaction((entries: Record<string, string>) => {
      for (const [key, value] of Object.entries(entries)) {
        upsert.run(key, String(value), String(value));
      }
    });

    updateMany(data);
    res.json({ message: 'Settings updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ==================== COUPONS ====================

router.get('/coupons', (req: AuthRequest, res: Response) => {
  try {
    const coupons = db.prepare('SELECT * FROM coupons ORDER BY created_at DESC').all();
    res.json({ coupons });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get coupons' });
  }
});

router.post('/coupons', (req: AuthRequest, res: Response) => {
  try {
    const validation = couponSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }
    const data = validation.data;
    const result = db.prepare(
      'INSERT INTO coupons (code, type, value, min_order, max_uses, expires_at, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(data.code.toUpperCase(), data.type, data.value, data.min_order || 0, data.max_uses || 0, data.expires_at || null, data.is_active !== false ? 1 : 0);
    res.status(201).json({ message: 'Coupon created', id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

router.put('/coupons/:id', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (data.code !== undefined) { updates.push('code = ?'); values.push(data.code.toUpperCase()); }
    if (data.type !== undefined) { updates.push('type = ?'); values.push(data.type); }
    if (data.value !== undefined) { updates.push('value = ?'); values.push(data.value); }
    if (data.min_order !== undefined) { updates.push('min_order = ?'); values.push(data.min_order); }
    if (data.max_uses !== undefined) { updates.push('max_uses = ?'); values.push(data.max_uses); }
    if (data.expires_at !== undefined) { updates.push('expires_at = ?'); values.push(data.expires_at); }
    if (data.is_active !== undefined) { updates.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE coupons SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }
    res.json({ message: 'Coupon updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

router.delete('/coupons/:id', (req: AuthRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM coupons WHERE id = ?').run(parseInt(req.params.id));
    res.json({ message: 'Coupon deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// ==================== USER MANAGEMENT ====================

// GET /api/admin/users
router.get('/users', (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const search = req.query.search as string || '';
    const status = req.query.status as string || '';
    const role = req.query.role as string || '';
    const offset = (page - 1) * limit;

    let whereConditions: string[] = ['1=1'];
    let params: any[] = [];

    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ? OR phone_number LIKE ? OR firebase_uid LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereConditions.push('account_status = ?');
      params.push(status);
    }

    if (role) {
      whereConditions.push('role = ?');
      params.push(role);
    }

    const whereClause = whereConditions.join(' AND ');

    const totalCount = (db.prepare(`SELECT COUNT(*) as count FROM users WHERE ${whereClause}`).get(...params) as any).count;

    const users = db.prepare(`
      SELECT 
        id, name, email, phone_number, role, avatar, country, whatsapp,
        preferred_lang, preferred_currency, is_active, firebase_uid,
        email_verified, phone_verified, account_status, last_login,
        failed_login_attempts, locked_until, auth_provider, registration_method, created_at
      FROM users
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    res.json({
      users: users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phoneNumber: u.phone_number || u.whatsapp || null,
        role: u.role,
        avatar: u.avatar || null,
        country: u.country || null,
        whatsapp: u.whatsapp || null,
        emailVerified: Boolean(u.email_verified),
        phoneVerified: Boolean(u.phone_verified),
        accountStatus: u.account_status || (u.is_active ? 'active' : 'disabled'),
        firebaseUid: u.firebase_uid || null,
        authProvider: u.auth_provider || 'local',
        registrationMethod: u.registration_method || 'email',
        lastLogin: u.last_login || null,
        failedLoginAttempts: u.failed_login_attempts || 0,
        lockedUntil: u.locked_until || null,
        createdAt: u.created_at,
      })),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = db.prepare(`
      SELECT 
        id, name, email, phone_number, role, avatar, country, whatsapp,
        preferred_lang, preferred_currency, is_active, firebase_uid,
        email_verified, phone_verified, account_status, last_login,
        failed_login_attempts, locked_until, auth_provider, registration_method, created_at
      FROM users WHERE id = ?
    `).get(userId) as any;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const activeSessions = db.prepare(`
      SELECT id, device_name, browser, os, ip_address, location, last_active, created_at
      FROM user_sessions WHERE user_id = ? ORDER BY last_active DESC
    `).all(userId);

    const orderStats = db.prepare(`
      SELECT COUNT(*) as total_orders, COALESCE(SUM(total_usd), 0) as total_spent
      FROM orders WHERE user_id = ? AND status != 'cancelled'
    `).get(userId);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phone_number || user.whatsapp || null,
        role: user.role,
        avatar: user.avatar || null,
        country: user.country || null,
        whatsapp: user.whatsapp || null,
        emailVerified: Boolean(user.email_verified),
        phoneVerified: Boolean(user.phone_verified),
        accountStatus: user.account_status || (user.is_active ? 'active' : 'disabled'),
        firebaseUid: user.firebase_uid || null,
        authProvider: user.auth_provider || 'local',
        registrationMethod: user.registration_method || 'email',
        lastLogin: user.last_login || null,
        failedLoginAttempts: user.failed_login_attempts || 0,
        lockedUntil: user.locked_until || null,
        createdAt: user.created_at,
      },
      activeSessions,
      orderStats,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// PATCH /api/admin/users/:id/status (Enable / Disable User)
router.patch('/users/:id/status', (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { status } = req.body; // 'active' or 'disabled'

    if (!['active', 'disabled'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be "active" or "disabled".' });
      return;
    }

    const isActive = status === 'active' ? 1 : 0;
    db.prepare(`UPDATE users SET account_status = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(status, isActive, userId);

    if (status === 'disabled') {
      // Revoke all sessions if user is disabled
      db.prepare(`DELETE FROM user_sessions WHERE user_id = ?`).run(userId);
    }

    res.json({ message: `User account has been ${status === 'active' ? 'enabled' : 'disabled'}` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// POST /api/admin/users/:id/force-password-reset
router.post('/users/:id/force-password-reset', async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(userId) as any;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { generateAuthToken } = await import('../services/sessionService');
    const { sendPasswordResetEmail } = await import('../services/emailService');
    const { config } = await import('../config');

    const resetToken = generateAuthToken(userId, 'password_reset', undefined, 1);
    const resetLink = `${config.clientUrl}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.name, user.email, resetLink);

    res.json({ message: `Password reset email sent to ${user.email}` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to trigger password reset' });
  }
});

// POST /api/admin/users/:id/force-verify-email
router.post('/users/:id/force-verify-email', (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    db.prepare('UPDATE users SET email_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
    res.json({ message: 'User email marked as verified' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to verify user email' });
  }
});

// GET /api/admin/users/:id/sessions
router.get('/users/:id/sessions', (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const sessions = db.prepare(`
      SELECT id, device_name, browser, os, ip_address, location, last_active, created_at
      FROM user_sessions WHERE user_id = ? ORDER BY last_active DESC
    `).all(userId);
    res.json({ sessions });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch user sessions' });
  }
});

// POST /api/admin/users/:id/logout-all
router.post('/users/:id/logout-all', (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const result = db.prepare('DELETE FROM user_sessions WHERE user_id = ?').run(userId);
    res.json({ message: `Revoked ${result.changes} active sessions for target user` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to logout user from all devices' });
  }
});

// DELETE /api/admin/users/:id (Permanently Delete User Account)
router.delete('/users/:id', (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const currentAdminId = req.user!.id;

    if (isNaN(targetUserId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    if (targetUserId === currentAdminId) {
      res.status(400).json({ error: 'You cannot delete your own admin account while logged in.' });
      return;
    }

    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(targetUserId) as any;
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prevent deleting super_admin unless current logged in admin is also super_admin
    if (user.role === 'super_admin' && req.user!.role !== 'super_admin') {
      res.status(403).json({ error: 'Only a Super Admin can delete another Super Admin account.' });
      return;
    }

    // Perform cascade cleanup
    db.prepare('DELETE FROM user_sessions WHERE user_id = ?').run(targetUserId);
    db.prepare('DELETE FROM auth_tokens WHERE user_id = ?').run(targetUserId);
    db.prepare('DELETE FROM wishlist WHERE user_id = ?').run(targetUserId);
    db.prepare('DELETE FROM reviews WHERE user_id = ?').run(targetUserId);
    db.prepare('DELETE FROM users WHERE id = ?').run(targetUserId);

    res.json({ message: `User "${user.name}" (#${targetUserId}) has been permanently deleted.` });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
});

export default router;
