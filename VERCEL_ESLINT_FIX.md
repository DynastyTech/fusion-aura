# ✅ Vercel Build Fix - ESLint Errors

## Problem
Vercel build was failing due to ESLint errors:
- Unescaped apostrophes (`'`) in JSX text
- React Hook dependency warnings (these are warnings, not errors)

## Solution
Fixed all ESLint errors by escaping apostrophes in JSX:

### Files Fixed:
1. `apps/web/src/app/cart/page.tsx` - Line 177: `You're` → `You&apos;re`
2. `apps/web/src/app/checkout/page.tsx` - Line 393: `We'll` → `We&apos;ll`
3. `apps/web/src/app/order-confirmation/[id]/page.tsx` - Lines 275 & 278: `What's` → `What&apos;s`, `You'll` → `You&apos;ll`
4. `apps/web/src/app/orders/page.tsx` - Line 162: `haven't` → `haven&apos;t`

### Next.js Config
Updated `next.config.js` to explicitly handle ESLint (though errors should still fail builds, which is correct).

## Next Steps

1. **Commit and push the fixes:**
```bash
git add apps/web/src/app/cart/page.tsx
git add apps/web/src/app/checkout/page.tsx
git add apps/web/src/app/order-confirmation/[id]/page.tsx
git add apps/web/src/app/orders/page.tsx
git add apps/web/next.config.js
git commit -m "Fix ESLint errors: Escape apostrophes in JSX"
git push origin main
```

2. **Vercel will auto-deploy** and should succeed! ✅

## Note on Warnings

The React Hook dependency warnings are just warnings and won't cause build failures. They can be fixed later by:
- Adding missing dependencies to useEffect dependency arrays
- Or using useCallback/useMemo to memoize functions

But these are non-blocking and won't prevent deployment.

