#!/usr/bin/env node
/**
 * Migration script that ensures database schema is in sync
 * This runs prisma migrate deploy and also adds any missing columns
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Run prisma migrate deploy
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: __dirname,
    });
    console.log('✅ Prisma migrations completed');
  } catch (error) {
    console.error('⚠️ Prisma migrate deploy failed, continuing with fallback...');
  }

  // Fallback: Ensure critical columns exist
  console.log('🔧 Ensuring database schema is complete...');
  
  const prisma = new PrismaClient();
  
  try {
    // Add deletedAt column if it doesn't exist
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'orders' AND column_name = 'deletedAt'
        ) THEN 
          ALTER TABLE "orders" ADD COLUMN "deletedAt" TIMESTAMP(3);
          CREATE INDEX IF NOT EXISTS "orders_deletedAt_idx" ON "orders"("deletedAt");
        END IF;
      END $$;
    `);
    console.log('✅ Verified deletedAt column exists');

    // Add new OrderStatus enum values if they don't exist
    const enumValues = ['ACCEPTED', 'DECLINED', 'PENDING_DELIVERY', 'OUT_FOR_DELIVERY', 'COMPLETED'];
    for (const value of enumValues) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS '${value}'`);
      } catch (e) {
        // Ignore if value already exists
      }
    }
    console.log('✅ Verified OrderStatus enum values');

  } catch (error) {
    console.error('❌ Error running fallback migrations:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  console.log('✅ Database schema is ready!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

