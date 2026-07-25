import { Router, Response } from 'express';
import db from '../database/schema';
import { AuthRequest, authenticate, requireAdmin } from '../middleware/auth';
import { denominationSchema, productRegionSchema } from '../validators';
import { generateSlug, getPagination } from '../utils/helpers';

const router = Router();
router.use(authenticate, requireAdmin);

// ==================== INVENTORY SEARCH ====================

router.get('/search', (req: AuthRequest, res: Response) => {
  try {
    const { q, type } = req.query as any;
    
    if (!q) {
      return res.json({ results: [] });
    }

    const searchTerm = `%${q}%`;
    let results: any[] = [];

    if (!type || type === 'product') {
      const products = db.prepare(
        `SELECT id, name_en, name_ar, image, 'product' as type FROM products 
         WHERE name_en LIKE ? OR name_ar LIKE ? OR slug LIKE ? LIMIT 10`
      ).all(searchTerm, searchTerm, searchTerm);
      results = [...results, ...products];
    }

    if (!type || type === 'sku') {
      const denominations = db.prepare(
        `SELECT gcv.id, gcv.sku, gcv.face_value, pr.currency_code, p.name_en, 'sku' as type 
         FROM gift_card_values gcv
         JOIN product_regions pr ON gcv.product_region_id = pr.id
         JOIN products p ON pr.product_id = p.id
         WHERE gcv.sku LIKE ? LIMIT 10`
      ).all(searchTerm);
      results = [...results, ...denominations];
    }

    res.json({ results });
  } catch (error: any) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// ==================== PRODUCT QUICK ACTIONS ====================

router.patch('/products/:id/toggle', (req: AuthRequest, res: Response) => {
  try {
    const { is_active } = req.body;
    db.prepare('UPDATE products SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(is_active ? 1 : 0, parseInt(req.params.id));
    res.json({ message: 'Product visibility updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to toggle product' });
  }
});

router.post('/products/:id/duplicate', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const original = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    
    if (!original) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newSlug = `${original.slug}-copy-${Date.now()}`;
    const newName = `${original.name_en} (Copy)`;

    const insertResult = db.prepare(
      `INSERT INTO products (category_id, name_en, name_ar, slug, description_en, description_ar, short_description_en, short_description_ar, image, gallery, featured, best_seller, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)` // default inactive
    ).run(
      original.category_id, newName, original.name_ar, newSlug, original.description_en, original.description_ar, 
      original.short_description_en, original.short_description_ar, original.image, original.gallery, 
      original.featured, original.best_seller, original.sort_order
    );

    const newProductId = insertResult.lastInsertRowid;

    // Duplicate regions and denominations
    const originalRegions = db.prepare('SELECT * FROM product_regions WHERE product_id = ?').all(id) as any[];
    
    for (const region of originalRegions) {
      const prResult = db.prepare(
        `INSERT INTO product_regions (product_id, region_id, currency_code, description_en, description_ar, image, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(newProductId, region.region_id, region.currency_code, region.description_en, region.description_ar, region.image, region.sort_order, region.is_active);
      
      const newPrId = prResult.lastInsertRowid;
      const originalValues = db.prepare('SELECT * FROM gift_card_values WHERE product_region_id = ?').all(region.id) as any[];
      
      for (const val of originalValues) {
        db.prepare(
          `INSERT INTO gift_card_values (product_region_id, face_value, price_usd, discount_price_usd, stock, sku, is_active, is_featured, is_hidden, supplier_id, supplier_product_id, supplier_region_id, api_mapping)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(newPrId, val.face_value, val.price_usd, val.discount_price_usd, val.stock, val.sku, val.is_active, val.is_featured, val.is_hidden, val.supplier_id, val.supplier_product_id, val.supplier_region_id, val.api_mapping);
      }
    }

    res.status(201).json({ message: 'Product duplicated', id: newProductId });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to duplicate product' });
  }
});

// ==================== PRODUCT REGIONS ====================

router.post('/products/:productId/regions', (req: AuthRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const data = productRegionSchema.parse(req.body);

    const result = db.prepare(
      `INSERT INTO product_regions (product_id, region_id, currency_code, description_en, description_ar, image, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(productId, data.region_id, data.currency_code, data.description_en || '', data.description_ar || '', data.image || '', data.sort_order || 0, data.is_active !== false ? 1 : 0);

    res.status(201).json({ message: 'Region added', id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to add region', details: error });
  }
});

router.put('/regions/:prId', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.prId);
    const data = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];

    if (data.region_id !== undefined) { updates.push('region_id = ?'); values.push(data.region_id); }
    if (data.currency_code !== undefined) { updates.push('currency_code = ?'); values.push(data.currency_code); }
    if (data.description_en !== undefined) { updates.push('description_en = ?'); values.push(data.description_en); }
    if (data.description_ar !== undefined) { updates.push('description_ar = ?'); values.push(data.description_ar); }
    if (data.image !== undefined) { updates.push('image = ?'); values.push(data.image); }
    if (data.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(data.sort_order); }
    if (data.is_active !== undefined) { updates.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE product_regions SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    res.json({ message: 'Region updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update region' });
  }
});

router.delete('/regions/:prId', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.prId);
    db.prepare('DELETE FROM product_regions WHERE id = ?').run(id);
    res.json({ message: 'Region deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete region' });
  }
});

router.post('/regions/:prId/duplicate', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.prId);
    const original = db.prepare('SELECT * FROM product_regions WHERE id = ?').get(id) as any;
    
    if (!original) return res.status(404).json({ error: 'Region not found' });

    const prResult = db.prepare(
      `INSERT INTO product_regions (product_id, region_id, currency_code, description_en, description_ar, image, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)` // Default inactive
    ).run(original.product_id, original.region_id, original.currency_code, original.description_en, original.description_ar, original.image, original.sort_order);
    
    const newPrId = prResult.lastInsertRowid;
    const originalValues = db.prepare('SELECT * FROM gift_card_values WHERE product_region_id = ?').all(id) as any[];
    
    for (const val of originalValues) {
      db.prepare(
        `INSERT INTO gift_card_values (product_region_id, face_value, price_usd, discount_price_usd, stock, sku, is_active, is_featured, is_hidden, supplier_id, supplier_product_id, supplier_region_id, api_mapping)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(newPrId, val.face_value, val.price_usd, val.discount_price_usd, val.stock, val.sku, val.is_active, val.is_featured, val.is_hidden, val.supplier_id, val.supplier_product_id, val.supplier_region_id, val.api_mapping);
    }

    res.status(201).json({ message: 'Region duplicated', id: newPrId });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to duplicate region' });
  }
});

