# Starting Development Servers

## Quick Start

From the project root, run:

```bash
npm run dev
```

This will automatically start:
- ✅ API server on `http://localhost:3001`
- ✅ Frontend on `http://localhost:3000`
- ✅ Both services run concurrently using Turborepo

## Prerequisites

Before starting, ensure Docker services are running:

```bash
cd infra
docker-compose up -d postgres redis meilisearch
```

Or start all services at once:

```bash
cd infra
docker-compose up -d
```

## What Happens When You Run `npm run dev`

1. **Turborepo** detects all packages with a `dev` script
2. Runs them **in parallel** (concurrently)
3. Both API and Web servers start automatically
4. Changes are watched and auto-reloaded

## Port Configuration

- **API Server**: `http://localhost:3001`
- **Frontend**: `http://localhost:3000`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Meilisearch**: `http://localhost:7700`

## Troubleshooting

### Port Already in Use

If you see "Port 3000 is in use" or "Port 3001 is in use":

1. **Find and kill the process:**
   ```bash
   # For port 3000 (Frontend)
   lsof -ti:3000 | xargs kill -9
   
   # For port 3001 (API)
   lsof -ti:3001 | xargs kill -9
   ```

2. **Or change the port** in the respective package.json files

### API Not Starting

1. Check if Docker services are running:
   ```bash
   docker ps
   ```

2. Check API logs in the terminal output

3. Verify `.env` file exists and has correct values

### Services Not Running in Parallel

If only one service starts:

1. Check `turbo.json` - it should have `"persistent": true` for dev
2. Verify both `apps/api/package.json` and `apps/web/package.json` have `dev` scripts
3. Try running individually:
   ```bash
   # Terminal 1
   cd apps/api && npm run dev
   
   # Terminal 2
   cd apps/web && npm run dev
   ```

## Alternative: Manual Start

If you prefer to run services separately:

**Terminal 1 - API:**
```bash
cd apps/api
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
npm run dev
```

## Stopping Services

Press `Ctrl+C` in the terminal where `npm run dev` is running. This will stop all services.

To stop Docker services:
```bash
cd infra
docker-compose down
```

