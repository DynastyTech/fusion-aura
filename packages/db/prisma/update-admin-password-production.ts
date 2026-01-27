import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// This script uses DATABASE_URL from environment
// Set it before running: DATABASE_URL=your_railway_url npm run update-admin-password-production

const prisma = new PrismaClient();

async function updateAdminPassword() {
  const adminEmail = 'fusionauraza@gmail.com';
  const newPassword = '$fusionAURA26#';

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not found!');
    console.log('\nUsage:');
    console.log('DATABASE_URL=postgresql://... npm run update-admin-password-production');
    process.exit(1);
  }

  console.log('🔗 Connecting to database...');
  console.log(`📍 Database: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`); // Hide password

  // Find the admin user
  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    console.error('❌ Admin user not found!');
    console.log(`\nLooking for email: ${adminEmail}`);
    console.log('Please ensure the admin user exists in the database.');
    process.exit(1);
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update the admin password
  await prisma.user.update({
    where: { id: admin.id },
    data: { password: hashedPassword },
  });

  console.log('✅ Admin password updated successfully!');
  console.log(`\n📧 Email: ${adminEmail}`);
  console.log(`🔑 New Password: ${newPassword}`);
  console.log(`\n⚠️  Please keep this password secure!`);
}

updateAdminPassword()
  .catch((e) => {
    console.error('❌ Error updating admin password:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
