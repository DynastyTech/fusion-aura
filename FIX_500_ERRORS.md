# 🔧 Fix 500 Errors: "Cannot read properties of undefined"

## Current Issue

The API is returning 500 errors:
- `Cannot read properties of undefined (reading 'user')`
- `Cannot read properties of undefined (reading 'product')`

This suggests Prisma client isn't properly initialized or DATABASE_URL isn't set.

---

## ✅ What You've Done

- ✅ JWT_SECRET is set: `dev_jwt_secret_key_min_32_characters_long_for_development_use_only`
- ✅ Database tables exist (confirmed in Railway dashboard)
- ✅ Migrations ran successfully

---

## 🔧 Fix Steps

### Step 1: Verify DATABASE_URL in Railway

1. Go to **Railway Dashboard** → `@fusionaura/api` service
2. Click **"Variables"** tab
3. **Check if `DATABASE_URL` exists**:
   - If it's missing, Railway should auto-provide it when Postgres is linked
   - If missing, add it manually:
     ```
     DATABASE_URL=postgresql://postgres:hAqXnjEKiWaUGBPDkRjAlbTrjHyeqkpz@switchback.proxy.rlwy.net:14182/railway
     ```

### Step 2: Verify Prisma Client Generation

The build should generate Prisma client. Check Railway build logs:

1. Railway Dashboard → `@fusionaura/api` service
2. Click **"Deployments"** → Latest deployment → **"Build Logs"**
3. Look for: `"Prisma Client generated successfully"` or similar

**If Prisma client generation failed**, the build command might need adjustment.

### Step 3: Add DATABASE_URL to Railway API Service

Even though Railway should auto-provide it, let's ensure it's there:

1. Railway Dashboard → `@fusionaura/api` service → **"Variables"** tab
2. Check if `DATABASE_URL` exists
3. If not, add it:
   ```
   DATABASE_URL=postgresql://postgres:hAqXnjEKiWaUGBPDkRjAlbTrjHyeqkpz@switchback.proxy.rlwy.net:14182/railway
   ```
4. Railway will auto-redeploy

### Step 4: Verify All Required Environment Variables

In Railway → `@fusionaura/api` → Variables, ensure you have:

```
✅ DATABASE_URL=postgresql://postgres:...@switchback.proxy.rlwy.net:14182/railway
✅ JWT_SECRET=dev_jwt_secret_key_min_32_characters_long_for_development_use_only
✅ PORT=3001
✅ NODE_ENV=production
✅ FRONTEND_URL=https://fusion-aura-web.vercel.app
```

### Step 5: Force Redeploy API

After adding/verifying variables:

1. Railway Dashboard → `@fusionaura/api` service
2. Click **"Deployments"** tab
3. Click **"Redeploy"** on the latest deployment
4. Watch the build logs to ensure Prisma client generates

---

## 🐛 Debugging

### Check Railway Build Logs

1. Railway → `@fusionaura/api` → Deployments → Latest → Build Logs
2. Look for:
   - `"Prisma Client generated"`
   - `"Building Prisma Client"`
   - Any errors related to Prisma

### Check Railway Deploy Logs

1. Railway → `@fusionaura/api` → Deployments → Latest → Deploy Logs
2. Look for:
   - Database connection errors
   - Prisma initialization errors
   - Missing environment variable warnings

### Test Database Connection

If you have Railway CLI:
```bash
railway link  # Select @fusionaura/api service
railway run -- node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => console.log('✅ Connected')).catch(e => console.error('❌ Error:', e));"
```

---

## 🔍 Common Causes

### 1. DATABASE_URL Not Set

**Symptom**: Prisma can't connect to database

**Fix**: Add DATABASE_URL in Railway Variables

### 2. Prisma Client Not Generated

**Symptom**: `Cannot find module '@prisma/client'` or similar

**Fix**: Ensure build command runs `prisma generate`:
```json
"buildCommand": "cd packages/db && npm run build && cd ../../apps/api && npm install && npm run build"
```

### 3. Wrong DATABASE_URL Format

**Symptom**: Connection refused

**Fix**: Use the public URL (DATABASE_PUBLIC_URL), not internal:
```
✅ postgresql://postgres:...@switchback.proxy.rlwy.net:14182/railway
❌ postgresql://postgres:...@postgres.railway.internal:5432/railway
```

### 4. Prisma Client Out of Sync

**Symptom**: Schema mismatch errors

**Fix**: Ensure migrations ran and Prisma client regenerated

---

## ✅ Verification

After fixing, test:

```bash
# Health check
curl https://fusionauraapi-production.up.railway.app/health

# Login (should work now)
curl -X POST https://fusionauraapi-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fusionaura.com","password":"admin123"}'

# Products (should work now)
curl https://fusionauraapi-production.up.railway.app/api/products
```

---

## 📋 Quick Checklist

- [ ] DATABASE_URL is set in Railway API Variables
- [ ] JWT_SECRET is set (✅ already done)
- [ ] FRONTEND_URL is set in Railway API Variables
- [ ] Prisma client generated in build logs
- [ ] API redeployed after variable changes
- [ ] Test endpoints return 200 (not 500)

---

## 🎯 Most Likely Fix

**Add DATABASE_URL to Railway API service Variables**:
1. Railway → `@fusionaura/api` → Variables
2. Add: `DATABASE_URL` = `postgresql://postgres:hAqXnjEKiWaUGBPDkRjAlbTrjHyeqkpz@switchback.proxy.rlwy.net:14182/railway`
3. Redeploy

This should fix the 500 errors!

