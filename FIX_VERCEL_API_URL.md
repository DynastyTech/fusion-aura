# 🔧 Fix: Malformed API URL in Vercel

## 🐛 The Problem

The browser console shows a very malformed URL:
```
POST https://fusion-aura-web.vercel.app/POST%20https:/fusion-aura-web.vercel.app/fusionau...
```

This suggests `NEXT_PUBLIC_API_URL` in Vercel is either:
1. Set incorrectly
2. Not being read properly
3. Cached with an old value

---

## ✅ Step-by-Step Fix

### Step 1: Check Current Value in Vercel

1. Go to **Vercel Dashboard** → `fusion-aura-web` project
2. Click **"Settings"** → **"Environment Variables"**
3. Find `NEXT_PUBLIC_API_URL`
4. **Click on it** to see the full value (it might be truncated in the list)

### Step 2: Delete and Recreate the Variable

**Option A: Edit the existing variable**
1. Click the **"..."** menu next to `NEXT_PUBLIC_API_URL`
2. Click **"Edit"**
3. **Delete the entire value**
4. **Type exactly** (copy-paste to avoid typos):
   ```
   https://fusionauraapi-production.up.railway.app
   ```
5. Make sure:
   - ✅ Starts with `https://`
   - ✅ No trailing slash
   - ✅ No spaces before/after
   - ✅ Full domain only
6. Click **"Save"**

**Option B: Delete and recreate**
1. Click the **"..."** menu → **"Delete"**
2. Click **"Add Another"**
3. **Name**: `NEXT_PUBLIC_API_URL`
4. **Value**: `https://fusionauraapi-production.up.railway.app`
5. **Environment**: Select **"Production"**, **"Preview"**, and **"Development"** (all three)
6. Click **"Save"**

### Step 3: Force Redeploy

After updating the variable:

1. Go to **"Deployments"** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. **Important**: Select **"Use existing Build Cache"** = **OFF** (unchecked)
   - This ensures a fresh build with the new environment variable

### Step 4: Clear Browser Cache

After redeploy:

1. Open your site in an **incognito/private window**
2. Or clear browser cache:
   - Chrome: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
   - Select "Cached images and files"
   - Clear

### Step 5: Verify

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try to login or register
4. Check the network request URL - it should be:
   ```
   POST https://fusionauraapi-production.up.railway.app/api/auth/login
   ```
   
   **NOT:**
   ```
   POST https://fusion-aura-web.vercel.app/...
   ```

---

## 🔍 Debug: Check What Value is Being Used

If it still doesn't work, add temporary debugging:

1. In your code (temporarily), add:
   ```typescript
   console.log('API_URL value:', process.env.NEXT_PUBLIC_API_URL);
   ```
2. Check browser console to see what value is actually being used

---

## 📋 Common Mistakes to Avoid

❌ **Wrong:**
- `fusionauraapi-production.up.railway.app` (missing `https://`)
- `https://fusionauraapi-production.up.railway.app/` (trailing slash)
- `https://fusionauraapi-production.up.railway.app/api` (includes `/api`)
- `https://fusion-aura-web.vercel.app/fusionauraapi-production.up.railway.app` (combined URLs)
- `POST https://fusionauraapi-production.up.railway.app` (includes method)

✅ **Correct:**
- `https://fusionauraapi-production.up.railway.app`

---

## 🎯 Quick Checklist

- [ ] `NEXT_PUBLIC_API_URL` exists in Vercel
- [ ] Value is exactly: `https://fusionauraapi-production.up.railway.app`
- [ ] No trailing slash
- [ ] Includes `https://` protocol
- [ ] Applied to all environments (Production, Preview, Development)
- [ ] Vercel project redeployed (with cache cleared)
- [ ] Browser cache cleared or using incognito
- [ ] Console shows correct API URL in network requests

---

## 🆘 If Still Not Working

1. **Check Vercel Build Logs**:
   - Deployments → Latest → Build Logs
   - Look for environment variable warnings

2. **Check Runtime Logs**:
   - Deployments → Latest → Runtime Logs
   - Look for any errors

3. **Verify in Code**:
   - Add `console.log(process.env.NEXT_PUBLIC_API_URL)` in your API client
   - Check what value is actually being used

4. **Try Hard Refresh**:
   - `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

---

## 💡 Why This Happens

Next.js environment variables starting with `NEXT_PUBLIC_` are embedded at **build time**, not runtime. This means:
- If you change the variable, you **must rebuild**
- Old builds will have the old value cached
- Always redeploy after changing `NEXT_PUBLIC_*` variables

---

**The fix: Set the correct value and force a fresh redeploy!**

