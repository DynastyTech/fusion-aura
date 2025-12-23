# ✅ Vercel Deployment Fix

## Problem
Vercel deployment failed with error:
```
The 'vercel.json' schema validation failed with the following message: 
should NOT have additional property `rootDirectory`
```

## Solution
Removed the invalid `rootDirectory` property from `vercel.json`.

## ⚠️ IMPORTANT: Configure Root Directory in Vercel Dashboard

Since `rootDirectory` cannot be in `vercel.json`, you **MUST** configure it in Vercel Dashboard:

### Steps:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **fusion-aura-web**
3. Go to **Settings** tab
4. Click **General** in the left sidebar
5. Scroll to **Root Directory**
6. Click **Edit**
7. Set it to: `apps/web`
8. Click **Save**

## Updated vercel.json

The file now only contains:
```json
{
  "framework": "nextjs"
}
```

This is the minimal configuration. Vercel will:
- Use the root directory from dashboard settings (`apps/web`)
- Auto-detect Next.js and use default build commands
- Install dependencies automatically

## Next Steps

1. **Configure Root Directory in Dashboard** (REQUIRED - do this first!)
   - Settings → General → Root Directory → `apps/web`

2. **Push the fixed vercel.json**:
   ```bash
   git add vercel.json
   git commit -m "Fix vercel.json: Remove invalid rootDirectory property"
   git push origin main
   ```

3. **Vercel will auto-deploy** and should succeed! ✅

## Alternative: If Root Directory Setting Doesn't Work

If setting root directory in dashboard doesn't work, you can also:
- Use Vercel CLI: `vercel --cwd apps/web`
- Or create a separate Vercel project pointing to `apps/web` subdirectory

