# How to Start the API Server

## Quick Fix

The API wasn't starting because `nodemailer` was missing. It's now installed.

## Start the API

### Option 1: Start Everything (Recommended)

From project root:
```bash
npm run dev
```

This starts both frontend and API.

### Option 2: Start API Only

```bash
cd apps/api
npm run dev
```

## Verify API is Running

You should see:
```
🚀 FusionAura API server running on port 3001
```

Test it:
```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok","timestamp":"..."}`

## Common Issues Fixed

### ✅ Missing nodemailer
- **Fixed:** Installed `nodemailer` and `@types/nodemailer`

### ⚠️ Environment Variables Warnings
These are just warnings, not errors:
- `DATABASE_URL is not set` - Check `.env` file
- `JWT_SECRET is not set` - Check `.env` file
- `STRIPE_SECRET_KEY is not set` - Optional for now

The API will still work, but some features may be limited.

## After API Starts

1. ✅ API running on port 3001
2. ✅ Login will work at http://localhost:3000/login
3. ✅ Admin credentials: `admin@fusionaura.com` / `admin123`

## Troubleshooting

### Port 3001 Already in Use
```bash
lsof -ti:3001 | xargs kill -9
npm run dev
```

### Database Connection Error
```bash
cd infra
docker-compose up -d postgres
```

### Module Not Found Errors
```bash
cd apps/api
npm install
```

## Status Check

```bash
# Check API
curl http://localhost:3001/health

# Check if process is running
lsof -ti:3001

# Check database
docker ps | grep postgres
```

