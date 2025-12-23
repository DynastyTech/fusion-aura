# Quick Deployment Guide for GoDaddy

## 🎯 Recommended: GoDaddy Domain + Modern Hosting

**Why?** GoDaddy shared hosting doesn't support Node.js. Use GoDaddy for your domain, host elsewhere.

## ⚡ 5-Minute Setup

### 1. Push to GitHub (2 minutes)

```bash
cd /Users/lionel/Desktop/fusion
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/DynastyTech/fusion-aura.git
git branch -M main
git push -u origin main
```

### 2. Deploy Frontend to Vercel (2 minutes)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Click "New Project" → Import `fusion-aura`
3. Settings:
   - **Root Directory**: `apps/web`
   - **Framework**: Next.js
4. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.railway.app
   ```
5. Deploy! ✅

### 3. Deploy Backend to Railway (3 minutes)

1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. "New Project" → "Deploy from GitHub" → Select repo
3. Add PostgreSQL database (Railway → New → Database)
4. Settings:
   - **Root Directory**: `apps/api`
5. Add Environment Variables (see `env.example`)
6. Deploy! ✅

### 4. Configure GoDaddy DNS (2 minutes)

In GoDaddy DNS settings:

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: CNAME  
Name: api
Value: your-railway-app.up.railway.app
```

### 5. Update Vercel Domain

In Vercel → Project Settings → Domains:
- Add `yourdomain.com`
- Add `www.yourdomain.com`

## ✅ Done!

Your site will be live at `www.yourdomain.com` in 24-48 hours (DNS propagation).

## 📚 Full Guide

See `GODADDY_DEPLOYMENT.md` for detailed instructions.

