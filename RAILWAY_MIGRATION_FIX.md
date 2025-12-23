# 🔧 Fix: Railway Migration Connection Error

## Problem

When running `railway run -- npm run migrate:deploy`, you get:
```
Error: P1001: Can't reach database server at `postgres.railway.internal:5432`
```

## Why This Happens

Railway's `railway run` command tries to use internal hostnames (`postgres.railway.internal`) that only work within Railway's network, not from your local machine.

## Solution: Use Public DATABASE_URL

### Step 1: Get Your DATABASE_URL

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Click on your Postgres service** (not the API service)
3. **Click "Variables" tab**
4. **Find and copy the `DATABASE_PUBLIC_URL`** value (preferred)
   - If `DATABASE_PUBLIC_URL` doesn't exist, use `DATABASE_URL`
   - The public URL looks like: `postgresql://postgres:password@switchback.proxy.rlwy.net:port/railway`
   - **DO NOT use** the internal URL (`postgres.railway.internal`) - it won't work from your local machine

### Step 2: Run Migrations

**Option A: Using the Script (Easiest)**
```bash
./scripts/migrate-railway.sh
```
The script will prompt you to paste the DATABASE_URL.

**Option B: Manual Method**
```bash
# Set the DATABASE_URL environment variable (use DATABASE_PUBLIC_URL from Railway)
export DATABASE_URL="postgresql://postgres:password@switchback.proxy.rlwy.net:port/railway"

# Navigate to db package
cd packages/db

# Run migrations
npm run migrate:deploy

# (Optional) Seed database with sample data
npm run seed
```

### Step 3: Verify

After running migrations, check your database:
1. Go to Railway dashboard → Postgres service
2. Click "Data" tab
3. You should now see tables: `users`, `products`, `categories`, `orders`, etc.

---

## Alternative: Run Migrations from Railway API Service

If your API service is running and has network access to the database, you can run migrations from within Railway:

```bash
# Link to your API service (not Postgres)
railway link  # Select @fusionaura/api service

# Run migrations in Railway's environment
railway run --service @fusionaura/api -- sh -c "cd packages/db && npm run migrate:deploy"
```

However, this requires:
- Your API service to be deployed and running
- The API service to have the `packages/db` directory available
- Proper build setup

**The DATABASE_URL method (Option A/B above) is usually easier and more reliable.**

---

## Quick Reference

```bash
# Get DATABASE_URL from Railway dashboard → Postgres → Variables
export DATABASE_URL="your-url-here"
cd packages/db
npm run migrate:deploy  # Creates tables
npm run seed            # Adds sample products
```

---

## Still Having Issues?

1. **Verify DATABASE_URL format**: Should start with `postgresql://`
2. **Check Railway Postgres is running**: Dashboard → Postgres service → Should show "Online"
3. **Try connecting with psql** (if installed):
   ```bash
   psql "$DATABASE_URL" -c "SELECT version();"
   ```
4. **Check Railway logs**: Dashboard → Postgres service → Logs tab