// ==================== DENOMINATIONS ====================

router.post('/regions/:prId/denominations', (req: AuthRequest, res: Response) => {
  try {
    const prId = parseInt(req.params.prId);
    const data = denominationSchema.parse(req.body);

    const result = db.prepare(
      `INSERT INTO gift_card_values (product_region_id, face_value, price_usd, discount_price_usd, stock, sku, is_active, is_featured, is_hidden, supplier_id, supplier_product_id, supplier_region_id, api_mapping)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      prId, data.face_value, data.price_usd, data.discount_price_usd || null, data.stock || 0, data.sku || '',
      data.is_active !== false ? 1 : 0, data.is_featured ? 1 : 0, data.is_hidden ? 1 : 0,
      data.supplier_id || '', data.supplier_product_id || '', data.supplier_region_id || '', data.api_mapping || ''
    );

    res.status(201).json({ message: 'Denomination added', id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(400).json({ error: 'Failed to add denomination', details: error });
  }
});

router.put('/denominations/:id', (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const data = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];

    const fields = ['face_value', 'price_usd', 'discount_price_usd', 'stock', 'sku', 'supplier_id', 'supplier_product_id', 'supplier_region_id', 'api_mapping'];
    for (const f of fields) {
      if (data[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(data[f]);
      }
    }

    const booleanFields = ['is_active', 'is_featured', 'is_hidden'];
    for (const f of booleanFields) {
      if (data[f] !== undefined) {
        updates.push(`${f} = ?`);
        values.push(data[f] ? 1 : 0);
      }
    }

    if (updates.length > 0) {
      values.push(id);
      db.prepare(`UPDATE gift_card_values SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    res.json({ message: 'Denomination updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update denomination' });
  }
});

router.delete('/denominations/:id', (req: AuthRequest, res: Response) => {
  try {
    db.prepare('DELETE FROM gift_card_values WHERE id = ?').run(parseInt(req.params.id));
    res.json({ message: 'Denomination deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete denomination' });
  }
});

router.put('/denominations/:id/stock', (req: AuthRequest, res: Response) => {
  try {
    const { stock } = req.body;
    db.prepare('UPDATE gift_card_values SET stock = ? WHERE id = ?').run(parseInt(stock), parseInt(req.params.id));
    res.json({ message: 'Stock updated' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// ==================== EXPORT / IMPORT ====================

router.get('/export', (req: AuthRequest, res: Response) => {
  try {
    // Basic export logic - fetch everything joined
    const inventory = db.prepare(`
      SELECT p.name_en as product_name, p.slug as product_slug, r.name_en as region_name, pr.currency_code,
             gcv.face_value, gcv.price_usd, gcv.discount_price_usd, gcv.stock, gcv.sku, gcv.is_active, gcv.is_hidden
      FROM gift_card_values gcv
      JOIN product_regions pr ON gcv.product_region_id = pr.id
      JOIN products p ON pr.product_id = p.id
      JOIN regions r ON pr.region_id = r.id
    `).all();

    res.json({ inventory });
  } catch (error: any) {
    res.status(500).json({ error: 'Export failed' });
  }
});

export default router;
