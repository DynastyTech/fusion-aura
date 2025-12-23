# 🚨 Railway Quick Fix Guide

## Problem
Railway is trying to deploy BOTH services from your monorepo:
- `@fusionaura/api` ✅ (should be on Railway)
- `@fusionaura/web` ❌ (should be on Vercel, NOT Railway)

## ✅ Immediate Actions

### Step 1: Delete Web Service from Railway

1. Go to Railway Dashboard
2. You'll see TWO services:
   - `@fusionaura/api` 
   - `@fusionaura/web`
3. **Click on `@fusionaura/web` service**
4. Go to **Settings** → Scroll down → Click **Delete Service**
5. Confirm deletion

**Why?** The frontend (Next.js) should be deployed to Vercel, not Railway.

### Step 2: Configure API Service

1. Click on `@fusionaura/api` service
2. Go to **Settings** → **Service Settings**
3. Configure:
   - **Root Directory**: `apps/api`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Port**: Leave empty (Railway will use PORT env var)

### Step 3: Add PostgreSQL Database

1. In Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will automatically:
   - Create the database
   - Provide `DATABASE_URL` environment variable
   - Link it to your API service

### Step 4: Set Environment Variables

Go to `@fusionaura/api` → **Variables** tab, add:

```
# Database (auto-provided by Railway PostgreSQL)
DATABASE_URL=<auto-filled-by-railway>

# Server
PORT=3001
NODE_ENV=production

# Security
JWT_SECRET=<generate-a-random-32-char-secret>

# CORS (update after Vercel deployment)
CORS_ORIGIN=https://your-vercel-app.vercel.app

# Email (Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email@gmail.com>
SMTP_PASS=<your-gmail-app-password>
ADMIN_EMAIL=lraseemela@gmail.com

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>

# Optional
GOOGLE_MAPS_API_KEY=<optional>
MEILISEARCH_HOST=<optional-if-not-using-search>
```

### Step 5: Run Database Migrations

After the API deploys, you need to run Prisma migrations:

1. In Railway → `@fusionaura/api` → **Deployments** → Click latest deployment
2. Go to **Logs** tab
3. Or use Railway CLI:
```bash
railway run --service @fusionaura/api npm run db:migrate
```

Or add a one-time migration script in Railway.

### Step 6: Redeploy

1. Push your latest code (with TypeScript fixes):
```bash
git add .
git commit -m "Fix Railway deployment configuration"
git push origin main
```

2. Railway will auto-detect and redeploy

## ✅ Expected Result

After these steps:
- ✅ Only `@fusionaura/api` service exists in Railway
- ✅ API builds successfully
- ✅ API starts and runs on Railway's provided PORT
- ✅ Database migrations run
- ✅ API is accessible at `https://your-api.railway.app`

## 📝 Next: Deploy Frontend to Vercel

After Railway API is working:
1. Deploy frontend to Vercel (separate deployment)
2. Update `NEXT_PUBLIC_API_URL` in Vercel to point to Railway API
3. Update `CORS_ORIGIN` in Railway to allow Vercel domain

See `VERCEL_DEPLOYMENT_FIX.md` for frontend deployment.
