import Database from 'better-sqlite3';
import type { Database as BetterSqlite3Database } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';

export function getResolvedDbPath(): string {
  return path.resolve(config.db.path);
}

export function getDbDirectory(): string {
  return path.dirname(getResolvedDbPath());
}

export function getBackupDirectory(): string {
  const backupDir = path.join(getDbDirectory(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  return backupDir;
}

const dbDir = getDbDirectory();
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let _db: BetterSqlite3Database = openDatabaseConnection(getResolvedDbPath());

function openDatabaseConnection(dbPath: string): BetterSqlite3Database {
  try {
    const database = new Database(dbPath);
    try { database.pragma('journal_mode = WAL'); } catch {}
    try { database.pragma('foreign_keys = ON'); } catch {}
    return database;
  } catch (err: any) {
    console.error(`⚠️ Could not open SQLite database file at "${dbPath}": ${err.message}. Using fallback in-memory SQLite.`);
    const fallbackDb = new Database(':memory:');
    try { fallbackDb.pragma('foreign_keys = ON'); } catch {}
    return fallbackDb;
  }
}

/**
 * Proxy so existing `import db from ...` keeps working after close/reopen.
 */
const db: BetterSqlite3Database = new Proxy({} as BetterSqlite3Database, {
  get(_target, prop, receiver) {
    const value = Reflect.get(_db as object, prop, receiver);
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(_db);
    }
    return value;
  },
  set(_target, prop, value) {
    return Reflect.set(_db as object, prop, value);
  },
});

export function getDatabase(): BetterSqlite3Database {
  return _db;
}

export function isDatabaseOpen(): boolean {
  try {
    return _db.open;
  } catch {
    return false;
  }
}

export function closeDatabase(): void {
  if (!_db.open) return;
  try {
    _db.pragma('wal_checkpoint(TRUNCATE)');
  } catch {
    // Best-effort checkpoint before close
  }
  _db.close();
}

export function reopenDatabase(): void {
  if (_db.open) {
    closeDatabase();
  }
  _db = openDatabaseConnection(getResolvedDbPath());
}

export function initializeDatabase(): void {
  _db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'admin', 'super_admin')),
      avatar TEXT,
      country TEXT,
      whatsapp TEXT,
      preferred_lang TEXT DEFAULT 'en',
      preferred_currency TEXT DEFAULT 'USD',
      is_active INTEGER DEFAULT 1,
      firebase_uid TEXT UNIQUE,
      phone_number TEXT UNIQUE,
      email_verified INTEGER DEFAULT 0,
      phone_verified INTEGER DEFAULT 0,
      account_status TEXT DEFAULT 'active',
      last_login DATETIME,
      failed_login_attempts INTEGER DEFAULT 0,
      locked_until DATETIME,
      remember_me_token TEXT,
      auth_provider TEXT DEFAULT 'local',
      registration_method TEXT DEFAULT 'email',
      notification_settings TEXT DEFAULT '{"email":true,"sms":true,"security":true}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- User Sessions table (for active sessions & connected devices management)
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_token TEXT UNIQUE NOT NULL,
      refresh_token TEXT UNIQUE,
      device_name TEXT,
      browser TEXT,
      os TEXT,
      ip_address TEXT,
      location TEXT,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Auth Tokens table (for email verification, phone OTP, password reset, email & phone change)
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('email_verification', 'phone_otp', 'password_reset', 'email_change', 'phone_change')),
      new_value TEXT,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Run automatic migration if existing auth_tokens table lacks phone_otp check
  try {
    _db.exec(`
      CREATE TABLE IF NOT EXISTS auth_tokens_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('email_verification', 'phone_otp', 'password_reset', 'email_change', 'phone_change')),
        new_value TEXT,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      INSERT OR IGNORE INTO auth_tokens_new SELECT * FROM auth_tokens;
      DROP TABLE auth_tokens;
      ALTER TABLE auth_tokens_new RENAME TO auth_tokens;
    `);
  } catch {
    // Table already migrated
  }

  _db.exec(`
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

    -- Database management audit log
    CREATE TABLE IF NOT EXISTS database_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      admin_name TEXT NOT NULL,
      admin_email TEXT,
      ip_address TEXT,
      action TEXT NOT NULL,
      old_database_size INTEGER,
      new_database_size INTEGER,
      backup_name TEXT,
      success INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    CREATE INDEX IF NOT EXISTS idx_database_audit_log_created ON database_audit_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_auth_tokens_lookup ON auth_tokens(token, type);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
  `);

  try { _db.exec(`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);`); } catch {}
  try { _db.exec(`CREATE INDEX IF NOT EXISTS idx_users_firebase ON users(firebase_uid);`); } catch {}

  runMigrations();
}

