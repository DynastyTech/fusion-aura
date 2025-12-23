# API Server Start Guide

## ✅ Fixed Issues

1. **Missing nodemailer** - ✅ Installed
2. **Email import errors** - ✅ Made optional
3. **Database connection** - ✅ Verified

## Start the API Server

### From Project Root (Recommended)

```bash
npm run dev
```

This starts:
- ✅ Frontend on http://localhost:3000
- ✅ API on http://localhost:3001

### Or Start API Separately

```bash
cd apps/api
npm run dev
```

## What You Should See

When the API starts successfully, you'll see:

```
@fusionaura/api:dev: 🚀 FusionAura API server running on port 3001
```

## Verify API is Running

```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok","timestamp":"..."}`

## Test Login

Once API is running:

1. Go to http://localhost:3000/login
2. Enter:
   - Email: `admin@fusionaura.com`
   - Password: `admin123`
3. Click "Sign in"
4. ✅ Should redirect to `/admin/dashboard`

## If API Still Won't Start

### Check for Errors

Look at the terminal output. Common issues:

1. **Port 3001 in use:**
   ```bash
   lsof -ti:3001 | xargs kill -9
   npm run dev
   ```

2. **Database not running:**
   ```bash
   cd infra
   docker-compose up -d postgres
   ```

3. **Missing dependencies:**
   ```bash
   cd apps/api
   npm install
   ```

4. **Environment variables:**
   ```bash
   # Check .env exists
   cat .env | grep DATABASE_URL
   ```

### Check Logs

The API will show errors in the terminal. Common messages:
- `⚠️ Warning: DATABASE_URL is not set` - Check `.env` file
- `⚠️ Warning: JWT_SECRET is not set` - Check `.env` file
- `Error: Cannot find module` - Run `npm install` in `apps/api`

## Quick Status Check

```bash
# Check if API is running
curl http://localhost:3001/health

# Check if port is in use
lsof -ti:3001

# Check database
docker ps | grep postgres

# Check processes
ps aux | grep "tsx.*api"
```

## Summary

**The API should now start successfully!**

All dependencies are installed:
- ✅ nodemailer
- ✅ All other packages

Just run `npm run dev` and wait for the API to start! 🚀

