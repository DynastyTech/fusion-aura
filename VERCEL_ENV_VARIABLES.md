# Vercel Environment Variables Setup

## ❌ Current Issue

Your `NEXT_PUBLIC_API_URL` is set to: `I9JU23NF394R6HH`

This is **NOT a valid URL**. It looks like a placeholder or ID.

## ✅ Required Environment Variable

The Next.js frontend only needs **ONE** environment variable:

### `NEXT_PUBLIC_API_URL`

**What it should be:**
- **For Production:** Your Railway backend API URL
  - Example: `https://fusion-aura-api.railway.app`
  - Or: `https://your-api-name.up.railway.app`
  
- **For Local Development:** `http://localhost:3001`

**Where it's used:**
- All API calls from the frontend
- Product fetching
- Authentication
- Order management
- Image uploads

## 🔧 How to Fix

### Step 1: Deploy Backend to Railway (if not done)

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Deploy your backend API
4. Copy the deployment URL (e.g., `https://your-api.railway.app`)

### Step 2: Update Vercel Environment Variable

1. In Vercel dashboard → Your Project → Settings → Environment Variables
2. Find `NEXT_PUBLIC_API_URL`
3. Click the edit/pencil icon
4. Change the value to your Railway API URL:
   ```
   https://your-api-name.railway.app
   ```
5. Make sure it's set for:
   - ✅ Production
   - ✅ Preview (optional, can use same URL)
   - ✅ Development (optional, can use `http://localhost:3001`)

### Step 3: Redeploy

After updating the environment variable, trigger a new deployment.

## 📝 Example Configuration

```
Environment Variable:
Key: NEXT_PUBLIC_API_URL
Value: https://fusion-aura-api-production.up.railway.app

Environments:
✅ Production
✅ Preview  
✅ Development (optional: http://localhost:3001)
```

## ⚠️ Important Notes

1. **No trailing slash:** Don't add `/` at the end
   - ✅ Correct: `https://api.railway.app`
   - ❌ Wrong: `https://api.railway.app/`

2. **Use HTTPS:** Railway provides HTTPS URLs, use those

3. **CORS:** Make sure your Railway backend has CORS configured to allow your Vercel domain:
   ```
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   ```

## 🚀 After Fixing

Once you update the environment variable:
1. Save the changes in Vercel
2. Redeploy your project
3. The frontend will now connect to your backend API

## 🔍 Verify It's Working

After deployment, check:
1. Open your Vercel site
2. Open browser DevTools → Network tab
3. Try to load products or login
4. Check if API calls are going to the correct URL
