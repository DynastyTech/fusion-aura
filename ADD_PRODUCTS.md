# How to Add Products to FusionAura

There are several ways to add products to your database. Choose the method that works best for you.

## Method 1: Using Seed Script (Recommended for Initial Setup) 🌱

The easiest way to add sample products is using the seed script.

### Step 1: Run the seed script

```bash
cd packages/db
npx tsx prisma/seed.ts
```

This will create:
- 3 categories (Wellness, Remedies, Skincare)
- 6 sample products with inventory

### Step 2: Verify products were created

```bash
# Using Prisma Studio (visual)
npm run db:studio

# Or using API
curl http://localhost:3001/api/products
```

## Method 2: Using Prisma Studio (Visual/Manual) 🎨

Best for adding products manually through a visual interface.

### Step 1: Open Prisma Studio

```bash
npm run db:studio
```

This opens a web interface at http://localhost:5555

### Step 2: Create a Category First

1. Click on **Category** in the left sidebar
2. Click **Add record**
3. Fill in:
   - **name**: e.g., "Wellness"
   - **slug**: e.g., "wellness" (must be unique, lowercase, no spaces)
   - **description**: (optional)
4. Click **Save 1 change**

### Step 3: Create a Product

1. Click on **Product** in the left sidebar
2. Click **Add record**
3. Fill in the required fields:
   - **name**: Product name
   - **slug**: URL-friendly version (e.g., "organic-honey")
   - **price**: Price in ZAR (e.g., 299.99)
   - **categoryId**: Select the category you created
   - **images**: Add image URLs as an array (e.g., `["https://example.com/image.jpg"]`)
   - **isActive**: true
   - **isFeatured**: false (or true for featured products)
4. Click **Save 1 change**

### Step 4: Create Inventory Record

1. Click on **Inventory** in the left sidebar
2. Click **Add record**
3. Fill in:
   - **productId**: Select the product you just created
   - **quantity**: Stock quantity (e.g., 50)
   - **lowStockThreshold**: 10 (optional)
4. Click **Save 1 change**

## Method 3: Using the API (Programmatic) 🔌

Best for adding products programmatically or via scripts.

### Step 1: Create an Admin User

First, you need to create a user and make them an admin:

```bash
# Register a user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fusionaura.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

Then manually update the user role in the database:

```bash
docker exec -it fusionaura-postgres psql -U fusionaura -d fusionaura_db -c "UPDATE users SET role = 'ADMIN' WHERE email = 'admin@fusionaura.com';"
```

### Step 2: Login to Get Token

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fusionaura.com",
    "password": "admin123"
  }'
```

Copy the `token` from the response.

### Step 3: Create a Category

```bash
curl -X POST http://localhost:3001/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Wellness",
    "slug": "wellness",
    "description": "Wellness products"
  }'
```

Copy the `id` from the response (you'll need it for the product).

### Step 4: Create a Product

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Organic Raw Honey",
    "slug": "organic-raw-honey",
    "description": "Pure, unfiltered raw honey from local beekeepers",
    "shortDescription": "Pure raw honey",
    "price": 299.99,
    "compareAtPrice": 349.99,
    "images": ["https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800"],
    "categoryId": "CATEGORY_ID_FROM_STEP_3",
    "isActive": true,
    "isFeatured": true,
    "initialQuantity": 50
  }'
```

The API will automatically create the inventory record with the `initialQuantity`.

## Method 4: Direct SQL (Advanced) 💻

For bulk imports or advanced users.

```bash
docker exec -it fusionaura-postgres psql -U fusionaura -d fusionaura_db
```

Then run SQL:

```sql
-- First, get a category ID
SELECT id, name FROM categories;

-- Insert product (replace CATEGORY_ID with actual ID)
INSERT INTO products (
  id, name, slug, description, price, "categoryId", 
  "isActive", "isFeatured", images, "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Organic Raw Honey',
  'organic-raw-honey',
  'Pure, unfiltered raw honey',
  299.99,
  'CATEGORY_ID_HERE',
  true,
  true,
  ARRAY['https://example.com/image.jpg'],
  NOW(),
  NOW()
);

-- Create inventory
INSERT INTO inventory ("productId", quantity, "lowStockThreshold", "updatedAt")
SELECT id, 50, 10, NOW()
FROM products
WHERE slug = 'organic-raw-honey';
```

## Product Fields Reference

### Required Fields
- **name**: Product name
- **slug**: URL-friendly identifier (unique, lowercase, no spaces)
- **price**: Price in ZAR (Decimal, e.g., 299.99)
- **categoryId**: UUID of the category

### Optional Fields
- **description**: Full product description (Text)
- **shortDescription**: Brief description
- **compareAtPrice**: Original price (for showing discounts)
- **images**: Array of image URLs
- **metaTitle**: SEO title
- **metaDescription**: SEO description
- **isActive**: Whether product is active (default: true)
- **isFeatured**: Whether to feature on homepage (default: false)
- **initialQuantity**: Stock quantity (creates inventory record)

## Quick Start: Use Seed Script

The fastest way to get started:

```bash
# 1. Run seed script
cd packages/db
npx tsx prisma/seed.ts

# 2. Verify
curl http://localhost:3001/api/products | jq

# 3. View in browser
# Open http://localhost:3000 and navigate to products
```

## Tips

1. **Slugs must be unique**: Use lowercase, hyphens instead of spaces
   - ✅ Good: `organic-raw-honey`
   - ❌ Bad: `Organic Raw Honey` or `organic_raw_honey`

2. **Images**: Use full URLs (can be from Unsplash, your CDN, etc.)
   - Example: `https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800`

3. **Prices**: Always in ZAR (South African Rand)
   - Example: `299.99` = R299.99

4. **Categories First**: Always create categories before products

5. **Inventory**: The API automatically creates inventory when you provide `initialQuantity`

## Viewing Products

### Via API
```bash
# Get all products
curl http://localhost:3001/api/products

# Get single product
curl http://localhost:3001/api/products/organic-raw-honey

# Search products
curl "http://localhost:3001/api/products?search=honey"
```

### Via Prisma Studio
```bash
npm run db:studio
```

### Via Frontend
Open http://localhost:3000/products (once the frontend is implemented)

## Need Help?

- Check the API documentation in `README.md`
- Use Prisma Studio for visual editing
- Check database directly: `docker exec -it fusionaura-postgres psql -U fusionaura -d fusionaura_db`

