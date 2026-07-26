import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import {
  closeDatabase,
  getBackupDirectory,
  getDatabase,
  getResolvedDbPath,
  isDatabaseOpen,
  reopenDatabase,
} from '../database/schema';

export const MAX_DB_UPLOAD_BYTES = 500 * 1024 * 1024; // 500 MB
export const ALLOWED_DB_EXTENSIONS = new Set(['.db', '.sqlite']);
export const SQLITE_HEADER = Buffer.from('SQLite format 3\0');

export const REQUIRED_TABLES: Record<string, string[]> = {
  users: ['id', 'name', 'email', 'password_hash', 'role'],
  products: ['id', 'category_id', 'name_en', 'name_ar', 'slug'],
  categories: ['id', 'name_en', 'name_ar', 'slug'],
  orders: ['id', 'order_number', 'status', 'total_usd'],
  order_items: ['id', 'order_id', 'product_id', 'product_name', 'quantity', 'price_usd'],
  settings: ['key', 'value'],
  regions: ['id', 'name_en', 'name_ar', 'code'],
  product_regions: ['id', 'product_id', 'region_id', 'currency_code'],
  gift_card_values: ['id', 'product_region_id', 'face_value', 'price_usd'],
};

let maintenanceLock = false;
const tempUploads = new Map<string, { filePath: string; expiresAt: number; originalName: string; size: number }>();

export function isDbMaintenanceActive(): boolean {
  return maintenanceLock;
}

export function enterDbMaintenance(): void {
  maintenanceLock = true;
}

