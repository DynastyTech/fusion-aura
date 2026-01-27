import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addAwaitingPaymentStatus() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not found!');
    console.log('\nUsage:');
    console.log('DATABASE_URL=postgresql://... npx tsx prisma/add-awaiting-payment-status.ts');
    process.exit(1);
  }

  console.log('🔗 Connecting to database...');
  console.log(`📍 Database: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);

  try {
    // Add the new enum value
    console.log('📝 Adding AWAITING_PAYMENT to OrderStatus enum...');
    
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'AWAITING_PAYMENT' BEFORE 'PENDING';
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📋 OrderStatus enum now includes:');
    console.log('   - AWAITING_PAYMENT (new)');
    console.log('   - PENDING');
    console.log('   - ACCEPTED');
    console.log('   - DECLINED');
    console.log('   - PENDING_DELIVERY');
    console.log('   - OUT_FOR_DELIVERY');
    console.log('   - COMPLETED');
    console.log('   - CANCELLED');
    
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('✅ AWAITING_PAYMENT status already exists - no changes needed');
    } else {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  }
}

addAwaitingPaymentStatus()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
