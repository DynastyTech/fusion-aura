# GoDaddy Deployment Guide for FusionAura

## ⚠️ Important: GoDaddy Hosting Limitations

**GoDaddy shared hosting does NOT support Node.js applications.** Your FusionAura platform requires:
- Node.js 18+ runtime
- PostgreSQL database
- Ability to run background processes
- Environment variables configuration

## 🎯 Recommended Approach: Hybrid Setup

**Best Option: Use GoDaddy Domain + External Hosting**

1. **Keep your domain on GoDaddy** (manage DNS there)
2. **Host application on modern platforms** that support Node.js:
   - **Frontend (Next.js)**: Vercel (free tier, perfect for Next.js)
   - **Backend API**: Railway or Render (free/paid tiers)
   - **Database**: Supabase or Railway PostgreSQL (free tiers available)

This gives you:
- ✅ Full control over your GoDaddy domain
- ✅ Modern hosting with Node.js support
- ✅ Better performance and reliability
- ✅ Free SSL certificates
- ✅ Easy deployments

## 📋 Deployment Options

### Option 1: GoDaddy Domain + External Hosting (RECOMMENDED)

#### Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add GitHub remote
git remote add origin https://github.com/DynastyTech/fusion-aura.git

# Add all files
git add .

# Commit
git commit -m "Initial commit - FusionAura e-commerce platform"

# Push to GitHub
git push -u origin main
```

#### Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Import your `fusion-aura` repository
5. Configure:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (or `cd apps/web && npm run build`)
   - **Output Directory**: `.next`

6. Add Environment Variables:
```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

7. Deploy! Vercel will give you a URL like `fusion-aura.vercel.app`

#### Step 3: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `fusion-aura` repository
5. Configure:
   - **Root Directory**: `apps/api`
   - **Start Command**: `npm start` (or `node dist/index.js`)

6. Add PostgreSQL Database:
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will provide `DATABASE_URL` automatically

7. Add Environment Variables:
```env
DATABASE_URL=<auto-provided-by-railway>
JWT_SECRET=your-super-secret-production-key-min-32-chars
NODE_ENV=production
API_PORT=3001
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=lraseemela@gmail.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GOOGLE_MAPS_API_KEY=your_google_maps_key
MEILISEARCH_HOST=<optional-if-not-using-search>
```

8. Railway will give you a URL like `fusion-aura-api.up.railway.app`

#### Step 4: Configure GoDaddy DNS

1. Log into GoDaddy
2. Go to "My Products" → "DNS" for your domain
3. Add/Update DNS records:

**For Frontend (www.yourdomain.com):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 600
```

**For API (api.yourdomain.com):**
```
Type: CNAME
Name: api
Value: your-railway-domain.up.railway.app
TTL: 600
```

**For Root Domain (yourdomain.com):**
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel's IP - check Vercel docs for current IP)
TTL: 600
```

4. Wait 24-48 hours for DNS propagation

#### Step 5: Update Environment Variables

Update `NEXT_PUBLIC_API_URL` in Vercel to use your custom domain:
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Option 2: GoDaddy VPS Hosting

If you want everything on GoDaddy, you'll need a **VPS (Virtual Private Server)**:

#### Requirements:
- GoDaddy VPS with cPanel or Plesk
- SSH access
- Node.js 18+ installed
- PostgreSQL database (may need separate hosting)

#### Steps:

1. **Purchase GoDaddy VPS** (starts around $5-10/month)

2. **SSH into your VPS:**
```bash
ssh username@your-vps-ip
```

3. **Install Node.js 18+:**
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

4. **Install PostgreSQL:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

5. **Clone your repository:**
```bash
cd /var/www
git clone https://github.com/DynastyTech/fusion-aura.git
cd fusion-aura
```

6. **Install dependencies:**
```bash
npm install
```

7. **Set up environment variables:**
```bash
cp env.example .env
nano .env  # Edit with your production values
```

8. **Build the application:**
```bash
npm run build
cd apps/api && npm run build
cd ../web && npm run build
```

9. **Set up database:**
```bash
cd packages/db
npx prisma migrate deploy
npx prisma db seed  # Optional: seed initial data
```

