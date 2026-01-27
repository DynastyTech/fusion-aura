import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { existsSync } from 'fs';

// Determine the root directory (where .env should be)
// When running from packages/db, we need to go up 2 levels
// When running from root, we need to check current directory
let rootDir = process.cwd();
if (rootDir.endsWith('packages/db')) {
  rootDir = path.resolve(rootDir, '../..');
}

const envPath = path.join(rootDir, '.env');

// Load .env file
if (existsSync(envPath)) {
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.error(`❌ Error loading .env file: ${result.error.message}`);
    process.exit(1);
  }
} else {
  // Try default dotenv behavior
  dotenv.config();
}

// Verify DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not found!');
  console.log(`\nLooking for .env at: ${envPath}`);
  console.log(`Current working directory: ${process.cwd()}`);
  console.log('\nPlease ensure:');
  console.log('1. A .env file exists in the project root');
  console.log('2. The .env file contains DATABASE_URL');
  console.log('\nExample:');
  console.log('DATABASE_URL=postgresql://user:password@localhost:5432/dbname');
  process.exit(1);
}

const prisma = new PrismaClient();

async function updateAdminPassword() {
  const adminEmail = 'fusionauraza@gmail.com';
  const newPassword = '$fusionAURA26#';

  // Find the admin user
  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  if (!admin) {
    console.log('⚠️  Admin user not found. Creating new admin user...');
    
    // Create the admin user
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        addressLine1: 'Admin Address',
        city: 'Johannesburg',
        postalCode: '2000',
      },
    });
    
    console.log('✅ Admin user created successfully!');
  } else {
    // Update the admin password
    await prisma.user.update({
      where: { id: admin.id },
      data: { password: hashedPassword },
    });
    
    console.log('✅ Admin password updated successfully!');
  }

  console.log(`\n📧 Email: ${adminEmail}`);
  console.log(`🔑 Password: ${newPassword}`);
  console.log(`\n⚠️  Please keep this password secure!`);
}

updateAdminPassword()
  .catch((e) => {
    console.error('❌ Error updating admin password:', e.message);
    
    // Provide helpful error messages for common issues
    if (e.message.includes("Can't reach database server")) {
      console.log('\n💡 Database connection issue:');
      console.log('   The database server is not running or not accessible.');
      console.log('\n   To fix this:');
      console.log('   1. If using local database:');
      console.log('      - Start Docker: cd infra && docker-compose up -d postgres');
      console.log('      - Or start your PostgreSQL service');
      console.log('   2. If using production database (Railway):');
      console.log('      - Update DATABASE_URL in .env to your Railway database URL');
      console.log('      - Get it from Railway dashboard → Postgres → Connect → Connection String');
    } else if (e.message.includes("P1001")) {
      console.log('\n💡 Database connection timeout');
      console.log('   Check your DATABASE_URL in .env file');
    }
    
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
