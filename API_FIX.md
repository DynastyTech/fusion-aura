# API Startup Fix

## Issue Fixed

The API was not starting due to a version mismatch:
- `@fastify/multipart@^9.3.0` requires Fastify v5
- But we have Fastify v4.29.1 installed

## Solution

Downgraded `@fastify/multipart` to version `7.6.0` which is compatible with Fastify v4.

## Verification

After the fix, running `npm run dev` should:
1. ✅ Start API server on `http://localhost:3001`
2. ✅ Start Frontend on `http://localhost:3000`
3. ✅ Both services run in parallel via Turborepo

## Test

```bash
# From project root
npm run dev

# In another terminal, verify both are running:
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}

curl http://localhost:3000
# Should return HTML from Next.js
```

## If API Still Doesn't Start

1. Check Docker services are running:
   ```bash
   cd infra
   docker-compose up -d postgres redis meilisearch
   ```

2. Check `.env` file exists in root with:
   - `DATABASE_URL`
   - `JWT_SECRET`

3. Check API logs for errors:
   ```bash
   cd apps/api
   npm run dev
   ```

