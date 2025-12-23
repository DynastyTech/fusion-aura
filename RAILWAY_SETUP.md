# Railway Deployment Setup

## ⚠️ Important: Only Deploy API to Railway

**Railway should ONLY deploy the backend API (`apps/api`), NOT the frontend (`apps/web`).**

The frontend should be deployed to **Vercel** instead.

## 🔧 Railway Configuration

### Option 1: Single Service (Recommended)

1. **In Railway Dashboard:**
   - Go to your project
   - You should see TWO services: `@fusionaura/api` and `@fusionaura/web`
   - **DELETE** the `@fusionaura/web` service (you don't need it on Railway)
   - Keep only `@fusionaura/api`

2. **Configure the API Service:**
   - Click on `@fusionaura/api` service
   - Go to **Settings** → **Service Settings**
   - Set **Root Directory** to: `apps/api`
   - Set **Build Command** to: `npm install && npm run build`
   - Set **Start Command** to: `npm start`
   - Set **Port** to: `3001` (or use Railway's PORT env var)

3. **Environment Variables:**
   Add these in Railway → Variables:
   ```
   DATABASE_URL=<auto-provided-by-postgres-service>
   JWT_SECRET=<your-secret-key-min-32-chars>
   NODE_ENV=production
   PORT=3001
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=<your-email>
   SMTP_PASS=<your-app-password>
   ADMIN_EMAIL=lraseemela@gmail.com
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
   CLOUDINARY_API_KEY=<your-key>
   CLOUDINARY_API_SECRET=<your-secret>
   GOOGLE_MAPS_API_KEY=<optional>
   ```

### Option 2: Use railway.json (Alternative)

I've created `railway.json` and `apps/api/railway.json` files that Railway will automatically detect.

## 🚀 Why Both Failed

Railway detected both services in your monorepo and tried to deploy both:
- `@fusionaura/api` - Should work (backend API)
- `@fusionaura/web` - Should NOT be on Railway (frontend for Vercel)

## ✅ Solution

1. **Remove web service from Railway:**
   - In Railway dashboard, delete the `@fusionaura/web` service
   - Only keep `@fusionaura/api`

2. **Deploy web to Vercel:**
   - Frontend should be deployed separately to Vercel
   - See `VERCEL_DEPLOYMENT_FIX.md` for Vercel setup

3. **Fix API service configuration:**
   - Ensure Root Directory is set to `apps/api`
   - Ensure build/start commands are correct
   - Ensure all environment variables are set

## 📝 Next Steps

1. Delete `@fusionaura/web` service from Railway
2. Configure `@fusionaura/api` with correct settings
3. Push the TypeScript fixes I made
4. Redeploy the API service
5. Deploy frontend separately to Vercel

The API should now deploy successfully!
