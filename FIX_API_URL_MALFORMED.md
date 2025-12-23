# 🔧 Fix: Malformed API URL (405 Errors)

## 🐛 The Problem

The browser console shows:
```
POST https://fusion-aura-web.vercel.app/fusionauraapi-production.up.railway.app/api/auth/...
405 (Method Not Allowed)
```

**The API URL is malformed!** It's combining:
- Vercel domain: `fusion-aura-web.vercel.app`
- Railway API: `fusionauraapi-production.up.railway.app`

This creates an invalid URL that doesn't reach your API.

---

## ✅ The Fix

### Step 1: Check Vercel Environment Variable

1. Go to **Vercel Dashboard** → Your project (`fusion-aura-web`)
2. Click **"Settings"** → **"Environment Variables"**
3. Find `NEXT_PUBLIC_API_URL`

### Step 2: Fix the Value

The value should be:
```
https://fusionauraapi-production.up.railway.app
```

**Common mistakes:**
- ❌ `fusionauraapi-production.up.railway.app` (missing `https://`)
- ❌ `https://fusionauraapi-production.up.railway.app/` (trailing slash)
- ❌ `fusion-aura-web.vercel.app/fusionauraapi-production.up.railway.app` (wrong format)
- ✅ `https://fusionauraapi-production.up.railway.app` (correct!)

### Step 3: Update and Redeploy

1. **Update the variable** with the correct value
2. **Save** the changes
3. **Redeploy** your Vercel project:
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"

---

## 🔍 How to Verify

After redeploying, check the browser console. The API requests should show:

```
POST https://fusionauraapi-production.up.railway.app/api/auth/login
```

**NOT:**
```
POST https://fusion-aura-web.vercel.app/fusionauraapi-production.up.railway.app/api/auth/login
```

---

## 📋 Quick Checklist

- [ ] `NEXT_PUBLIC_API_URL` exists in Vercel Environment Variables
- [ ] Value is exactly: `https://fusionauraapi-production.up.railway.app`
- [ ] No trailing slash
- [ ] Includes `https://` protocol
- [ ] Vercel project redeployed after change
- [ ] Browser console shows correct API URL

---

## 🎯 Why This Happens

The frontend code constructs API URLs like this:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
fetch(`${API_URL}${endpoint}`, ...)
```

If `NEXT_PUBLIC_API_URL` is:
- Missing → Falls back to localhost (won't work in production)
- Wrong format → Creates malformed URLs
- Empty → Same as missing

---

## ✅ After Fixing

Once the URL is correct:
1. The 405 errors should disappear
2. Login/register should work
3. API requests will reach Railway correctly

Test with:
- Login: `admin@fusionaura.com` / `admin123`
- Register: Create a new account

---

**The fix is simple: Set `NEXT_PUBLIC_API_URL` correctly in Vercel!**

