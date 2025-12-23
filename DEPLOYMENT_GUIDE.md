# 🚀 Deployment Guide - Accessing Your Live Site

This guide will help you:
1. **Find your deployed website URL** (Vercel)
2. **Set up your database** (Railway Postgres)
3. **Fix your API server** (Railway)

---

## 1. 📍 Finding Your Website URL

### Vercel Deployment URL

After successful deployment, Vercel automatically provides you with URLs:

1. **Go to your Vercel Dashboard**: https://vercel.com/dashboard
2. **Click on your project** (likely named "fusion" or "fusionaura")
3. **You'll see your deployment URLs**:
   - **Production URL**: `https://your-project-name.vercel.app`
   - **Preview URLs**: For each branch/PR

**Example**: If your project is named "fusion", your URL might be:
```
https://fusion.vercel.app
```

### Setting Up Custom Domain (Later)

Once you buy a domain on GoDaddy:
1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records in GoDaddy as instructed by Vercel

---

## 2. 🗄️ Setting Up Your Database (Railway Postgres)

Your database is empty because migrations haven't been run yet. Here's how to fix it:

### Option A: Run Migrations via Railway CLI (Recommended)

**⚠️ Important**: Railway's internal hostnames (`postgres.railway.internal`) only work within Railway's network. You need to use the public DATABASE_URL.

1. **Get your DATABASE_URL from Railway**:
   - Go to Railway dashboard → Your Postgres service
   - Click "Variables" tab
   - Copy the `DATABASE_URL` value (should look like `postgresql://postgres:password@hostname:port/railway`)

2. **Run migrations using the script**:
   ```bash
   ./scripts/migrate-railway.sh
   ```
   (The script will prompt you to paste the DATABASE_URL)

3. **Or run manually**:
   ```bash
   # Set the DATABASE_URL
   export DATABASE_URL="your-railway-database-url-from-step-1"
   
   # Run migrations
   cd packages/db
   npm run migrate:deploy
   
   # (Optional) Seed database
   npm run seed
   ```

**Alternative: Run migrations from Railway API service** (if API service has network access):
   ```bash
   railway link  # Select your API service
   railway run --service @fusionaura/api -- cd packages/db && npm run migrate:deploy
   ```

### Option B: Run Migrations via Railway Dashboard

1. **Get your DATABASE_URL**:
   - Go to Railway dashboard
   - Click on your Postgres service
   - Go to "Variables" tab
   - Copy the `DATABASE_URL` value

2. **Run migrations locally** (temporarily):
   ```bash
   # Set the DATABASE_URL environment variable
   export DATABASE_URL="your-railway-database-url"
   
   # Run migrations
   cd packages/db
   npm run migrate:deploy
   
   # (Optional) Seed database
   npm run seed
   ```

### Option C: Use Railway's Database Connect Feature

1. Go to Railway dashboard → Your Postgres service
2. Click "Connect" → "Query"
3. Run the SQL from `packages/db/prisma/migrations/20251218165612_init/migration.sql`

---

## 3. 🔧 Fixing Your API Server (Railway)

### Check API Server Status

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Click on your API service**
3. **Check the "Deployments" tab**:
   - ✅ Green = Running
   - ❌ Red = Failed
   - ⏳ Yellow = Building

### Common Issues & Fixes

#### Issue 1: API Not Starting

**Check logs**:
1. In Railway dashboard, click on your API service
2. Go to "Deployments" → Click latest deployment → "View Logs"

**Common errors**:
- `DATABASE_URL not set` → Add it in Railway Variables
- `Port binding failed` → Railway sets `PORT` automatically, ensure your code uses `process.env.PORT`
- `Module not found` → Check build command in `railway.json`

#### Issue 2: Environment Variables Missing

**Add required variables in Railway**:
1. Go to your API service in Railway
2. Click "Variables" tab
3. Add these required variables:

```bash
# Database (should be auto-set by Railway if using Railway Postgres)
DATABASE_URL=postgresql://... (Railway provides this)

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=7d

# API
PORT=3001
NODE_ENV=production

# Frontend URL (your Vercel URL)
FRONTEND_URL=https://your-project.vercel.app

# CORS (if needed)
CORS_ORIGIN=https://your-project.vercel.app
```

#### Issue 3: Build Failing

**Check `railway.json`**:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd packages/db && npm run build && cd ../../apps/api && npm install && npm run build"
  },
  "deploy": {
    "startCommand": "cd apps/api && npm start"
  }
}
```

**Verify your `apps/api/package.json` has**:
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "tsc"
  }
}
```

---

## 4. 🔗 Connecting Frontend to API

Once your API is running on Railway, you need to tell your Vercel frontend where to find it.

### Get Your Railway API URL

1. Go to Railway dashboard → Your API service
2. Click "Settings" → "Networking"
3. Copy the **Public Domain** (e.g., `your-api.up.railway.app`)

### Set Environment Variable in Vercel

1. Go to Vercel dashboard → Your project
2. Click "Settings" → "Environment Variables"
3. Add:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.up.railway.app
   ```
4. **Redeploy** your Vercel project (or wait for auto-deploy)

---

## 5. ✅ Verification Checklist

After completing the above steps:

- [ ] ✅ Can access website at `https://your-project.vercel.app`
- [ ] ✅ Database has tables (check Railway Postgres → "Data" tab)
- [ ] ✅ API server is running (check Railway → "Deployments")
- [ ] ✅ API health check works: `https://your-api.up.railway.app/health`
- [ ] ✅ Frontend can connect to API (check browser console for errors)

---

## 6. 🧪 Testing Your Deployment

### Test Database Connection

```bash
# Via Railway CLI
railway run -- node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => console.log('✅ Connected')).catch(e => console.error('❌ Error:', e));"
```

### Test API Endpoints

```bash
# Health check
curl https://your-api.up.railway.app/health

# Get products (should return empty array or seeded products)
curl https://your-api.up.railway.app/api/products
```

### Test Frontend

1. Visit `https://your-project.vercel.app`
2. Open browser DevTools (F12) → Console tab
3. Check for API connection errors
4. Try navigating to different pages

---

## 7. 🆘 Troubleshooting

### Database Still Empty?

1. Verify migrations ran successfully:
   ```bash
   railway run -- cd packages/db && npx prisma migrate status
   ```

2. Manually run seed script:
   ```bash
   railway run -- cd packages/db && npm run seed
   ```

### API Returns 500 Errors?

1. Check Railway logs for detailed error messages
2. Verify `DATABASE_URL` is set correctly
3. Ensure database migrations have run
4. Check that all required environment variables are set

### Frontend Can't Connect to API?

1. Verify `NEXT_PUBLIC_API_URL` is set in Vercel
2. Check CORS settings in API (should allow your Vercel domain)
3. Verify API is actually running (check Railway dashboard)
4. Check browser console for CORS errors

---

## 📞 Quick Reference

### Railway Commands
```bash
railway login          # Login to Railway
railway link           # Link to project
railway status         # Check deployment status
railway logs           # View logs
railway run <cmd>      # Run command in Railway environment
```

### Database Commands
```bash
cd packages/db
npm run migrate:deploy  # Run migrations (production)
npm run seed            # Seed database with sample data
npm run studio          # Open Prisma Studio (local only)
```

---

## 🎉 Next Steps

Once everything is working:

1. **Create an admin user**:
   ```bash
   railway run -- cd packages/db && npm run create-admin
   ```

2. **Add products** via admin dashboard or API

3. **Test the full flow**: Browse → Add to cart → Checkout → Order

4. **Set up custom domain** when ready

---

**Need more help?** Check the logs in Railway and Vercel dashboards for specific error messages.

