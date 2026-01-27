import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminEmail = process.env.ADMIN_EMAIL || 'fusionauraza@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || '$fusionAURA26#';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
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
    console.log(`✅ Admin user created: ${adminEmail}`);
  } else {
    // Ensure user is admin
    if (existingAdmin.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: 'ADMIN' },
      });
      console.log('✅ Updated existing user to ADMIN role');
    } else {
      console.log('⏭️  Admin user already exists');
    }
  }

  // Create categories first
  console.log('📁 Creating categories...');
  
  const pureOrganicsCategory = await prisma.category.upsert({
    where: { slug: 'pure-organics' },
    update: {},
    create: {
      name: 'Pure Organics',
      slug: 'pure-organics',
      description: '100% pure organic products',
    },
  });

  const organicCosmeticsCategory = await prisma.category.upsert({
    where: { slug: 'organic-cosmetics' },
    update: {},
    create: {
      name: 'Organic Cosmetics',
      slug: 'organic-cosmetics',
      description: 'Natural and organic cosmetic products',
    },
  });

  const mensHealthCategory = await prisma.category.upsert({
    where: { slug: 'mens-health' },
    update: {},
    create: {
      name: "Men's Health",
      slug: 'mens-health',
      description: 'Health and wellness products for men',
    },
  });

  const womensHealthCategory = await prisma.category.upsert({
    where: { slug: 'womens-health' },
    update: {},
    create: {
      name: "Women's Health",
      slug: 'womens-health',
      description: 'Health and wellness products for women',
    },
  });

  console.log('✅ Categories created');

  // Create products
  console.log('📦 Creating products...');

  const products = [
    {
      name: 'Organic Raw Honey',
      slug: 'organic-raw-honey',
      description: 'Pure, unfiltered raw honey sourced from local South African beekeepers. Rich in antioxidants and natural enzymes.',
      shortDescription: 'Pure, unfiltered raw honey from local beekeepers',
      price: 299.99,
      compareAtPrice: 349.99,
      images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800'],
      categoryId: pureOrganicsCategory.id,
      metaTitle: 'Organic Raw Honey - FusionAura',
      metaDescription: 'Buy premium organic raw honey. Natural, unfiltered, and packed with health benefits.',
      isActive: true,
      isFeatured: true,
      initialQuantity: 50,
    },
    {
      name: 'Eucalyptus Essential Oil',
      slug: 'eucalyptus-essential-oil',
      description: '100% pure eucalyptus essential oil. Perfect for respiratory support and natural cleaning.',
      shortDescription: 'Pure eucalyptus oil for respiratory support',
      price: 189.99,
      images: ['https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800'],
      categoryId: organicCosmeticsCategory.id,
      isActive: true,
      isFeatured: true,
      initialQuantity: 30,
    },
    {
      name: 'Aloe Vera Gel',
      slug: 'aloe-vera-gel',
      description: 'Pure aloe vera gel extracted from fresh leaves. Soothes and hydrates skin naturally.',
      shortDescription: 'Pure aloe vera gel for skin care',
      price: 149.99,
      compareAtPrice: 179.99,
      images: ['https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800'],
      categoryId: organicCosmeticsCategory.id,
      isActive: true,
      isFeatured: false,
      initialQuantity: 75,
    },
    {
      name: 'Rooibos Tea Blend',
      slug: 'rooibos-tea-blend',
      description: 'Premium South African rooibos tea blend. Caffeine-free and rich in antioxidants.',
      shortDescription: 'Premium South African rooibos tea',
      price: 129.99,
      images: ['https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800'],
      categoryId: pureOrganicsCategory.id,
      isActive: true,
      isFeatured: true,
      initialQuantity: 100,
    },
    {
      name: 'Lavender Essential Oil',
      slug: 'lavender-essential-oil',
      description: 'Pure lavender essential oil. Promotes relaxation and restful sleep.',
      shortDescription: 'Pure lavender oil for relaxation',
      price: 219.99,
      images: ['https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800'],
      categoryId: organicCosmeticsCategory.id,
      isActive: true,
      isFeatured: false,
      initialQuantity: 40,
    },
    {
      name: 'Shea Butter',
      slug: 'shea-butter',
      description: 'Unrefined shea butter. Deeply moisturizes and nourishes skin and hair.',
      shortDescription: 'Unrefined shea butter for skin and hair',
      price: 179.99,
      images: ['https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800'],
      categoryId: organicCosmeticsCategory.id,
      isActive: true,
      isFeatured: false,
      initialQuantity: 60,
    },
  ];

  for (const productData of products) {
    const existing = await prisma.product.findUnique({
      where: { slug: productData.slug },
    });

    if (!existing) {
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          shortDescription: productData.shortDescription,
          price: productData.price,
          compareAtPrice: productData.compareAtPrice,
          images: productData.images,
          categoryId: productData.categoryId,
          metaTitle: productData.metaTitle,
          metaDescription: productData.metaDescription,
          isActive: productData.isActive,
          isFeatured: productData.isFeatured,
        },
      });

      await prisma.inventory.create({
        data: {
          productId: product.id,
          quantity: productData.initialQuantity,
        },
      });

      console.log(`  ✅ Created: ${productData.name}`);
    } else {
      console.log(`  ⏭️  Skipped: ${productData.name} (already exists)`);
    }
  }

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