export function exitDbMaintenance(): void {
  maintenanceLock = false;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getSidecarPaths(dbPath: string): string[] {
  return [`${dbPath}-wal`, `${dbPath}-shm`, `${dbPath}-journal`];
}

export function getFileSizeSafe(filePath: string): number {
  try {
    if (!fs.existsSync(filePath)) return 0;
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

export function createBackupName(prefix = 'giftvault_backup'): string {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-') + '_' + [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('-');
  return `${prefix}_${stamp}.db`;
}

export function sanitizeBackupName(name: string): string | null {
  if (!name || typeof name !== 'string') return null;
  const base = path.basename(name);
  if (base !== name) return null; // path traversal
  if (!/^[\w.\-]+\.db$/i.test(base)) return null;
  if (base.includes('..')) return null;
  return base;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats?: {
    products: number;
    users: number;
    orders: number;
    categories: number;
    settings: number;
  };
  fileSize: number;
  fileSizeFormatted: string;
}

export function validateSqliteFile(filePath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const fileSize = getFileSizeSafe(filePath);

  if (!fs.existsSync(filePath)) {
    return {
      valid: false,
      errors: ['Uploaded file was not found on the server.'],
      warnings,
      fileSize: 0,
      fileSizeFormatted: '0 B',
    };
  }

  if (fileSize === 0) {
    errors.push('File is empty.');
  }

  if (fileSize > MAX_DB_UPLOAD_BYTES) {
    errors.push(`File exceeds maximum size of ${formatBytes(MAX_DB_UPLOAD_BYTES)}.`);
  }

  // SQLite header check
  try {
    const fd = fs.openSync(filePath, 'r');
    const header = Buffer.alloc(16);
    fs.readSync(fd, header, 0, 16, 0);
    fs.closeSync(fd);
    if (!header.equals(SQLITE_HEADER)) {
      errors.push('Invalid SQLite header. File does not appear to be a SQLite database.');
    }
  } catch (e: any) {
    errors.push(`Failed to read file header: ${e.message}`);
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      warnings,
      fileSize,
      fileSizeFormatted: formatBytes(fileSize),
    };
  }

  let probe: Database.Database | null = null;
  try {
    probe = new Database(filePath, { readonly: true, fileMustExist: true });
    const integrity = probe.pragma('integrity_check', { simple: true }) as string;
    if (integrity !== 'ok') {
      errors.push(`SQLite integrity check failed: ${integrity}`);
    }

    const tables = probe
      .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`)
      .all()
      .map((t: any) => t.name as string);

    for (const [table, requiredColumns] of Object.entries(REQUIRED_TABLES)) {
      if (!tables.includes(table)) {
        errors.push(`Required table missing: ${table}`);
        continue;
      }

      const columns = probe.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
      const columnNames = new Set(columns.map((c) => c.name));
      for (const col of requiredColumns) {
        if (!columnNames.has(col)) {
          errors.push(`Required column missing: ${table}.${col}`);
        }
      }
    }

    let stats: ValidationResult['stats'];
    if (errors.length === 0) {
      const count = (table: string) =>
        (probe!.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as { c: number }).c;

      stats = {
        products: count('products'),
        users: count('users'),
        orders: count('orders'),
        categories: count('categories'),
        settings: count('settings'),
      };

      const superAdmins = (
        probe
          .prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'super_admin' AND is_active = 1`)
          .get() as { c: number }
      ).c;

      if (superAdmins === 0) {
        warnings.push(
          'Uploaded database has no active Super Admin user. You may lose access to Database Management after replace unless you promote a user.'
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats,
      fileSize,
      fileSizeFormatted: formatBytes(fileSize),
    };
  } catch (e: any) {
    errors.push(`Failed to open or inspect SQLite database: ${e.message}`);
    return {
      valid: false,
      errors,
      warnings,
      fileSize,
      fileSizeFormatted: formatBytes(fileSize),
    };
  } finally {
    try {
      probe?.close();
    } catch {
      // ignore
    }
  }
}

export function registerTempUpload(tempId: string, filePath: string, originalName: string, size: number): void {
  // Expire after 30 minutes
  tempUploads.set(tempId, {
    filePath,
    originalName,
    size,
    expiresAt: Date.now() + 30 * 60 * 1000,
  });
  cleanupExpiredTempUploads();
}

export function getTempUpload(tempId: string) {
  cleanupExpiredTempUploads();
  return tempUploads.get(tempId);
}

export function removeTempUpload(tempId: string): void {
  const entry = tempUploads.get(tempId);
  if (entry) {
    try {
      if (fs.existsSync(entry.filePath)) fs.unlinkSync(entry.filePath);
    } catch {
      // ignore
    }
    tempUploads.delete(tempId);
  }
}

function cleanupExpiredTempUploads(): void {
  const now = Date.now();
  for (const [id, entry] of tempUploads.entries()) {
    if (entry.expiresAt <= now) {
      try {
        if (fs.existsSync(entry.filePath)) fs.unlinkSync(entry.filePath);
      } catch {
        // ignore
      }
      tempUploads.delete(id);
    }
  }
}

export async function createDatabaseBackup(
  prefix = 'giftvault_backup'
): Promise<{ backupName: string; backupPath: string; size: number }> {
  const backupDir = getBackupDirectory();
  const backupName = createBackupName(prefix);
  const backupPath = path.join(backupDir, backupName);
  const dbPath = getResolvedDbPath();

  if (!fs.existsSync(dbPath)) {
    throw new Error('Current database file does not exist.');
  }

  // Prefer online backup API while connection is open
  if (isDatabaseOpen()) {
    const db = getDatabase();
    await db.backup(backupPath);
  } else {
    fs.copyFileSync(dbPath, backupPath);
  }

  return {
    backupName,
    backupPath,
    size: getFileSizeSafe(backupPath),
  };
}

export interface DatabaseStatus {
  path: string;
  size: number;
  sizeFormatted: string;
  lastModified: string | null;
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  totalCategories: number;
  walSize: number;
  storageUsed: number;
  storageUsedFormatted: string;
  backupCount: number;
  backupsTotalSize: number;
  backupsTotalSizeFormatted: string;
}

export function getDatabaseStatus(): DatabaseStatus {
  const dbPath = getResolvedDbPath();
  const size = getFileSizeSafe(dbPath);
  let lastModified: string | null = null;
  if (fs.existsSync(dbPath)) {
    lastModified = fs.statSync(dbPath).mtime.toISOString();
  }

  const db = getDatabase();
  const totalProducts = (db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }).c;
  const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  const totalOrders = (db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }).c;
  const totalCategories = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number }).c;

  const walSize = getFileSizeSafe(`${dbPath}-wal`);
  const backups = listBackups();
  const backupsTotalSize = backups.reduce((sum, b) => sum + b.size, 0);
  const storageUsed = size + walSize + backupsTotalSize;

  return {
    path: dbPath,
    size,
    sizeFormatted: formatBytes(size),
    lastModified,
    totalProducts,
    totalUsers,
    totalOrders,
    totalCategories,
    walSize,
    storageUsed,
    storageUsedFormatted: formatBytes(storageUsed),
    backupCount: backups.length,
    backupsTotalSize,
    backupsTotalSizeFormatted: formatBytes(backupsTotalSize),
  };
}

