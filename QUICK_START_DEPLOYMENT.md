# ⚡ Quick Start - Fix Your Deployment

## 🎯 Three Things to Fix

### 1. 📍 Get Your Website URL

**Vercel automatically gives you a URL!**

1. Go to: https://vercel.com/dashboard
2. Click your project
3. Copy the URL (looks like: `https://your-project.vercel.app`)

**That's your website URL!** You can use it right now to test before buying a domain.

---

### 2. 🗄️ Fix Empty Database

Your database is empty because migrations haven't run. 

**⚠️ Important**: Railway's internal hostnames don't work from your local machine. You need the public DATABASE_URL.

**Step 1: Get DATABASE_PUBLIC_URL from Railway**
1. Go to Railway dashboard → Your **Postgres** service
2. Click **"Variables"** tab
3. Copy the `DATABASE_PUBLIC_URL` value (preferred)
   - If it doesn't exist, use `DATABASE_URL` instead
   - Should look like: `postgresql://postgres:password@switchback.proxy.rlwy.net:port/railway`
   - ⚠️ **DO NOT use** the internal URL (`postgres.railway.internal`) - it won't work locally

**Step 2: Run migrations**

```bash
# Option 1: Use the interactive script (easiest)
./scripts/migrate-railway.sh
# (It will prompt you to paste the DATABASE_URL)

# Option 2: Manual steps
export DATABASE_URL="paste-your-DATABASE_PUBLIC_URL-here"
cd packages/db
npm run migrate:deploy  # Creates tables
npm run seed            # Adds sample products (optional)
```

---

### 3. 🔗 Connect Frontend to API

**Your API is running!** Now connect your Vercel frontend to it:

**Step 1: Get API Public URL**
1. Railway dashboard → `@fusionaura/api` service → Settings → Networking
2. Find "Public Domain" or click "Generate Domain"
3. Copy the URL (e.g., `https://your-api.up.railway.app`)

**Step 2: Test API**
```bash
curl https://your-api-url.railway.app/health
# Should return: {"status":"ok",...}
```

**Step 3: Connect Vercel to API**
1. Vercel dashboard → Your project → Settings → Environment Variables
2. Add: `NEXT_PUBLIC_API_URL=https://your-api-url.railway.app`
3. Redeploy Vercel project

**Step 4: Set CORS (Allow Vercel to call API)**
1. Railway → API service → Variables
2. Add: `FRONTEND_URL=https://your-vercel-project.vercel.app`
3. API will auto-redeploy

**Note**: Meilisearch warning in logs is safe to ignore - API works without it!

---

## ✅ Quick Verification

```bash
# 1. Test API health
curl https://your-api.up.railway.app/health

# 2. Test products endpoint
curl https://your-api.up.railway.app/api/products

# 3. Visit your website
# Open: https://your-project.vercel.app
```

---

## 📚 Full Guide

For detailed instructions, see: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 🆘 Still Having Issues?

1. **Check logs** in Railway and Vercel dashboards
2. **Verify environment variables** are set correctly
3. **Ensure database migrations ran** (check Railway Postgres → Data tab)
4. **Test API directly** using curl or Postman

