import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { config } from './config';
import { initializeDatabase, runMigrations } from './database/schema';
import { seedDatabase } from './database/seed';
import { initExchangeRates } from './utils/currency';

// Route imports
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import regionRoutes from './routes/regions';
import orderRoutes from './routes/orders';
import reviewRoutes from './routes/reviews';
import wishlistRoutes from './routes/wishlist';
import bannerRoutes from './routes/banners';
import faqRoutes from './routes/faq';
import settingsRoutes from './routes/settings';
import couponRoutes from './routes/coupons';
import adminRoutes from './routes/admin';
import inventoryRoutes from './routes/inventory';
import databaseRoutes from './routes/database';
import { maintenanceGuard } from './middleware/maintenance';

const app = express();

// ==================== SECURITY & CORS ====================

// Trust Railway's reverse proxy (required for rate limiting behind a proxy)
app.set('trust proxy', 1);

// Failproof CORS Middleware - must be the VERY FIRST middleware
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-session-token');

  // Immediately fulfill OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// Block traffic briefly during live database replace/restore
app.use(maintenanceGuard);

// Helmet with permissive cross-origin resource sharing headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per 15 minutes
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // limit each IP to 100 auth attempts per 15 minutes
  message: { error: 'Too many auth attempts, please try again later.' },
});

app.use('/api/', limiter);
app.use('/api/auth', authLimiter);

// ==================== MIDDLEWARE ====================

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ==================== ROUTES ====================

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/admin/database', databaseRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== START ====================

async function start() {
  app.listen(config.port, () => {
    console.log(`🚀 GiftVault API running on port ${config.port}`);
    console.log(`📋 Environment: ${config.nodeEnv}`);
    console.log(`🌐 Client URL: ${config.clientUrl}`);
  });

  try {
    // Initialize database asynchronously after server starts listening
    initializeDatabase();
    runMigrations();
    seedDatabase();
    console.log('✅ Database initialized');

    // Initialize exchange rates
    await initExchangeRates();
    console.log('✅ Exchange rates initialized');
  } catch (error: any) {
    console.error('⚠️ Database setup error (server running in fallback mode):', error.message || error);
  }
}

start();

export default app;
