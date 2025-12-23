# ✅ Vercel Monorepo Build Fix

## Problem
Build failing because:
- `tailwindcss` not found (dependencies not installed correctly)
- Module resolution errors for `@/lib/api` and `@/components/Logo`

## Root Cause
When Root Directory is set to `apps/web` in Vercel Dashboard:
- Vercel changes to `apps/web` directory first
- Then runs install/build commands from there
- But npm workspaces need installation from the **root** directory

## Solution

Updated `vercel.json`:
```json
{
  "framework": "nextjs",
  "installCommand": "cd ../.. && npm install"
}
```

This ensures:
- ✅ Install runs from **root** (handles npm workspaces)
- ✅ Build runs from `apps/web` (due to Root Directory setting)
- ✅ Dependencies are hoisted correctly to root `node_modules`

## Vercel Dashboard Settings (VERIFY):

1. **Root Directory**: `apps/web` ✅
2. **Node.js Version**: `20.x` ✅
3. **Build Command**: Leave as default (`npm run build`)
4. **Install Command**: Will use `cd ../.. && npm install` from vercel.json ✅

## Next Steps

1. **Push the fix:**
```bash
git add vercel.json
git commit -m "Fix Vercel monorepo: Install from root, build from apps/web"
git push origin main
```

2. **Vercel will auto-deploy** and should succeed! ✅

## How It Works

1. Vercel clones repo
2. Changes to `apps/web` (Root Directory setting)
3. Runs `cd ../.. && npm install` (goes to root, installs all workspaces)
4. Stays in `apps/web` directory
5. Runs `npm run build` (Next.js build)
6. Next.js finds dependencies in root `node_modules` (workspace hoisting)

