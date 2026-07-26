import { Request, Response, NextFunction } from 'express';
import { isDbMaintenanceActive } from '../services/databaseManager';

/**
 * Blocks non-health traffic while a database replace/restore is in progress.
 */
export function maintenanceGuard(req: Request, res: Response, next: NextFunction): void {
  if (!isDbMaintenanceActive()) {
    next();
    return;
  }

  if (req.path === '/api/health' || req.path.startsWith('/api/health')) {
    next();
    return;
  }

  res.status(503).json({
    error: 'The application is temporarily in maintenance mode while the database is being updated. Please try again shortly.',
    maintenance: true,
  });
}
