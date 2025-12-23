# Quick Fix: API Not Running

## Problem
Your products page shows "No products found" because the API server is not running on port 3001.

## Solution

### Step 1: Stop Current Processes (if any)

Press `Ctrl+C` in the terminal where `npm run dev` is running (if it's running).

### Step 2: Start the Servers

Run this command from the project root:

```bash
npm run dev
```

### Step 3: Wait for Both Servers to Start

You should see output like:

```
@fusionaura/api:dev: 🚀 FusionAura API server running on port 3001
@fusionaura/web:dev: ✓ Ready in X.Xs
@fusionaura/web:dev:   - Local:        http://localhost:3000
```

### Step 4: Verify API is Working

Open a new terminal and test:

```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### Step 5: Refresh Your Browser

Go to http://localhost:3000/products and refresh the page.

You should now see all 6 products! 🎉

## If API Still Doesn't Start

### Check for Errors

Look at the terminal output for error messages. Common issues:

1. **Port 3001 already in use:**
   ```bash
   lsof -ti:3001 | xargs kill -9
   npm run dev
   ```

2. **Database connection error:**
   ```bash
   cd infra
   docker-compose up -d postgres redis
   ```

3. **Missing environment variables:**
   - Make sure `.env` file exists in project root
   - Check that `DATABASE_URL` is set

### Manual API Start

If `npm run dev` doesn't work, try starting API manually:

```bash
cd apps/api
npm run dev
```

Then in another terminal:
```bash
cd apps/web
npm run dev
```

## Still Having Issues?

1. Check API logs for errors
2. Verify database is running: `docker ps | grep postgres`
3. Check `.env` file has correct `DATABASE_URL`
4. Try restarting everything:
   ```bash
   # Stop all
   pkill -f "node|tsx|next"
   
   # Start fresh
   npm run dev
   ```

