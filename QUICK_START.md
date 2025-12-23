# Quick Start Guide

## 🚀 Start Everything with One Command

From the project root:

```bash
npm run dev
```

This automatically starts:
- ✅ **API Server** on `http://localhost:3001`
- ✅ **Frontend** on `http://localhost:3000`
- ✅ Both run **in parallel** using Turborepo

## 📋 Prerequisites

Before running `npm run dev`, ensure Docker services are running:

```bash
# Start Docker services (PostgreSQL, Redis, Meilisearch)
cd infra
docker-compose up -d

# Or start only essential services:
docker-compose up -d postgres redis meilisearch
```

## ✅ Verify Everything is Running

After running `npm run dev`, you should see:

1. **API Server** output:
   ```
   🚀 FusionAura API server running on port 3001
   ```

2. **Frontend** output:
   ```
   ▲ Next.js 14.2.35
   - Local:        http://localhost:3000
   ```

3. **Test the API**:
   ```bash
   curl http://localhost:3001/health
   # Should return: {"status":"ok","timestamp":"..."}
   ```

4. **Open in browser**:
   - Frontend: http://localhost:3000
   - API Health: http://localhost:3001/health

## 🔧 Available Commands

### Development
- `npm run dev` - Start both API and Frontend
- `npm run dev:api` - Start only API server
- `npm run dev:web` - Start only Frontend

### Docker
- `npm run docker:up` - Start all Docker services
- `npm run docker:down` - Stop all Docker services
- `npm run docker:logs` - View Docker logs

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## 🐛 Troubleshooting

### Port Already in Use

If you see port conflicts:

```bash
# Kill process on port 3000 (Frontend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001 (API)
lsof -ti:3001 | xargs kill -9
```

### API Not Starting

1. Check Docker services:
   ```bash
   docker ps
   ```

2. Check if `.env` file exists in root directory

3. Verify API logs in terminal output

### Only One Service Starts

Turborepo should run both in parallel. If only one starts:

1. Check `turbo.json` - should have `"parallel": true`
2. Try stopping and restarting:
   ```bash
   # Press Ctrl+C to stop
   # Then restart
   npm run dev
   ```

## 📝 Notes

- **Turborepo** automatically detects and runs all `dev` scripts in parallel
- Both services watch for file changes and auto-reload
- Press `Ctrl+C` to stop all services
- API requires Docker services (PostgreSQL, Redis, Meilisearch) to be running
