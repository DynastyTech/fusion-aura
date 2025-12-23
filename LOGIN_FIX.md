# Fix Login Issues

## Problem
- "Failed to fetch" error on login page
- Cannot log in as admin

## Root Causes
1. **API Server Not Running** - The backend API must be running for login to work
2. **Admin User Not Created** - Admin user needs to be created in database

## Solution

### Step 1: Verify Database is Running ✅

```bash
docker ps | grep postgres
```

Should show: `fusionaura-postgres` with status "Up"

### Step 2: Create Admin User ✅

The admin user has been created with:
- **Email:** `admin@fusionaura.com`
- **Password:** `admin123`

### Step 3: Start the API Server ⚠️ **REQUIRED**

**This is the main issue!** The API must be running for login to work.

```bash
# From project root
npm run dev
```

Or start API separately:
```bash
cd apps/api
npm run dev
```

You should see:
```
🚀 FusionAura API server running on port 3001
```

### Step 4: Verify API is Running

Open a new terminal and test:
```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### Step 5: Try Login Again

1. Go to http://localhost:3000/login
2. Enter:
   - Email: `admin@fusionaura.com`
   - Password: `admin123`
3. Click "Sign in"

## Quick Checklist

- [ ] Database is running (`docker ps | grep postgres`)
- [ ] Admin user exists (run the create-admin script)
- [ ] API server is running (`npm run dev`)
- [ ] API responds (`curl http://localhost:3001/health`)
- [ ] Frontend is running (http://localhost:3000)

## If Still Not Working

### Check Browser Console
Open browser DevTools (F12) → Console tab
Look for error messages

### Check API Logs
Look at the terminal where `npm run dev` is running
Check for error messages

### Verify Environment Variables
```bash
cat .env | grep -E "DATABASE_URL|JWT_SECRET"
```

Both should be set.

## Admin Credentials (Confirmed)

**Email:** `admin@fusionaura.com`  
**Password:** `admin123`

These credentials are now in the database and ready to use once the API is running!

