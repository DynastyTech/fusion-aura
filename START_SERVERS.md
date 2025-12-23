# How to Start the Servers

## Quick Start

To see your products on the website, you need to start both the frontend and API servers.

### Option 1: Start Everything at Once (Recommended)

From the project root directory:

```bash
npm run dev
```

This will start:
- ✅ Frontend (Next.js) on http://localhost:3000
- ✅ Backend API (Fastify) on http://localhost:3001

### Option 2: Start Individually

**Terminal 1 - Backend API:**
```bash
cd apps/api
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
npm run dev
```

## Verify Everything is Running

### Check API Health
```bash
curl http://localhost:3001/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### Check Products Endpoint
```bash
curl http://localhost:3001/api/products
```

Should return a JSON array with your products.

### Check Frontend
Open http://localhost:3000/products in your browser.

## Troubleshooting

### "API is not running" Error

**Solution:** Start the API server:
```bash
npm run dev
```

### "No products found" Error

**Check 1: Are products in the database?**
```bash
cd packages/db
npm run seed
```

**Check 2: Is the API responding?**
```bash
curl http://localhost:3001/api/products
```

**Check 3: Check API logs**
Look at the terminal where you ran `npm run dev` - check for errors.

### Port Already in Use

If you get "port already in use" error:

**Kill existing processes:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

Then restart:
```bash
npm run dev
```

### Database Connection Errors

Make sure PostgreSQL is running:
```bash
cd infra
docker-compose ps postgres
```

If not running:
```bash
docker-compose up -d postgres
```

### Redis Connection Errors

Make sure Redis is running:
```bash
cd infra
docker-compose ps redis
```

If not running:
```bash
docker-compose up -d redis
```

## Expected Output

When you run `npm run dev`, you should see:

```
@fusionaura/api:dev: 🚀 FusionAura API server running on port 3001
@fusionaura/web:dev: ▲ Next.js 14.2.35
@fusionaura/web:dev:   - Local:        http://localhost:3000
@fusionaura/web:dev:  ✓ Ready in X.Xs
```

## Next Steps

Once servers are running:
1. ✅ Open http://localhost:3000/products
2. ✅ You should see all 6 products
3. ✅ Click on any product to see details
4. ✅ Test the shopping experience!

