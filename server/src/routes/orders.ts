import { Router, Response } from 'express';
import db from '../database/schema';
import { AuthRequest, authenticate, optionalAuth } from '../middleware/auth';
import { orderSchema } from '../validators';
import { sanitize, generateOrderNumber, getPagination } from '../utils/helpers';
import { convertCurrency } from '../utils/currency';

const router = Router();

// POST /api/orders — Create order
router.post('/', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const validation = orderSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      return;
    }

    const data = validation.data;
    const orderNumber = generateOrderNumber();
    let totalUsd = 0;

    // Validate items and calculate total
    const validatedItems: any[] = [];
    for (const item of data.items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(item.product_id) as any;
      if (!product) {
        res.status(400).json({ error: `Product ID ${item.product_id} not found` });
        return;
      }

      let priceUsd = 0;
      let faceValue = item.face_value || 0;
      let regionName = item.region_name || '';
      let currencyCode = item.currency_code || 'USD';

      if (item.gift_card_value_id) {
        const gcv = db.prepare(
          `SELECT gcv.*, pr.currency_code, r.name_en as region_name
           FROM gift_card_values gcv
           JOIN product_regions pr ON gcv.product_region_id = pr.id
           JOIN regions r ON pr.region_id = r.id
           WHERE gcv.id = ? AND gcv.is_active = 1`
        ).get(item.gift_card_value_id) as any;

        if (!gcv) {
          res.status(400).json({ error: `Gift card value ID ${item.gift_card_value_id} not found` });
          return;
        }

        if (gcv.stock < item.quantity) {
          res.status(400).json({ error: `Insufficient stock for ${product.name_en} (${gcv.face_value} ${gcv.currency_code})` });
          return;
        }

        priceUsd = gcv.price_usd;
        faceValue = gcv.face_value;
        regionName = gcv.region_name;
        currencyCode = gcv.currency_code;

        // Decrease stock
        db.prepare('UPDATE gift_card_values SET stock = stock - ? WHERE id = ?').run(item.quantity, gcv.id);
      }

      const itemTotal = priceUsd * item.quantity;
      totalUsd += itemTotal;

      validatedItems.push({
        product_id: product.id,
        product_name: product.name_en,
        region_name: regionName,
        currency_code: currencyCode,
        face_value: faceValue,
        quantity: item.quantity,
        price_usd: priceUsd,
      });
    }

    // Apply 5% checkout fee
    const feeUsd = totalUsd * 0.05;
    totalUsd += feeUsd;

    // Apply coupon if provided
    let discountAmount = 0;
    if (data.coupon_code) {
      const coupon = db.prepare(
        `SELECT * FROM coupons WHERE code = ? AND is_active = 1 
         AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
         AND (max_uses = 0 OR used_count < max_uses)`
      ).get(data.coupon_code) as any;

      if (coupon) {
        if (totalUsd >= coupon.min_order) {
          if (coupon.type === 'percentage') {
            discountAmount = totalUsd * (coupon.value / 100);
          } else {
            discountAmount = Math.min(coupon.value, totalUsd);
          }
          db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(coupon.id);
        }
      }
    }

    const finalTotal = Math.max(0, totalUsd - discountAmount);
    const displayCurrency = data.display_currency || 'USD';
    const displayTotal = convertCurrency(finalTotal, displayCurrency);

    // Create order
    const orderResult = db.prepare(
      `INSERT INTO orders (user_id, order_number, total_usd, display_currency, display_total, full_name, email, whatsapp, country, notes, coupon_code, discount_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      req.user?.id || null,
      orderNumber,
      finalTotal,
      displayCurrency,
      displayTotal,
      sanitize(data.full_name),
      data.email.toLowerCase(),
      sanitize(data.whatsapp),
      sanitize(data.country || ''),
      sanitize(data.notes || ''),
      data.coupon_code || null,
      discountAmount
    );

    // Create order items
    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, product_name, region_name, currency_code, face_value, quantity, price_usd)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const item of validatedItems) {
      insertItem.run(
        orderResult.lastInsertRowid,
        item.product_id,
        item.product_name,
        item.region_name,
        item.currency_code,
        item.face_value,
        item.quantity,
        item.price_usd
      );
    }

    // Fetch created order with items
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderResult.lastInsertRowid) as any;
    const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderResult.lastInsertRowid);

    res.status(201).json({
      message: 'Order placed successfully',
      order: { ...order, items: orderItems },
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders — User's orders
router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { limit, offset, page } = getPagination(req.query);
    const { status } = req.query as any;

    let where = 'WHERE o.user_id = ?';
    const params: any[] = [req.user!.id];

    if (status) {
      where += ' AND o.status = ?';
      params.push(status);
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM orders o ${where}`).get(...params) as any;

    const orders = db.prepare(
      `SELECT o.* FROM orders o ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as any[];

    // Attach items to each order
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

// GET /api/orders/:orderNumber
router.get('/:orderNumber', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(req.params.orderNumber) as any;

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Only allow owner or admin to view
    if (req.user && req.user.role !== 'admin' && req.user.role !== 'super_admin' && order.user_id !== req.user.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    res.json({ order });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get order' });
  }
});

export default router;
