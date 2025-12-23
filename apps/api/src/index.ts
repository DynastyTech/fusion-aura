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
// import { paymentRoutes } from './routes/payments'; // Disabled - using COD
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

  // CORS
  await server.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
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
  // await server.register(paymentRoutes, { prefix: '/api/payments' }); // Disabled - using COD
  await server.register(inventoryRoutes, { prefix: '/api/inventory' });
  await server.register(uploadRoutes, { prefix: '/api/upload' });
  await server.register(geocodingRoutes, { prefix: '/api/geocoding' });

  // Error handler
  server.setErrorHandler(errorHandler);

  return server;
}

async function start() {
  try {
    const app = await build();
    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`🚀 FusionAura API server running on port ${config.port}`);
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