export interface BackupInfo {
  name: string;
  path: string;
  size: number;
  sizeFormatted: string;
  createdAt: string;
  modifiedAt: string;
}

export function listBackups(): BackupInfo[] {
  const backupDir = getBackupDirectory();
  if (!fs.existsSync(backupDir)) return [];

  return fs
    .readdirSync(backupDir)
    .filter((f) => f.toLowerCase().endsWith('.db'))
    .map((name) => {
      const fullPath = path.join(backupDir, name);
      const stat = fs.statSync(fullPath);
      return {
        name,
        path: fullPath,
        size: stat.size,
        sizeFormatted: formatBytes(stat.size),
        createdAt: stat.birthtime.toISOString(),
        modifiedAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
}

export function getBackupPath(name: string): string | null {
  const safe = sanitizeBackupName(name);
  if (!safe) return null;
  const fullPath = path.join(getBackupDirectory(), safe);
  const resolved = path.resolve(fullPath);
  const backupRoot = path.resolve(getBackupDirectory());
  if (!resolved.startsWith(backupRoot + path.sep) && resolved !== backupRoot) {
    return null;
  }
  if (!fs.existsSync(resolved)) return null;
  return resolved;
}

export function deleteBackup(name: string): boolean {
  const backupPath = getBackupPath(name);
  if (!backupPath) return false;
  fs.unlinkSync(backupPath);
  return true;
}

export interface ReplaceResult {
  success: boolean;
  backupName?: string;
  oldSize: number;
  newSize: number;
  error?: string;
  requiresRestart?: boolean;
  message?: string;
}

function removeSidecarFiles(dbPath: string): void {
  for (const sidecar of getSidecarPaths(dbPath)) {
    try {
      if (fs.existsSync(sidecar)) fs.unlinkSync(sidecar);
    } catch {
      // ignore
    }
  }
}

function copyFileReplace(source: string, destination: string): void {
  const tempDest = `${destination}.replacing`;
  fs.copyFileSync(source, tempDest);
  fs.renameSync(tempDest, destination);
}

/**
 * Replace the live database with a validated source file.
 * Automatically backs up first and rolls back on failure.
 */
export async function replaceDatabase(sourcePath: string): Promise<ReplaceResult> {
  const dbPath = getResolvedDbPath();
  const oldSize = getFileSizeSafe(dbPath);
  let backupName: string | undefined;
  let backupPath: string | undefined;
  let rolledBack = false;

  enterDbMaintenance();

  try {
    // Persist maintenance setting while DB is still open
    try {
      getDatabase()
        .prepare(
          `INSERT INTO settings (key, value, updated_at) VALUES ('maintenance_mode', 'true', CURRENT_TIMESTAMP)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
        )
        .run();
    } catch {
      // continue even if settings write fails
    }

    // 1) Backup while connection is open (online backup)
    const backup = await createDatabaseBackup('giftvault_backup');
    backupName = backup.backupName;
    backupPath = backup.backupPath;

    // 2) Close all connections
    closeDatabase();

    // 3) Replace file + remove WAL/SHM
    removeSidecarFiles(dbPath);
    copyFileReplace(sourcePath, dbPath);
    removeSidecarFiles(dbPath);

    // 4) Reopen connection
    try {
      reopenDatabase();
    } catch (reopenError: any) {
      // Attempt rollback
      if (backupPath && fs.existsSync(backupPath)) {
        try {
          removeSidecarFiles(dbPath);
          fs.copyFileSync(backupPath, dbPath);
          removeSidecarFiles(dbPath);
          reopenDatabase();
          rolledBack = true;
        } catch {
          return {
            success: false,
            backupName,
            oldSize,
            newSize: getFileSizeSafe(dbPath),
            requiresRestart: true,
            error:
              `Failed to reopen database after replace, and automatic rollback also failed. ` +
              `A backup was saved as "${backupName}". Restart the backend process manually and restore from backups if needed. ` +
              `Details: ${reopenError.message}`,
          };
        }
      }

      return {
        success: false,
        backupName,
        oldSize,
        newSize: getFileSizeSafe(dbPath),
        requiresRestart: !rolledBack,
        error: rolledBack
          ? `Failed to open the new database. Previous database was restored from backup "${backupName}". ${reopenError.message}`
          : `Failed to open the new database. Restart the backend and restore backup "${backupName}". ${reopenError.message}`,
      };
    }

    // 5) Verify new database
    const verification = validateSqliteFile(dbPath);
    if (!verification.valid) {
      // Rollback
      closeDatabase();
      if (backupPath && fs.existsSync(backupPath)) {
        removeSidecarFiles(dbPath);
        fs.copyFileSync(backupPath, dbPath);
        removeSidecarFiles(dbPath);
        reopenDatabase();
        rolledBack = true;
      }

      return {
        success: false,
        backupName,
        oldSize,
        newSize: getFileSizeSafe(dbPath),
        error: `New database failed post-replace verification: ${verification.errors.join('; ')}. ` +
          (rolledBack ? `Previous database restored from "${backupName}".` : 'Automatic restore may have failed — restart may be required.'),
        requiresRestart: !rolledBack,
      };
    }

    // Exit maintenance setting on new DB
    try {
      getDatabase()
        .prepare(
          `INSERT INTO settings (key, value, updated_at) VALUES ('maintenance_mode', 'false', CURRENT_TIMESTAMP)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
        )
        .run();
    } catch {
      // ignore
    }

    return {
      success: true,
      backupName,
      oldSize,
      newSize: getFileSizeSafe(dbPath),
      message: `Database replaced successfully. Backup saved as ${backupName}.`,
    };
  } catch (e: any) {
    // Attempt emergency rollback
    try {
      if (isDatabaseOpen()) closeDatabase();
    } catch {
      // ignore
    }

    if (backupPath && fs.existsSync(backupPath)) {
      try {
        removeSidecarFiles(dbPath);
        fs.copyFileSync(backupPath, dbPath);
        removeSidecarFiles(dbPath);
        reopenDatabase();
        rolledBack = true;
      } catch (rollbackError: any) {
        return {
          success: false,
          backupName,
          oldSize,
          newSize: getFileSizeSafe(dbPath),
          requiresRestart: true,
          error:
            `Database replace failed (${e.message}). Automatic rollback also failed (${rollbackError.message}). ` +
            `Backup available: ${backupName}. Please restart the backend process and restore manually.`,
        };
      }
    }

    return {
      success: false,
      backupName,
      oldSize,
      newSize: getFileSizeSafe(dbPath),
      requiresRestart: !rolledBack,
      error: rolledBack
        ? `Database replace failed and was rolled back using "${backupName}": ${e.message}`
        : `Database replace failed: ${e.message}`,
    };
  } finally {
    exitDbMaintenance();
  }
}

/**
 * Restore a named backup over the live database.
 */
export async function restoreBackup(backupName: string): Promise<ReplaceResult> {
  const backupPath = getBackupPath(backupName);
  if (!backupPath) {
    return {
      success: false,
      oldSize: getFileSizeSafe(getResolvedDbPath()),
      newSize: 0,
      error: 'Backup not found or invalid backup name.',
    };
  }

  const validation = validateSqliteFile(backupPath);
  if (!validation.valid) {
    return {
      success: false,
      oldSize: getFileSizeSafe(getResolvedDbPath()),
      newSize: validation.fileSize,
      error: `Backup failed validation: ${validation.errors.join('; ')}`,
    };
  }

  // replaceDatabase will create another safety backup before restore
  return replaceDatabase(backupPath);
}

export interface AuditLogInput {
  adminId?: number;
  adminName: string;
  adminEmail?: string;
  ipAddress?: string;
  action: string;
  oldDatabaseSize?: number;
  newDatabaseSize?: number;
  backupName?: string;
  success: boolean;
  errorMessage?: string;
}

export function writeAuditLog(entry: AuditLogInput): void {
  try {
    if (!isDatabaseOpen()) return;
    getDatabase()
      .prepare(
        `INSERT INTO database_audit_log
          (admin_id, admin_name, admin_email, ip_address, action, old_database_size, new_database_size, backup_name, success, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        entry.adminId ?? null,
        entry.adminName,
        entry.adminEmail ?? null,
        entry.ipAddress ?? null,
        entry.action,
        entry.oldDatabaseSize ?? null,
        entry.newDatabaseSize ?? null,
        entry.backupName ?? null,
        entry.success ? 1 : 0,
        entry.errorMessage ?? null
      );
  } catch (e) {
    console.error('Failed to write database audit log:', e);
  }
}

export function listAuditLogs(limit = 50): any[] {
  try {
    return getDatabase()
      .prepare(
        `SELECT id, admin_name, admin_email, ip_address, action, old_database_size, new_database_size,
                backup_name, success, error_message, created_at
         FROM database_audit_log
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .all(limit);
  } catch {
    return [];
  }
}
