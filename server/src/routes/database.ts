import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import os from 'os';
import { AuthRequest, authenticate, requireSuperAdmin } from '../middleware/auth';
import {
  ALLOWED_DB_EXTENSIONS,
  MAX_DB_UPLOAD_BYTES,
  createDatabaseBackup,
  deleteBackup,
  formatBytes,
  getBackupPath,
  getDatabaseStatus,
  getTempUpload,
  listAuditLogs,
  listBackups,
  registerTempUpload,
  removeTempUpload,
  replaceDatabase,
  restoreBackup,
  sanitizeBackupName,
  validateSqliteFile,
  writeAuditLog,
} from '../services/databaseManager';
import { getBackupDirectory } from '../database/schema';

const router = Router();

router.use(authenticate, requireSuperAdmin);

const uploadDir = path.join(os.tmpdir(), 'giftvault-db-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `upload_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

function fileFilter(_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_DB_EXTENSIONS.has(ext)) {
    cb(new Error('Invalid file extension. Only .db and .sqlite files are allowed.'));
    return;
  }

  // Reject obvious executable MIME types
  const forbidden = [
    'application/x-msdownload',
    'application/x-executable',
    'application/x-dosexec',
    'application/javascript',
    'text/html',
  ];
  if (file.mimetype && forbidden.includes(file.mimetype)) {
    cb(new Error('Invalid MIME type. Executable or script files are not allowed.'));
    return;
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_DB_UPLOAD_BYTES, files: 1 },
});

function clientIp(req: AuthRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function handleMulterError(err: any, res: Response): boolean {
  if (!err) return false;
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: `File exceeds maximum size of ${formatBytes(MAX_DB_UPLOAD_BYTES)}.` });
      return true;
    }
    res.status(400).json({ error: err.message });
    return true;
  }
  res.status(400).json({ error: err.message || 'Upload failed.' });
  return true;
}

// ==================== STATUS ====================

router.get('/status', (req: AuthRequest, res: Response) => {
  try {
    const status = getDatabaseStatus();
    res.json({ status });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get database status' });
  }
});

// ==================== BACKUPS ====================