10. **Install PM2 (Process Manager):**
```bash
sudo npm install -g pm2

# Start API
cd apps/api
pm2 start dist/index.js --name "fusion-aura-api"

# Start frontend (if running standalone)
cd apps/web
pm2 start npm --name "fusion-aura-web" -- start

# Save PM2 configuration
pm2 save
pm2 startup  # Follow instructions to enable on boot
```

11. **Set up Nginx reverse proxy:**
```bash
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/fusion-aura
```

Add configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/fusion-aura /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

12. **Set up SSL with Let's Encrypt:**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 🔧 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All environment variables are set
- [ ] Database is migrated (`npx prisma migrate deploy`)
- [ ] Cloudinary is configured (images already hosted)
- [ ] SMTP email is configured
- [ ] Google Maps API key is set (optional)
- [ ] JWT_SECRET is strong and unique
- [ ] All sensitive data is in `.env` (not committed to Git)

## 📝 GitHub Repository Setup

### Initial Push to GitHub

```bash
# Make sure .gitignore is in place (already exists)
git init
git add .
git commit -m "Initial commit - FusionAura e-commerce platform"

# Add GitHub remote
git remote add origin https://github.com/DynastyTech/fusion-aura.git

# Push to main branch
git branch -M main
git push -u origin main
```

### .gitignore is Already Configured

Your `.gitignore` already excludes:
- `.env` files (sensitive data)
- `node_modules/`
- Build artifacts
- IDE files

## 🌐 Domain Configuration

### Using GoDaddy Domain with External Hosting

1. **Point DNS to Vercel:**
   - In GoDaddy DNS settings
   - Add CNAME: `www` → `cname.vercel-dns.com`
   - Add A record: `@` → Vercel IP (check Vercel docs)

2. **Point API subdomain:**
   - Add CNAME: `api` → `your-railway-domain.up.railway.app`

3. **Configure in Vercel:**
   - Go to Project Settings → Domains
   - Add `yourdomain.com` and `www.yourdomain.com`
   - Vercel will provide DNS records if needed

## 🔒 Security Checklist

- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Enable HTTPS (automatic with Vercel/Railway)
- [ ] Set `NODE_ENV=production`
- [ ] Review CORS settings
- [ ] Enable rate limiting
- [ ] Use environment variables for all secrets
- [ ] Regular database backups

## 📊 Monitoring & Maintenance

### Recommended Tools:
- **Uptime Monitoring**: UptimeRobot (free)
- **Error Tracking**: Sentry (free tier)
- **Analytics**: Google Analytics
- **Database Backups**: Automated with Railway/Supabase

## 🚨 Troubleshooting

### DNS Not Working
- Wait 24-48 hours for propagation
- Use `dig yourdomain.com` to check DNS
- Clear DNS cache: `sudo dscacheutil -flushcache` (Mac)

### API Not Connecting
- Check `NEXT_PUBLIC_API_URL` matches your API domain
- Verify CORS settings in API
- Check API logs in Railway dashboard

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is accessible from hosting platform
- Ensure database allows connections from hosting IP

## 💰 Cost Estimate

### Option 1 (Recommended - External Hosting):
- **Domain**: $10-15/year (GoDaddy)
- **Frontend (Vercel)**: FREE (hobby tier)
- **Backend (Railway)**: FREE (hobby tier, $5/month after)
- **Database (Supabase)**: FREE (up to 500MB)
- **Total**: ~$10-20/year initially

### Option 2 (GoDaddy VPS):
- **Domain**: $10-15/year
- **VPS**: $5-10/month
- **Database**: Included or separate
- **Total**: ~$70-130/year

## ✅ Quick Start Summary

**Fastest Path to Production:**

1. Push to GitHub ✅
2. Deploy frontend to Vercel (5 minutes)
3. Deploy backend to Railway (10 minutes)
4. Set up database on Railway (5 minutes)
5. Configure GoDaddy DNS (5 minutes)
6. Wait for DNS propagation (24-48 hours)

**Total time: ~1 hour of work + DNS wait**

## 📚 Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs)
- [Railway Deployment Docs](https://docs.railway.app)
- [GoDaddy DNS Management](https://www.godaddy.com/help/manage-dns-680)
- [Next.js Production Deployment](https://nextjs.org/docs/deployment)

---

**Recommendation**: Use Option 1 (GoDaddy Domain + External Hosting) for the best experience, performance, and ease of maintenance.

