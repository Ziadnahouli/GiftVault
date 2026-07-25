import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

const dbDir = path.dirname(path.resolve(config.db.path));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.resolve(config.db.path));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initializeDatabase(): void {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
      avatar TEXT,
      country TEXT,
      whatsapp TEXT,
      preferred_lang TEXT DEFAULT 'en',
      preferred_currency TEXT DEFAULT 'USD',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT,
      image TEXT,
      description_en TEXT,
      description_ar TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description_en TEXT,
      description_ar TEXT,
      short_description_en TEXT,
      short_description_ar TEXT,
      image TEXT,
      gallery TEXT, -- JSON array of image URLs
      featured INTEGER DEFAULT 0,
      best_seller INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    -- Regions table
    CREATE TABLE IF NOT EXISTS regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      flag_emoji TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Product Regions (links products to regions with a specific currency)
    CREATE TABLE IF NOT EXISTS product_regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      region_id INTEGER NOT NULL,
      currency_code TEXT NOT NULL,
      description_en TEXT DEFAULT '',
      description_ar TEXT DEFAULT '',
      image TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
      UNIQUE(product_id, region_id)
    );

    -- Gift Card Values (available denominations per product-region)
    CREATE TABLE IF NOT EXISTS gift_card_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_region_id INTEGER NOT NULL,
      face_value REAL NOT NULL,
      price_usd REAL NOT NULL,
      discount_price_usd REAL,
      stock INTEGER DEFAULT 0,
      sku TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      is_hidden INTEGER DEFAULT 0,
      supplier_id TEXT DEFAULT '',
      supplier_product_id TEXT DEFAULT '',
      supplier_region_id TEXT DEFAULT '',
      api_mapping TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_region_id) REFERENCES product_regions(id) ON DELETE CASCADE
    );

    -- Orders table
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      order_number TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'cancelled')),
      total_usd REAL NOT NULL,
      display_currency TEXT DEFAULT 'USD',
      display_total REAL NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      country TEXT,
      notes TEXT,
      coupon_code TEXT,
      discount_amount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Order Items table
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      region_name TEXT,
      currency_code TEXT,
      face_value REAL,
      quantity INTEGER NOT NULL DEFAULT 1,
      price_usd REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    -- Reviews table
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      is_approved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Wishlist table
    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    );

    -- Banners table
    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_en TEXT,
      title_ar TEXT,
      subtitle_en TEXT,
      subtitle_ar TEXT,
      image TEXT,
      link TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- FAQ table
    CREATE TABLE IF NOT EXISTS faq (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_en TEXT NOT NULL,
      question_ar TEXT NOT NULL,
      answer_en TEXT NOT NULL,
      answer_ar TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Settings table (key-value store)
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Coupons table
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('percentage', 'fixed')),
      value REAL NOT NULL,
      min_order REAL DEFAULT 0,
      max_uses INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      expires_at DATETIME,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Exchange rates cache
    CREATE TABLE IF NOT EXISTS exchange_rates (
      currency_code TEXT PRIMARY KEY,
      rate REAL NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
    CREATE INDEX IF NOT EXISTS idx_product_regions_product ON product_regions(product_id);
    CREATE INDEX IF NOT EXISTS idx_gift_card_values_pr ON gift_card_values(product_region_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist(user_id);
  `);
}

/**
 * Safely add a column to a table if it doesn't already exist.
 * SQLite throws an error if the column already exists, so we catch it.
 */
function safeAddColumn(table: string, column: string, definition: string): void {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch (e: any) {
    // Column already exists — ignore
  }
}

/**
 * Run migrations for existing databases to add new inventory management columns.
 * Safe to call multiple times — idempotent.
 */
export function runMigrations(): void {
  // product_regions new columns
  safeAddColumn('product_regions', 'description_en', "TEXT DEFAULT ''");
  safeAddColumn('product_regions', 'description_ar', "TEXT DEFAULT ''");
  safeAddColumn('product_regions', 'image', "TEXT DEFAULT ''");
  safeAddColumn('product_regions', 'sort_order', 'INTEGER DEFAULT 0');

  // gift_card_values new columns
  safeAddColumn('gift_card_values', 'discount_price_usd', 'REAL');
  safeAddColumn('gift_card_values', 'sku', "TEXT DEFAULT ''");
  safeAddColumn('gift_card_values', 'is_featured', 'INTEGER DEFAULT 0');
  safeAddColumn('gift_card_values', 'is_hidden', 'INTEGER DEFAULT 0');
  safeAddColumn('gift_card_values', 'supplier_id', "TEXT DEFAULT ''");
  safeAddColumn('gift_card_values', 'supplier_product_id', "TEXT DEFAULT ''");
  safeAddColumn('gift_card_values', 'supplier_region_id', "TEXT DEFAULT ''");
  safeAddColumn('gift_card_values', 'api_mapping', "TEXT DEFAULT ''");

  // Create indexes for new columns safely
  try {
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_gift_card_values_sku ON gift_card_values(sku);
      CREATE INDEX IF NOT EXISTS idx_gift_card_values_stock ON gift_card_values(stock);
    `);
  } catch (e: any) {
    console.error('Failed to create new indexes:', e.message);
  }

  console.log('✅ Database migrations complete');
}

export default db;
