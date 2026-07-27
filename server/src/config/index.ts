import path from 'path';
import dotenv from 'dotenv';

const rootEnvPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: rootEnvPath });

const nodeEnv = process.env.NODE_ENV || 'development';
const projectRoot = path.dirname(rootEnvPath);

if (nodeEnv === 'production') {
  const requiredVars = ['JWT_SECRET', 'ADMIN_PASSWORD', 'CLIENT_URL'];
  for (const v of requiredVars) {
    if (!process.env[v]) {
      console.warn(`⚠️ WARNING: Missing environment variable ${v} in production! Using fallback default.`);
    }
  }
}

function resolveFromProjectRoot(rawPath: string): string {
  if (path.isAbsolute(rawPath)) return rawPath;
  return path.resolve(projectRoot, rawPath);
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  jwt: {
    secret: process.env.JWT_SECRET || 'giftvault_default_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  db: {
    path: resolveFromProjectRoot(process.env.DB_PATH || './server/data/giftvault.db'),
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  whatsappNumber: process.env.WHATSAPP_NUMBER || '96103794986',
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@giftvault.com',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
  },
  exchangeRateApiUrl: process.env.EXCHANGE_RATE_API_URL || 'https://open.er-api.com/v6/latest/USD',
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || 'giftvault-app',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT || '',
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'GiftVault <noreply@giftvault.com>',
  },
  auth: {
    lockoutMaxAttempts: 5,
    lockoutDurationMinutes: 15,
    tokenExpirationHours: 24,
  },
};
