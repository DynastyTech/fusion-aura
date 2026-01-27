import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (two levels up from apps/api/src)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT || process.env.API_PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || '',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    currency: process.env.STRIPE_CURRENCY || 'zar',
  },
  meilisearch: {
    host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    masterKey: process.env.MEILISEARCH_MASTER_KEY || '',
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
    bucket: process.env.MINIO_BUCKET || 'fusionaura-uploads',
    useSSL: process.env.MINIO_USE_SSL === 'true',
  },
  email: {
    // Resend API (recommended for production - uses HTTPS, not blocked by cloud providers)
    resendApiKey: process.env.RESEND_API_KEY || '',
    emailFrom: process.env.EMAIL_FROM || 'FusionAura <onboarding@resend.dev>',
    adminEmail: process.env.ADMIN_EMAIL || 'fusionauraza@gmail.com',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};

// Validate required environment variables
const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  // 'STRIPE_SECRET_KEY', // Not using Stripe
];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.warn(`⚠️  Warning: ${varName} is not set`);
  }
}

