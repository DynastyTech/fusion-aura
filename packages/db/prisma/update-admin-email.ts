import { PrismaClient } from '@prisma/client';

// This script changes the admin email from admin@fusionaura.com to fusionauraza@gmail.com
// The password remains the same: $fusionAURA26#
// 
// Usage:
// DATABASE_URL=your_railway_url npx ts-node prisma/update-admin-email.ts

const prisma = new PrismaClient();

async function updateAdminEmail() {
  const oldEmail = 'admin@fusionaura.com';
  const newEmail = 'fusionauraza@gmail.com';

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not found!');
    console.log('\nUsage:');
    console.log('DATABASE_URL=postgresql://... npx ts-node prisma/update-admin-email.ts');
    process.exit(1);
  }

  console.log('🔗 Connecting to database...');
  console.log(`📍 Database: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`); // Hide password

  // Check if new email already exists
  const existingNewEmail = await prisma.user.findUnique({
    where: { email: newEmail },
  });

  if (existingNewEmail) {
    console.log(`⚠️  User with email ${newEmail} already exists.`);
    console.log('   If this is the correct admin, no changes needed.');
    console.log(`   User ID: ${existingNewEmail.id}`);
    console.log(`   Role: ${existingNewEmail.role}`);
    
    // If it exists but is not admin, make it admin
    if (existingNewEmail.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: existingNewEmail.id },
        data: { role: 'ADMIN' },
      });
      console.log('✅ Updated user role to ADMIN');
    }
    
    // Delete old admin if exists
    const oldAdmin = await prisma.user.findUnique({
      where: { email: oldEmail },
    });
    
    if (oldAdmin) {
      await prisma.user.delete({
        where: { email: oldEmail },
      });
      console.log(`✅ Deleted old admin account: ${oldEmail}`);
    }
    
    process.exit(0);
  }

  // Find the old admin user
  const admin = await prisma.user.findUnique({
    where: { email: oldEmail },
  });

  if (!admin) {
    console.error(`❌ Admin user with email ${oldEmail} not found!`);
    console.log('\nListing all admin users:');
    
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    
    if (admins.length === 0) {
      console.log('No admin users found in database.');
    } else {
      admins.forEach((a) => {
        console.log(`  - ${a.email} (${a.firstName} ${a.lastName})`);
      });
    }
    
    process.exit(1);
  }

  // Update the admin email
  await prisma.user.update({
    where: { id: admin.id },
    data: { email: newEmail },
  });

  console.log('✅ Admin email updated successfully!');
  console.log(`\n📧 Old Email: ${oldEmail}`);
  console.log(`📧 New Email: ${newEmail}`);
  console.log(`🔑 Password: $fusionAURA26# (unchanged)`);
  console.log(`\n✅ You can now login with ${newEmail}`);
}

updateAdminEmail()
  .catch((e) => {
    console.error('❌ Error updating admin email:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
