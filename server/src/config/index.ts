import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'production') {
  const requiredVars = ['JWT_SECRET', 'ADMIN_PASSWORD', 'CLIENT_URL'];
  for (const v of requiredVars) {
    if (!process.env[v]) {
      console.error(`❌ CRITICAL: Missing required environment variable ${v} in production!`);
      process.exit(1);
    }
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  jwt: {
    secret: process.env.JWT_SECRET || 'giftvault_default_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  db: {
    path: process.env.DB_PATH || './data/giftvault.db',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  whatsappNumber: process.env.WHATSAPP_NUMBER || '96103794986',
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@giftvault.com',
    password: process.env.ADMIN_PASSWORD || 'Admin123!',
  },
  exchangeRateApiUrl: process.env.EXCHANGE_RATE_API_URL || 'https://open.er-api.com/v6/latest/USD',
};
