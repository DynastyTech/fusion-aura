# GitHub Pages Deployment Guide

## ⚠️ Important Limitations

**GitHub Pages only hosts static websites.** Your FusionAura project has:
- ✅ Frontend (Next.js) - Can be exported as static
- ❌ Backend API (Fastify) - **Cannot run on GitHub Pages**

## 📋 Deployment Strategy

You have two options:

### Option 1: Static Export (Limited Functionality) ⚠️
Export Next.js as static HTML, but you'll lose:
- Server-side rendering
- API routes
- Dynamic features that require a server

**Not recommended** for a full e-commerce site.

### Option 2: Hybrid Deployment (Recommended) ✅
- **Frontend**: Deploy to Vercel (free, optimized for Next.js)
- **Backend**: Deploy to Railway (free tier available)
- **Database**: Railway PostgreSQL (included)
- **Domain**: GoDaddy (point DNS to Vercel)

This is the approach you mentioned wanting to do later. **I recommend doing this now** instead of GitHub Pages.

## 🚀 Recommended: Deploy to Vercel + Railway Now

### Step 1: Deploy Backend to Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `fusion-aura` repository
   - Select the `apps/api` directory

3. **Configure Environment Variables**
   Add these in Railway dashboard:
   ```
   DATABASE_URL=<your-postgres-url>
   JWT_SECRET=<your-secret>
   CORS_ORIGIN=https://your-vercel-app.vercel.app
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=<your-email>
   SMTP_PASS=<your-app-password>
   ADMIN_EMAIL=lraseemela@gmail.com
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-name>
   CLOUDINARY_API_KEY=<your-key>
   CLOUDINARY_API_SECRET=<your-secret>
   ```

4. **Add PostgreSQL Database**
   - In Railway project, click "New" → "Database" → "PostgreSQL"
   - Railway will provide `DATABASE_URL` automatically

5. **Deploy**
   - Railway will auto-deploy when you push to GitHub
   - Note the deployment URL (e.g., `https://your-api.railway.app`)

### Step 2: Deploy Frontend to Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New Project"
   - Import your `fusion-aura` repository
   - Set **Root Directory** to `apps/web`

3. **Configure Build Settings**
   ```
   Framework Preset: Next.js
   Root Directory: apps/web
   Build Command: npm run build
   Output Directory: .next
   ```

4. **Environment Variables**
   Add in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.railway.app
   ```

5. **Deploy**
   - Vercel will auto-deploy
   - You'll get a URL like `https://fusion-aura.vercel.app`

### Step 3: Connect GoDaddy Domain (Later)

1. **In Vercel Dashboard**
   - Go to your project → Settings → Domains
   - Add your GoDaddy domain (e.g., `fusionaura.com`)

2. **In GoDaddy DNS Settings**
   - Add CNAME record:
     - Type: CNAME
     - Name: @ (or www)
     - Value: `cname.vercel-dns.com`
   - Or A record pointing to Vercel IPs

3. **Update Environment Variables**
   - Update `CORS_ORIGIN` in Railway to your domain
   - Update `NEXT_PUBLIC_API_URL` if needed

## 📱 Mobile Responsiveness

### Current Status: ✅ Mostly Responsive

The website uses **Tailwind CSS** with responsive breakpoints:
- `sm:` - 640px and up
- `md:` - 768px and up  
- `lg:` - 1024px and up
- `xl:` - 1280px and up

### Admin Mobile Functionality: ✅ Yes, Works on Mobile

The admin can add products on mobile:
- Forms use `grid-cols-1 md:grid-cols-2` (single column on mobile)
- Responsive padding: `px-4 sm:px-6 lg:px-8`
- Touch-friendly buttons and inputs
- Image upload works on mobile devices

### Improvements Needed

1. **Add Viewport Meta Tag** (Important!)
   - Currently missing in `layout.tsx`
   - Needed for proper mobile rendering

2. **Test on Real Devices**
   - Test admin forms on iPhone/Android
   - Verify image upload works
   - Check order management interface

## 🔧 Quick Fix: Add Viewport Meta Tag

I'll add this to ensure proper mobile rendering.

## 📝 GitHub Repository Setup

Since you've already created the repo, here's how to push your code:

```bash
# Initialize git (if not already done)
cd /Users/lionel/Desktop/fusion
git init

# Add remote
git remote add origin https://github.com/DynastyTech/fusion-aura.git

# Add all files
git add .

# Commit
git commit -m "Initial commit: FusionAura e-commerce platform"

# Push to GitHub
git branch -M main
git push -u origin main
```

## ⚠️ Important Notes

1. **Don't commit sensitive data:**
   - Add `.env` to `.gitignore`
   - Don't commit API keys or secrets

2. **GitHub Pages Alternative:**
   - If you really want GitHub Pages, you'd need to:
     - Export Next.js as static (`next export`)
     - Deploy backend separately
     - This loses many features (SSR, API routes, etc.)

3. **Recommended Path:**
   - Deploy to Vercel + Railway now
   - It's free and better suited for your stack
   - You can still use your GoDaddy domain

## 🎯 Next Steps

1. ✅ Add viewport meta tag (I'll do this)
2. ✅ Test mobile responsiveness
3. ✅ Push code to GitHub
4. ✅ Deploy backend to Railway
5. ✅ Deploy frontend to Vercel
6. ✅ Connect GoDaddy domain (when ready)

Would you like me to:
1. Add the viewport meta tag for better mobile support?
2. Create a `.gitignore` file?
3. Set up the deployment configuration files?

