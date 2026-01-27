import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import redis from '@fastify/redis';
import multipart from '@fastify/multipart';
import { config } from './config';
import { authRoutes } from './routes/auth';
import { productRoutes } from './routes/products';
import { categoryRoutes } from './routes/categories';
import { cartRoutes } from './routes/cart';
import { orderRoutes } from './routes/orders';
import { paymentRoutes } from './routes/payments'; // PayFast integration
import { wishlistRoutes } from './routes/wishlist';
import { inventoryRoutes } from './routes/inventory';
import { uploadRoutes } from './routes/upload';
import { geocodingRoutes } from './routes/geocoding';
import { cleanupOldOrders } from './utils/orderCleanup';
import { requireRole } from './middleware/auth';
import { errorHandler } from './utils/error-handler';
import { logger } from './utils/logger';
import { initMeilisearchIndex } from './utils/meilisearch';

const server = Fastify({
  logger: logger,
  requestIdLogLabel: 'reqId',
  genReqId: () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older Node versions
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
});

async function build() {
  // Security
  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // CORS - Support multiple origins for dev and production
  const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
    // Add Vercel preview URLs pattern
  ].filter(Boolean) as string[];
  
  await server.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) {
        cb(null, true);
        return;
      }
      
      // Check if origin is in allowed list or matches Vercel preview pattern
      const isAllowed = allowedOrigins.some(allowed => origin === allowed) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('fusionaura');
      
      if (isAllowed) {
        cb(null, true);
      } else {
        server.log.warn(`CORS blocked origin: ${origin}`);
        cb(null, true); // Allow anyway for now, but log it
      }
    },
    credentials: true,
  });

  // Rate limiting - higher limits for production use
  await server.register(rateLimit, {
    max: 500,
    timeWindow: '1 minute',
    // Skip rate limiting for authenticated requests
    keyGenerator: (request) => {
      // Use IP + user ID if authenticated for more granular limits
      const userId = (request.user as any)?.id;
      return userId ? `user-${userId}` : request.ip;
    },
  });

  // Multipart support for file uploads
  await server.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // Redis (optional - skip for now to avoid blocking)
  // TODO: Re-enable Redis when container is running
  // try {
  //   await server.register(redis, {
  //     url: config.redis.url,
  //   });
  // } catch (err) {
  //   server.log.warn('Redis connection failed, continuing without Redis cache');
  // }
  server.log.info('ℹ️  Redis disabled - running without cache');

  // JWT
  const jwtSecret = config.jwt.secret || 'dev-secret-change-in-production-min-32-chars-' + Date.now();
  if (!config.jwt.secret) {
    server.log.warn('⚠️  JWT_SECRET not set - using temporary dev secret. Set JWT_SECRET in .env for production!');
  }
  await server.register(jwt, {
    secret: jwtSecret,
    sign: {
      expiresIn: config.jwt.expiresIn,
    },
  });

  // Initialize Meilisearch (non-blocking)
  initMeilisearchIndex().catch((err) => {
    server.log.warn('Meilisearch initialization failed, continuing without search:', err);
  });

  // Health check
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Order cleanup endpoint (admin only, can be triggered manually)
  server.post('/api/admin/cleanup-orders', { preHandler: requireRole('ADMIN') }, async () => {
    const result = await cleanupOldOrders();
    return { success: true, ...result };
  });

  // Schedule daily cleanup at 2 AM (runs every hour, checks if it's 2 AM)
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 2 && now.getMinutes() === 0) {
      server.log.info('🧹 Running scheduled order cleanup...');
      await cleanupOldOrders();
    }
  }, 60000); // Check every minute

  // Routes
  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(productRoutes, { prefix: '/api/products' });
  await server.register(categoryRoutes, { prefix: '/api/categories' });
  await server.register(cartRoutes, { prefix: '/api/cart' });
  await server.register(orderRoutes, { prefix: '/api/orders' });
  await server.register(paymentRoutes, { prefix: '/api/payments' }); // PayFast integration
  await server.register(wishlistRoutes, { prefix: '/api/wishlist' });
  await server.register(inventoryRoutes, { prefix: '/api/inventory' });
  await server.register(uploadRoutes, { prefix: '/api/upload' });
  await server.register(geocodingRoutes, { prefix: '/api/geocoding' });

  // Error handler
  server.setErrorHandler(errorHandler);

  return server;
}

// Run database migrations with retry logic
async function runMigrations(maxRetries = 5, delayMs = 3000): Promise<void> {
  const { prisma } = await import('@fusionaura/db');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Running database schema check (attempt ${attempt}/${maxRetries})...`);
      
      // Check if deletedAt column exists on orders table
      const result = await prisma.$queryRaw<any[]>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'deletedAt'
      `;
      
      if (result.length === 0) {
        console.log('📝 Adding deletedAt column to orders table...');
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3)
        `);
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "orders_deletedAt_idx" ON "orders"("deletedAt")
        `);
        console.log('✅ Added deletedAt column');
      } else {
        console.log('✅ Database schema is up to date');
      }
      
      // Add new OrderStatus enum values if needed
      const enumValues = ['ACCEPTED', 'DECLINED', 'PENDING_DELIVERY', 'OUT_FOR_DELIVERY', 'COMPLETED'];
      for (const value of enumValues) {
        try {
          await prisma.$executeRawUnsafe(`ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS '${value}'`);
        } catch (e) {
          // Ignore if value already exists
        }
      }
      
      console.log('✅ Database schema check complete');
      return;
    } catch (error: any) {
      console.error(`❌ Database check attempt ${attempt} failed:`, error.message);
      if (attempt < maxRetries) {
        console.log(`   Retrying in ${delayMs / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  console.warn('⚠️ Database schema check failed after all retries, continuing anyway...');
}

async function start() {
  try {
    const app = await build();
    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 FusionAura API server running on port ${config.port}`);
    
    // Run migrations in background after server starts
    runMigrations().catch(err => {
      console.error('Migration error (non-fatal):', err.message);
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Start server
if (require.main === module) {
  start();
}

export { build, start };

// Deployment trigger - Tue Jan 27 20:17:53 SAST 2026