/**
 * Safely add a column to a table if it doesn't already exist.
 * SQLite throws an error if the column already exists, so we catch it.
 */
function safeAddColumn(table: string, column: string, definition: string): void {
  try {
    _db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch {
    // Column already exists — ignore
  }
}

function migrateUsersRoleConstraint(): void {
  const row = _db
    .prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'`)
    .get() as { sql?: string } | undefined;

  if (!row?.sql || row.sql.includes('super_admin')) {
    return;
  }

  _db.pragma('foreign_keys = OFF');
  try {
    const columns = (_db.pragma('table_info(users)') as any[]).map(c => c.name);
    const colList = columns.join(', ');

    _db.exec(`
      CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'admin', 'super_admin')),
        avatar TEXT,
        country TEXT,
        whatsapp TEXT,
        preferred_lang TEXT DEFAULT 'en',
        preferred_currency TEXT DEFAULT 'USD',
        is_active INTEGER DEFAULT 1,
        firebase_uid TEXT UNIQUE,
        phone_number TEXT UNIQUE,
        email_verified INTEGER DEFAULT 0,
        phone_verified INTEGER DEFAULT 0,
        account_status TEXT DEFAULT 'active',
        last_login DATETIME,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until DATETIME,
        remember_me_token TEXT,
        auth_provider TEXT DEFAULT 'local',
        registration_method TEXT DEFAULT 'email',
        notification_settings TEXT DEFAULT '{"email":true,"sms":true,"security":true}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO users_new (${colList})
      SELECT ${colList} FROM users;

      DROP TABLE users;
      ALTER TABLE users_new RENAME TO users;
    `);
    console.log('✅ Migrated users role constraint to include super_admin');
  } catch (e: any) {
    console.warn('⚠️ Migration notice:', e.message);
  } finally {
    _db.pragma('foreign_keys = ON');
  }
}

/**
 * Run migrations for existing databases to add new inventory management columns.
 * Safe to call multiple times — idempotent.
 */
export function runMigrations(): void {
  migrateUsersRoleConstraint();

  // Ensure audit table exists on older databases
  _db.exec(`
    CREATE TABLE IF NOT EXISTS database_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER,
      admin_name TEXT NOT NULL,
      admin_email TEXT,
      ip_address TEXT,
      action TEXT NOT NULL,
      old_database_size INTEGER,
      new_database_size INTEGER,
      backup_name TEXT,
      success INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_database_audit_log_created ON database_audit_log(created_at);
  `);

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

  // users table new columns
  safeAddColumn('users', 'firebase_uid', 'TEXT');
  safeAddColumn('users', 'phone_number', 'TEXT');
  safeAddColumn('users', 'email_verified', 'INTEGER DEFAULT 0');
  safeAddColumn('users', 'phone_verified', 'INTEGER DEFAULT 0');
  safeAddColumn('users', 'account_status', "TEXT DEFAULT 'active'");
  safeAddColumn('users', 'last_login', 'DATETIME');
  safeAddColumn('users', 'failed_login_attempts', 'INTEGER DEFAULT 0');
  safeAddColumn('users', 'locked_until', 'DATETIME');
  safeAddColumn('users', 'remember_me_token', 'TEXT');
  safeAddColumn('users', 'auth_provider', "TEXT DEFAULT 'local'");
  safeAddColumn('users', 'registration_method', "TEXT DEFAULT 'email'");
  safeAddColumn('users', 'notification_settings', `TEXT DEFAULT '{"email":true,"sms":true,"security":true}'`);

  // Ensure sessions and tokens tables exist
  _db.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_token TEXT UNIQUE NOT NULL,
      refresh_token TEXT UNIQUE,
      device_name TEXT,
      browser TEXT,
      os TEXT,
      ip_address TEXT,
      location TEXT,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS auth_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('email_verification', 'password_reset', 'email_change', 'phone_change')),
      new_value TEXT,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create indexes for auth and session performance
  try {
    _db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
      CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
      CREATE INDEX IF NOT EXISTS idx_gift_card_values_sku ON gift_card_values(sku);
      CREATE INDEX IF NOT EXISTS idx_gift_card_values_stock ON gift_card_values(stock);
    `);
  } catch (e: any) {
    console.error('Failed to create new indexes:', e.message);
  }

  console.log('✅ Database migrations complete');
}

export default db;