router.get('/backups', (req: AuthRequest, res: Response) => {
  try {
    const backups = listBackups();
    res.json({
      backups,
      directory: getBackupDirectory(),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to list backups' });
  }
});

router.post('/backups', async (req: AuthRequest, res: Response) => {
  try {
    const backup = await createDatabaseBackup('giftvault_backup');
    writeAuditLog({
      adminId: req.user?.id,
      adminName: req.user?.name || 'Unknown',
      adminEmail: req.user?.email,
      ipAddress: clientIp(req),
      action: 'manual_backup',
      oldDatabaseSize: backup.size,
      newDatabaseSize: backup.size,
      backupName: backup.backupName,
      success: true,
    });
    res.json({
      message: 'Backup created successfully',
      backup: {
        name: backup.backupName,
        size: backup.size,
        sizeFormatted: formatBytes(backup.size),
      },
    });
  } catch (error: any) {
    writeAuditLog({
      adminId: req.user?.id,
      adminName: req.user?.name || 'Unknown',
      adminEmail: req.user?.email,
      ipAddress: clientIp(req),
      action: 'manual_backup',
      success: false,
      errorMessage: error.message,
    });
    res.status(500).json({ error: error.message || 'Failed to create backup' });
  }
});

router.get('/backups/:name/download', (req: AuthRequest, res: Response) => {
  try {
    const safeName = sanitizeBackupName(req.params.name);
    if (!safeName) {
      res.status(400).json({ error: 'Invalid backup name.' });
      return;
    }

    const backupPath = getBackupPath(safeName);
    if (!backupPath) {
      res.status(404).json({ error: 'Backup not found.' });
      return;
    }

    writeAuditLog({
      adminId: req.user?.id,
      adminName: req.user?.name || 'Unknown',
      adminEmail: req.user?.email,
      ipAddress: clientIp(req),
      action: 'download_backup',
      backupName: safeName,
      oldDatabaseSize: fs.statSync(backupPath).size,
      success: true,
    });

    res.download(backupPath, safeName);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to download backup' });
  }
});

router.post('/backups/:name/restore', async (req: AuthRequest, res: Response) => {
  const confirmation = String(req.body?.confirmation || '').trim();
  if (confirmation !== 'REPLACE DATABASE') {
    res.status(400).json({
      error: 'Confirmation required. Type REPLACE DATABASE to continue.',
    });
    return;
  }

  const safeName = sanitizeBackupName(req.params.name);
  if (!safeName) {
    res.status(400).json({ error: 'Invalid backup name.' });
    return;
  }

  const oldSize = getDatabaseStatus().size;
  const result = await restoreBackup(safeName);

  writeAuditLog({
    adminId: req.user?.id,
    adminName: req.user?.name || 'Unknown',
    adminEmail: req.user?.email,
    ipAddress: clientIp(req),
    action: 'restore_backup',
    oldDatabaseSize: oldSize,
    newDatabaseSize: result.newSize,
    backupName: result.backupName || safeName,
    success: result.success,
    errorMessage: result.error,
  });

  if (!result.success) {
    res.status(result.requiresRestart ? 500 : 400).json({
      error: result.error || 'Restore failed',
      requiresRestart: result.requiresRestart || false,
      backupName: result.backupName,
    });
    return;
  }

  res.json({
    message: result.message || `Database restored from ${safeName}`,
    backupName: result.backupName,
    oldSize: result.oldSize,
    newSize: result.newSize,
    requiresRestart: false,
  });
});

router.delete('/backups/:name', (req: AuthRequest, res: Response) => {
  try {
    const safeName = sanitizeBackupName(req.params.name);
    if (!safeName) {
      res.status(400).json({ error: 'Invalid backup name.' });
      return;
    }

    const deleted = deleteBackup(safeName);
    if (!deleted) {
      res.status(404).json({ error: 'Backup not found.' });
      return;
    }

    writeAuditLog({
      adminId: req.user?.id,
      adminName: req.user?.name || 'Unknown',
      adminEmail: req.user?.email,
      ipAddress: clientIp(req),
      action: 'delete_backup',
      backupName: safeName,
      success: true,
    });

    res.json({ message: 'Backup deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete backup' });
  }
});

// ==================== VALIDATE / REPLACE ====================

router.post('/validate', (req: AuthRequest, res: Response) => {
  upload.single('database')(req, res, (err) => {
    if (handleMulterError(err, res)) return;

    try {
      if (!req.file) {
        res.status(400).json({ error: 'No database file uploaded.' });
        return;
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      if (!ALLOWED_DB_EXTENSIONS.has(ext)) {
        fs.unlinkSync(req.file.path);
        res.status(400).json({ error: 'Invalid file extension. Only .db and .sqlite files are allowed.' });
        return;
      }

      const validation = validateSqliteFile(req.file.path);

      if (!validation.valid) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {
          // ignore
        }

        writeAuditLog({
          adminId: req.user?.id,
          adminName: req.user?.name || 'Unknown',
          adminEmail: req.user?.email,
          ipAddress: clientIp(req),
          action: 'validate_upload',
          newDatabaseSize: validation.fileSize,
          success: false,
          errorMessage: validation.errors.join('; '),
        });

        res.status(400).json({
          valid: false,
          errors: validation.errors,
          warnings: validation.warnings,
          fileName: req.file.originalname,
          fileSize: validation.fileSize,
          fileSizeFormatted: validation.fileSizeFormatted,
        });
        return;
      }

      const tempId = crypto.randomBytes(16).toString('hex');
      registerTempUpload(tempId, req.file.path, req.file.originalname, req.file.size);

      writeAuditLog({
        adminId: req.user?.id,
        adminName: req.user?.name || 'Unknown',
        adminEmail: req.user?.email,
        ipAddress: clientIp(req),
        action: 'validate_upload',
        newDatabaseSize: validation.fileSize,
        success: true,
      });

      res.json({
        valid: true,
        tempId,
        errors: [],
        warnings: validation.warnings,
        stats: validation.stats,
        fileName: req.file.originalname,
        fileSize: validation.fileSize,
        fileSizeFormatted: validation.fileSizeFormatted,
        message: 'Database file is valid and ready to replace.',
      });
    } catch (error: any) {
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {
          // ignore
        }
      }
      res.status(500).json({ error: error.message || 'Validation failed' });
    }
  });
});

router.post('/replace', async (req: AuthRequest, res: Response) => {
  try {
    const { tempId, confirmation } = req.body || {};

    if (String(confirmation || '').trim() !== 'REPLACE DATABASE') {
      res.status(400).json({
        error: 'Confirmation required. Type REPLACE DATABASE to continue.',
      });
      return;
    }

    if (!tempId || typeof tempId !== 'string') {
      res.status(400).json({ error: 'Missing validated upload (tempId). Please re-upload the database.' });
      return;
    }

    const temp = getTempUpload(tempId);
    if (!temp) {
      res.status(400).json({
        error: 'Upload session expired or not found. Please upload and validate the database again.',
      });
      return;
    }

    const revalidation = validateSqliteFile(temp.filePath);
    if (!revalidation.valid) {
      removeTempUpload(tempId);
      res.status(400).json({
        error: 'Re-validation failed. Database was not replaced.',
        errors: revalidation.errors,
      });
      return;
    }

    const oldSize = getDatabaseStatus().size;
    const result = await replaceDatabase(temp.filePath);
    removeTempUpload(tempId);

    writeAuditLog({
      adminId: req.user?.id,
      adminName: req.user?.name || 'Unknown',
      adminEmail: req.user?.email,
      ipAddress: clientIp(req),
      action: 'replace_database',
      oldDatabaseSize: result.oldSize || oldSize,
      newDatabaseSize: result.newSize,
      backupName: result.backupName,
      success: result.success,
      errorMessage: result.error,
    });

    if (!result.success) {
      res.status(result.requiresRestart ? 500 : 400).json({
        error: result.error || 'Database replace failed',
        requiresRestart: result.requiresRestart || false,
        backupName: result.backupName,
      });
      return;
    }

    res.json({
      message: result.message,
      backupName: result.backupName,
      oldSize: result.oldSize,
      newSize: result.newSize,
      oldSizeFormatted: formatBytes(result.oldSize),
      newSizeFormatted: formatBytes(result.newSize),
      requiresRestart: false,
    });
  } catch (error: any) {
    writeAuditLog({
      adminId: req.user?.id,
      adminName: req.user?.name || 'Unknown',
      adminEmail: req.user?.email,
      ipAddress: clientIp(req),
      action: 'replace_database',
      success: false,
      errorMessage: error.message,
    });
    res.status(500).json({
      error: error.message || 'Database replace failed',
      requiresRestart: true,
    });
  }
});

// ==================== AUDIT LOG ====================

router.get('/audit-log', (req: AuthRequest, res: Response) => {
  try {
    const logs = listAuditLogs(100);
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to load audit log' });
  }
});

export default router;
