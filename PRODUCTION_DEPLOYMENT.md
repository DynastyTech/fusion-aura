# Production Deployment Guide

## 📦 How Products Are Stored

### 1. **Product Data (Database)**
✅ **YES - Products are saved in PostgreSQL database**

All product information is stored in your database:
- Product name, description, price
- Category, slug, metadata
- Inventory quantities
- Active/featured status
- **Image URLs** (not the images themselves)

**Current Setup:**
- Database: PostgreSQL (running locally via Docker)
- Location: `localhost:5432`
- Database name: `fusionaura_db`

**What's Stored:**
```sql
-- Example product record
{
  id: "uuid",
  name: "Organic Raw Honey",
  price: 299.99,
  images: [
    "https://res.cloudinary.com/.../image1.jpg",
    "https://res.cloudinary.com/.../image2.jpg"
  ],
  categoryId: "...",
  isActive: true,
  isFeatured: true
}
```

### 2. **Product Images (Cloud Storage)**
✅ **YES - Images are hosted on Cloudinary (cloud)**

Images are **NOT** stored in the database. Instead:
- Images are uploaded to **Cloudinary** (cloud-hosted service)
- Database stores only the **URLs** to the images
- Images are delivered via Cloudinary's CDN

**Current Setup:**
- Service: Cloudinary (free tier: 25GB storage, 25GB bandwidth/month)
- Images stored in: `fusionaura/products/` folder
- URLs look like: `https://res.cloudinary.com/dvvfzg7ty/image/upload/...`

**Benefits:**
- ✅ Images persist even if you change servers
- ✅ Fast CDN delivery worldwide
- ✅ Automatic image optimization
- ✅ No server storage needed

## 🚀 Production Deployment Checklist

### Step 1: Set Up Production Database

You need a **cloud-hosted PostgreSQL database**. Options:

**Option A: Railway (Recommended - Easy)**
1. Go to [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy the connection string
4. Update `DATABASE_URL` in production environment

**Option B: Supabase (Free tier available)**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database
4. Update `DATABASE_URL`

**Option C: AWS RDS / Google Cloud SQL**
- More complex but enterprise-grade
- Good for high-traffic sites

### Step 2: Migrate Database Schema

Once you have production database:

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Run migrations
cd packages/db
npx prisma migrate deploy

# Or push schema directly
npx prisma db push
```

### Step 3: Migrate Existing Data

**Option A: Export/Import (Recommended)**
```bash
# Export from local database
pg_dump -h localhost -U fusionaura -d fusionaura_db > backup.sql

# Import to production database
psql -h production-host -U user -d dbname < backup.sql
```

**Option B: Use Prisma Seed**
- Update seed file with your products
- Run `npx prisma db seed` on production

### Step 4: Environment Variables for Production

Update your production environment variables:

```env
# Database (Production)
DATABASE_URL=postgresql://user:pass@production-host:5432/dbname

# Cloudinary (Already cloud-hosted - no change needed!)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# API
API_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# JWT (Generate strong secret!)
JWT_SECRET=your-super-secret-production-key-min-32-chars

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=lraseemela@gmail.com
```

### Step 5: Deploy Application

**Frontend (Next.js):**
- Deploy to Vercel, Netlify, or your own server
- Set environment variables in hosting platform

**Backend (Fastify API):**
- Deploy to Railway, Render, or your own server
- Ensure it can connect to production database

## ✅ What Will Work After Deployment

### ✅ Products Will Be Available
- All products in your database will be available
- Product data (name, price, description) will work
- Categories will work
- Inventory tracking will work

### ✅ Images Will Work
- **Cloudinary images persist** - they're already cloud-hosted!
- Images will load from Cloudinary CDN
- No need to re-upload images
- URLs in database point to Cloudinary

### ⚠️ What You Need to Do

1. **Set up production database** (PostgreSQL)
2. **Migrate database schema** (run Prisma migrations)
3. **Copy product data** (export/import or seed)
4. **Update environment variables** (DATABASE_URL, etc.)
5. **Deploy both frontend and backend**

## 🔄 Data Persistence

### What Persists:
- ✅ **Cloudinary images** - Already in cloud, will work immediately
- ✅ **Product data** - After you migrate database
- ✅ **User accounts** - After you migrate database
- ✅ **Orders** - After you migrate database

### What Needs Migration:
- ⚠️ **Database schema** - Run migrations on production
- ⚠️ **Product records** - Export/import or seed
- ⚠️ **User accounts** - Export/import
- ⚠️ **Order history** - Export/import (if needed)

## 📊 Current Data Location

**Development (Current):**
- Database: `localhost:5432` (Docker container)
- Images: Cloudinary cloud (already production-ready!)
- API: `localhost:3001`
- Frontend: `localhost:3000`

**Production (After Deployment):**
- Database: Cloud-hosted PostgreSQL (Railway, Supabase, etc.)
- Images: Cloudinary cloud (same as dev - no change!)
- API: Your production domain
- Frontend: Your production domain

## 🎯 Summary

**Question: Are products saved in database?**
✅ **YES** - All product data is in PostgreSQL database

**Question: Are products hosted online/cloud?**
✅ **YES** - Images are on Cloudinary (cloud), data will be on cloud database after deployment

**Question: Will products be available after deployment?**
✅ **YES** - After you:
1. Set up production database
2. Migrate schema and data
3. Deploy application
4. Update environment variables

**Images are already cloud-hosted, so they'll work immediately!**

