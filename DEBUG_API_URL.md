# 🔍 Debug: Malformed API URL Issue

## The Problem

The Network tab shows:
```
POST https://fusion-aura-web.vercel.app/POST%20https:/fusion-aura-web.vercel.app/POST%20h...
```

The `POST%20https:` suggests the environment variable might contain "POST https:" which is being URL-encoded.

---

## 🔍 Step 1: Check Actual Value in Vercel

1. Go to **Vercel Dashboard** → `fusion-aura-web` → **Settings** → **Environment Variables**
2. Click on `NEXT_PUBLIC_API_URL` to see the **full value**
3. **Copy the entire value** and check:
   - Does it start with `https://`?
   - Does it contain the word "POST" anywhere?
   - Are there any hidden characters or spaces?
   - Is it exactly: `https://fusionauraapi-production.up.railway.app`?

---

## 🔍 Step 2: Add Temporary Debug Code

Add this to your login page temporarily to see what value is actually being used:

**In `apps/web/src/app/login/page.tsx`**, add at the top:

```typescript
import { debugApiUrl } from '@/lib/api-debug';

// In your component, add:
useEffect(() => {
  debugApiUrl();
}, []);
```

Or add directly in the component:

```typescript
console.log('🔍 API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('🔍 API_URL type:', typeof process.env.NEXT_PUBLIC_API_URL);
console.log('🔍 API_URL JSON:', JSON.stringify(process.env.NEXT_PUBLIC_API_URL));
```

Then check the browser console to see what value is actually being used.

---

## ✅ Step 3: Fix the Value

Based on what you find:

### If the value is wrong:
1. **Delete** the `NEXT_PUBLIC_API_URL` variable
2. **Recreate** it with exactly:
   ```
   https://fusionauraapi-production.up.railway.app
   ```
3. Make sure:
   - ✅ No "POST" in the value
   - ✅ No spaces
   - ✅ Starts with `https://`
   - ✅ No trailing slash
   - ✅ Applied to all environments

### If the value looks correct:
The issue might be:
1. **Build cache** - Force a fresh rebuild
2. **Browser cache** - Clear cache or use incognito
3. **Next.js cache** - The variable is embedded at build time

---

## 🔧 Step 4: Force Fresh Build

1. **Vercel Dashboard** → Deployments
2. Click **"..."** → **"Redeploy"**
3. **Uncheck** "Use existing Build Cache"
4. Click **"Redeploy"**

This ensures Next.js reads the environment variable fresh.

---

## 🧪 Step 5: Test in Browser

1. Open browser in **incognito/private mode**
2. Open DevTools (F12) → Console
3. Navigate to login page
4. Check console logs for the debug output
5. Try to login/register
6. Check Network tab - the URL should be:
   ```
   POST https://fusionauraapi-production.up.railway.app/api/auth/login
   ```

---

## 🐛 Common Issues

### Issue 1: Value Contains "POST"
**Symptom**: URL shows `POST%20https:`

**Fix**: The value in Vercel probably has "POST" in it. Delete and recreate with just the URL.

### Issue 2: Value is Empty or Undefined
**Symptom**: Falls back to `http://localhost:3001`

**Fix**: Make sure the variable is set and applied to the correct environment.

### Issue 3: Value Has Trailing Slash
**Symptom**: URL might work but have double slashes

**Fix**: Remove trailing slash from the value.

### Issue 4: Build Cache
**Symptom**: Value looks correct but still wrong in browser

**Fix**: Force redeploy without cache.

---

## 📋 Verification Checklist

- [ ] Checked actual value in Vercel (full value, not truncated)
- [ ] Value is exactly: `https://fusionauraapi-production.up.railway.app`
- [ ] No "POST" in the value
- [ ] No spaces or hidden characters
- [ ] Applied to Production, Preview, and Development
- [ ] Added debug logs to see runtime value
- [ ] Force redeployed without cache
- [ ] Tested in incognito browser
- [ ] Network tab shows correct URL

---

## 🎯 Expected Result

After fixing, the Network tab should show:
```
POST https://fusionauraapi-production.up.railway.app/api/auth/login
```

**Status**: `200 OK` (or `401` if credentials wrong, but not `405`)

---

**The key is to check the actual value in Vercel and ensure it's set correctly, then force a fresh build!**

