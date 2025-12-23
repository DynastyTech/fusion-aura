# Vercel Deployment Fix

## Problem
The build failed because `@fusionaura/types` was trying to import types from `@fusionaura/db` before Prisma types were generated.

## Solution Applied

### 1. Updated `packages/types/index.ts`
- Changed to import directly from `@prisma/client` instead of `@fusionaura/db`
- This avoids the circular dependency issue

### 2. Updated `packages/types/package.json`
- Added `@prisma/client` as a dependency
- Removed `@fusionaura/db` dependency

### 3. Updated `packages/db/package.json`
- Added `"build": "prisma generate"` script
- This ensures Prisma types are generated during the build process

### 4. Updated `turbo.json`
- Added `node_modules/.prisma/**` to build outputs
- Ensures Prisma generated files are cached properly

## Vercel Configuration

Created `vercel.json` with:
- Root directory: `apps/web`
- Build command: Runs from root to ensure all packages build correctly

## Next Steps

1. Commit these changes:
```bash
git add .
git commit -m "Fix Vercel build: Update types package to import from @prisma/client directly"
git push origin main
```

2. Redeploy on Vercel - it should now build successfully!

## Alternative: If Build Still Fails

If the build still fails, you may need to:
1. Ensure Prisma schema is accessible during build
2. Add a prebuild script to generate Prisma types
3. Or simplify the types package to not require Prisma types at build time
