# View Products on Website

## ✅ Products Page Implemented!

I've created a beautiful products listing page that will display all your products. Here's what you need to do:

## Step 1: Start the API Server

The frontend needs the API to fetch products. Make sure the API is running:

```bash
# From project root
npm run dev
```

This starts both:
- Frontend on http://localhost:3000
- API on http://localhost:3001

## Step 2: Verify Products Exist

Check that products are in the database:

```bash
# Using API
curl http://localhost:3001/api/products

# Or using Prisma Studio
npm run db:studio
```

If you haven't run the seed script yet:

```bash
cd packages/db
npm run seed
```

## Step 3: View Products

Open your browser and go to:
**http://localhost:3000/products**

You should see:
- ✅ All 6 sample products displayed in a grid
- ✅ Product images (from Unsplash)
- ✅ Product names, prices, and descriptions
- ✅ Stock status
- ✅ Featured badges
- ✅ Clickable product cards that go to detail pages

## Features Implemented

### Products Listing Page (`/products`)
- Grid layout with responsive design
- Product cards with images
- Price display (ZAR currency)
- Stock status indicators
- Featured product badges
- Category labels
- Hover effects and transitions

### Product Detail Page (`/products/[slug]`)
- Full product information
- Large product image
- Detailed description
- Price with discount display
- Stock availability
- Add to cart button (UI ready, functionality pending)

## Troubleshooting

### "No products found" message

**Check 1: Is the API running?**
```bash
curl http://localhost:3001/api/products
```

If this fails, start the API:
```bash
npm run dev
```

**Check 2: Are products in the database?**
```bash
cd packages/db
npm run seed
```

**Check 3: Check API URL**
Make sure `.env` has:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Images not loading

The seed script uses Unsplash images. If images don't load:
1. Check your internet connection
2. Images are loaded from `images.unsplash.com`
3. Next.js config has been updated to allow Unsplash images

### API connection errors

If you see connection errors in the browser console:
1. Verify API is running: `lsof -ti:3001`
2. Check API health: `curl http://localhost:3001/health`
3. Restart dev server: Stop (Ctrl+C) and run `npm run dev` again

## Next Steps

Once products are displaying:
1. ✅ Products listing - **Done!**
2. ⏳ Product detail pages - **Done!**
3. ⏳ Add to cart functionality - **Next**
4. ⏳ Shopping cart page - **Next**
5. ⏳ Checkout flow - **Next**

## Quick Test

```bash
# Terminal 1: Start all services
npm run dev

# Terminal 2: Verify API
curl http://localhost:3001/api/products | jq '.data | length'
# Should return: 6

# Then open browser:
# http://localhost:3000/products
```

Enjoy your products! 🎉

