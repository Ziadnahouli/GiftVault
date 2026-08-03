import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/schema';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  let dbStatus = 'disconnected';
  let dbLatencyMs: number | null = null;

  try {
    const startTime = Date.now();
    const db = getDatabase();
    db.prepare('SELECT 1').get();
    dbLatencyMs = Date.now() - startTime;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error';
  }

  const memoryUsage = process.memoryUsage();

  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    system: {
      nodeVersion: process.version,
      memory: {
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      },
    },
  });
});

export default router;
