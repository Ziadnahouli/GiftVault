import { z } from 'zod';
import path from 'path';
import dotenv from 'dotenv';

const rootEnvPath = path.resolve(__dirname, '../../../.env');
dotenv.config({ path: rootEnvPath });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  JWT_SECRET: z.string().min(8, { message: 'JWT_SECRET should be at least 8 characters long' }).default('giftvault_default_secret'),
  CLIENT_URL: z.string().url().or(z.string()).default('http://localhost:3000'),
  ADMIN_EMAIL: z.string().email().default('admin@giftvault.com'),
  ADMIN_PASSWORD: z.string().min(6).default('Admin123!'),
  DB_PATH: z.string().default('./server/data/giftvault.db'),
  WHATSAPP_NUMBER: z.string().default('96103794986'),
});

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('❌ Environment validation failed:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables in production');
    }
  } else {
    console.log('✅ Environment schema validated successfully');
  }
  return parsed.success ? parsed.data : envSchema.parse({});
}

export const env = validateEnv();
