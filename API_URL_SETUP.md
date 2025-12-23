# ✅ API URL Confirmed & Setup Instructions

## Your API URL

**Public Domain**: `https://fusionauraapi-production.up.railway.app`

✅ **Status**: API is online and accessible  
✅ **Health Check**: Working (`/health` endpoint responds)  
⚠️ **Note**: 404 on `/` is normal - API doesn't have a root route

---

## 🔧 Current Issues

The API is running but some endpoints are returning 500 errors:
- `/api/auth/login` - 500 error
- `/api/products` - 500 error

This suggests a runtime issue. Check Railway logs for details.

---

## 📋 Setup Steps

### Step 1: Set API URL in Vercel

1. Go to **Vercel Dashboard** → Your project (`fusion-aura-web`)
2. Click **"Settings"** → **"Environment Variables"**
3. Add/Update:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://fusionauraapi-production.up.railway.app`
   - **Environment**: Production, Preview, Development (select all)
4. Click **"Save"**
5. **Redeploy** your Vercel project:
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"

### Step 2: Set CORS in Railway

1. Go to **Railway Dashboard** → `@fusionaura/api` service
2. Click **"Variables"** tab
3. Add/Update:
   - **Name**: `FRONTEND_URL`
   - **Value**: `https://fusion-aura-web.vercel.app`
4. Railway will automatically redeploy

### Step 3: Fix 500 Errors

The 500 errors need investigation. Check:

1. **Railway Logs**:
   - Railway Dashboard → `@fusionaura/api` service
   - Click "Deployments" → Latest deployment → "View Logs"
   - Look for error messages

2. **Common Causes**:
   - Database connection issue
   - Missing environment variables (JWT_SECRET, DATABASE_URL)
   - Prisma client not generated
   - Code errors

3. **Verify Environment Variables in Railway**:
   ```
   DATABASE_URL=postgresql://... (should be auto-set)
   JWT_SECRET=your-secret-min-32-chars
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://fusion-aura-web.vercel.app
   ```

---

## 🧪 Test Endpoints

### Health Check (Should Work)
```bash
curl https://fusionauraapi-production.up.railway.app/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Login (Currently 500 - Needs Fix)
```bash
curl -X POST https://fusionauraapi-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fusionaura.com","password":"admin123"}'
```

### Products (Currently 500 - Needs Fix)
```bash
curl https://fusionauraapi-production.up.railway.app/api/products
```

---

## 🔍 Debugging 500 Errors

### Check Railway Logs

1. Railway Dashboard → `@fusionaura/api` service
2. "Deployments" → Latest → "View Logs"
3. Look for:
   - Database connection errors
   - Prisma errors
   - Missing environment variables
   - Stack traces

### Common Fixes

**If DATABASE_URL is missing:**
- Railway should auto-provide this if Postgres is linked
- Check Variables tab → Should see `DATABASE_URL`

**If JWT_SECRET is missing:**
- Add `JWT_SECRET` in Railway Variables (min 32 characters)
- Redeploy API

**If Prisma errors:**
- Ensure migrations ran: `railway run -- cd packages/db && npm run migrate:deploy`
- Check Prisma client is generated in build

**If database connection fails:**
- Verify Postgres service is online
- Check DATABASE_URL is correct
- Test connection: `railway run -- cd packages/db && npx prisma db pull`

---

## ✅ Verification Checklist

- [ ] API URL set in Vercel: `NEXT_PUBLIC_API_URL=https://fusionauraapi-production.up.railway.app`
- [ ] Vercel project redeployed
- [ ] `FRONTEND_URL` set in Railway API service
- [ ] Health endpoint works: `/health`
- [ ] Login endpoint works: `/api/auth/login` (currently 500)
- [ ] Products endpoint works: `/api/products` (currently 500)
- [ ] Railway logs checked for errors
- [ ] Environment variables verified in Railway

---

## 🎯 Next Steps

1. **Set API URL in Vercel** (Step 1 above)
2. **Check Railway logs** to identify 500 error cause
3. **Fix the 500 errors** based on log findings
4. **Test login** with admin credentials:
   - Email: `admin@fusionaura.com`
   - Password: `admin123`

---

## 📞 Admin Credentials

**Email**: `admin@fusionaura.com`  
**Password**: `admin123`

The admin user exists in your database. Once the 500 errors are fixed, you'll be able to log in.

