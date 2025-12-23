# 🔐 Admin Login Credentials & 405 Error Fix

## ✅ Admin Credentials

**Email**: `admin@fusionaura.com`  
**Password**: `admin123`

The admin user has been created in your Railway database.

---

## 🔧 Fixing the 405 Error

The 405 "Method Not Allowed" error means the API endpoint exists but doesn't accept the HTTP method being used, OR the request isn't reaching the correct endpoint.

### Step 1: Verify API URL in Vercel

1. Go to **Vercel Dashboard** → Your project
2. Click **"Settings"** → **"Environment Variables"**
3. Check that `NEXT_PUBLIC_API_URL` is set correctly:
   - Should be: `https://your-api-url.railway.app` (no trailing slash)
   - Should NOT be: `https://your-api-url.railway.app/` (with trailing slash)
   - Should NOT include `/api` at the end

**Example:**
```
✅ Correct: https://fusionauraapi-production.up.railway.app
❌ Wrong:   https://fusionauraapi-production.up.railway.app/
❌ Wrong:   https://fusionauraapi-production.up.railway.app/api
```

### Step 2: Test API Endpoint Directly

Test if the login endpoint is accessible:

```bash
# Replace with your actual API URL
curl -X POST https://your-api-url.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fusionaura.com","password":"admin123"}'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "admin@fusionaura.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN"
    },
    "token": "..."
  }
}
```

**If you get 405:**
- The API URL might be wrong
- The route might not be registered correctly

**If you get 404:**
- The API URL is definitely wrong
- Check Railway → API service → Settings → Networking → Public Domain

### Step 3: Check API Route Registration

The login route should be registered at `/api/auth/login` with POST method.

Verify in Railway logs:
1. Railway Dashboard → `@fusionaura/api` service
2. Check logs for route registration messages
3. Look for: "Routes registered" or similar

### Step 4: Check CORS Settings

1. Railway Dashboard → `@fusionaura/api` service → Variables
2. Ensure `FRONTEND_URL` is set to your Vercel URL:
   ```
   FRONTEND_URL=https://fusion-aura-web.vercel.app
   ```
3. Redeploy API if you changed it

### Step 5: Verify API is Actually Running

1. Test health endpoint:
   ```bash
   curl https://your-api-url.railway.app/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. Test products endpoint:
   ```bash
   curl https://your-api-url.railway.app/api/products
   ```
   Should return a list of products

---

## 🐛 Common Issues

### Issue 1: API URL Not Set in Vercel

**Symptom**: 405 or 404 errors, "Failed to fetch"

**Fix**:
1. Vercel → Settings → Environment Variables
2. Add `NEXT_PUBLIC_API_URL` with your Railway API URL
3. Redeploy Vercel project

### Issue 2: Wrong API URL Format

**Symptom**: 405 errors

**Fix**: Ensure URL has no trailing slash:
```
✅ https://api.railway.app
❌ https://api.railway.app/
```

### Issue 3: CORS Error

**Symptom**: CORS errors in browser console

**Fix**:
1. Railway → API service → Variables
2. Set `FRONTEND_URL` to your Vercel URL
3. Redeploy API

### Issue 4: API Not Running

**Symptom**: Connection refused, timeout

**Fix**:
1. Railway Dashboard → API service
2. Check "Deployments" tab - should be green
3. Check logs for errors
4. Verify environment variables are set

---

## ✅ Quick Test Checklist

- [ ] API health check works: `curl https://your-api-url.railway.app/health`
- [ ] API products endpoint works: `curl https://your-api-url.railway.app/api/products`
- [ ] API login endpoint works: `curl -X POST https://your-api-url.railway.app/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@fusionaura.com","password":"admin123"}'`
- [ ] `NEXT_PUBLIC_API_URL` is set in Vercel (no trailing slash)
- [ ] `FRONTEND_URL` is set in Railway API service
- [ ] Both services are redeployed after changes

---

## 🎯 Admin Login Steps

1. Go to: `https://fusion-aura-web.vercel.app/login`
2. Enter:
   - Email: `admin@fusionaura.com`
   - Password: `admin123`
3. Click "Sign in"

**If it still doesn't work:**
- Check browser console for specific error
- Verify API URL is correct in Vercel
- Test API endpoint directly with curl
- Check Railway API logs for errors

---

## 📞 Still Having Issues?

1. **Check browser console** for the exact error message
2. **Test API directly** with curl (see Step 2 above)
3. **Check Railway logs** for API errors
4. **Verify environment variables** in both Vercel and Railway

The admin user exists and the credentials are correct. The issue is likely with the API connection or routing.

