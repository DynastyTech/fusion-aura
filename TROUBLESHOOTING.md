# Troubleshooting Guide

## Migration Lock Timeout Error (P1002)

### Error Message
```
Error: P1002
The database server at `localhost:5432` was reached but timed out.
Context: Timed out trying to acquire a postgres advisory lock
```

### Quick Fix

**Step 1: Clear advisory locks**
```bash
docker exec fusionaura-postgres psql -U fusionaura -d fusionaura_db -c "SELECT pg_advisory_unlock_all();"
```

**Step 2: Run migration from packages/db directory**
```bash
cd packages/db
npx prisma migrate dev
```

**Step 3: If still failing, restart the database**
```bash
cd infra
docker-compose restart postgres
# Wait 10 seconds
cd ../packages/db
npx prisma migrate dev
```

### Why This Happens

PostgreSQL advisory locks are used by Prisma to prevent concurrent migrations. Sometimes these locks can get stuck if:
- A migration process was interrupted
- A database connection was dropped mid-migration
- Multiple migration processes tried to run simultaneously

### Prevention

1. **Always run migrations from the project root:**
   ```bash
   npm run db:migrate
   ```

2. **Don't run multiple migrations at the same time**

3. **If a migration is interrupted, clear locks before retrying**

## Database Connection Issues

### Error: "Environment variable not found: DATABASE_URL"

**Solution:**
1. Ensure `.env` file exists in project root:
   ```bash
   cp env.example .env
   ```

2. Ensure `.env` file exists in `packages/db`:
   ```bash
   cd packages/db
   echo "DATABASE_URL=postgresql://fusionaura:fusionaura_dev@localhost:5432/fusionaura_db" > .env
   ```

### Error: "Can't reach database server"

**Solution:**
1. Check if Docker is running:
   ```bash
   docker ps
   ```

2. Check if PostgreSQL container is running:
   ```bash
   docker ps | grep fusionaura-postgres
   ```

3. Start the container if not running:
   ```bash
   cd infra
   docker-compose up -d postgres
   ```

4. Wait for container to be healthy (check logs):
   ```bash
   docker logs fusionaura-postgres
   ```

## Port Already in Use

### Error: "Bind for 0.0.0.0:5432 failed: port is already allocated"

**Solution:**

**Option 1: Stop local PostgreSQL (if installed via Homebrew)**
```bash
brew services stop postgresql@15
# or
brew services stop postgresql
```

**Option 2: Change Docker port**
Edit `infra/docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Change 5432 to 5433
```

Then update `.env`:
```
DATABASE_URL=postgresql://fusionaura:fusionaura_dev@localhost:5433/fusionaura_db
```

## Migration Already Applied

### Message: "Already in sync, no schema change or pending migration was found"

This is **normal** - it means your database is up to date with your Prisma schema. No action needed.

## Verify Database Setup

### Check if tables exist:
```bash
docker exec fusionaura-postgres psql -U fusionaura -d fusionaura_db -c "\dt"
```

### Check database connection:
```bash
docker exec fusionaura-postgres psql -U fusionaura -d fusionaura_db -c "SELECT version();"
```

### View migration history:
```bash
docker exec fusionaura-postgres psql -U fusionaura -d fusionaura_db -c "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC;"
```

## Reset Database (⚠️ Deletes All Data)

**Only use this if you need to start fresh:**

```bash
# 1. Stop and remove database container with volumes
cd infra
docker-compose down postgres -v

# 2. Remove migration files (optional)
cd ../packages/db
rm -rf prisma/migrations

# 3. Start database again
cd ../../infra
docker-compose up -d postgres

# 4. Wait 15 seconds, then create new migration
cd ..
npm run db:migrate
```

## Common Commands

### Check database status
```bash
docker ps | grep postgres
docker logs fusionaura-postgres
```

### Access PostgreSQL shell
```bash
docker exec -it fusionaura-postgres psql -U fusionaura -d fusionaura_db
```

### View all databases
```bash
docker exec fusionaura-postgres psql -U fusionaura -d postgres -c "\l"
```

### View table structure
```bash
docker exec fusionaura-postgres psql -U fusionaura -d fusionaura_db -c "\d users"
```

## Getting Help

If you continue to experience issues:

1. Check Docker logs: `docker logs fusionaura-postgres`
2. Verify environment variables: `cat .env | grep DATABASE_URL`
3. Test connection manually: `docker exec fusionaura-postgres psql -U fusionaura -d fusionaura_db -c "SELECT 1;"`
4. Check Prisma status: `cd packages/db && npx prisma migrate status`

