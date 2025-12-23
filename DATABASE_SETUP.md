# Database Setup Instructions

## Step-by-Step Database Setup

### Step 1: Start Docker Desktop

1. Open Docker Desktop application on your Mac
2. Wait for Docker to fully start (you'll see a green icon in the menu bar)
3. Verify Docker is running:
   ```bash
   docker --version
   docker ps
   ```

### Step 2: Start PostgreSQL Database Container

From the project root directory:

```bash
cd /Users/lionel/Desktop/fusion/infra
docker-compose up -d postgres
```

This will:
- Download the PostgreSQL 15 image (first time only)
- Create a container named `fusionaura-postgres`
- Start PostgreSQL on port 5432
- Create the database `fusionaura_db`
- Set up user `fusionaura` with password `fusionaura_dev`

### Step 3: Verify Database is Running

Check that the container is running:

```bash
docker ps | grep fusionaura-postgres
```

You should see output like:
```
CONTAINER ID   IMAGE                STATUS         PORTS                    NAMES
abc123def456   postgres:15-alpine   Up 2 minutes   0.0.0.0:5432->5432/tcp   fusionaura-postgres
```

### Step 4: Wait for Database to be Ready

The database needs a few seconds to initialize. Check the logs:

```bash
docker logs fusionaura-postgres
```

Wait until you see:
```
database system is ready to accept connections
```

### Step 5: Test Database Connection (Optional)

You can test the connection manually:

```bash
# Using psql (if installed)
psql postgresql://fusionaura:fusionaura_dev@localhost:5432/fusionaura_db -c "SELECT version();"

# Or using docker exec
docker exec -it fusionaura-postgres psql -U fusionaura -d fusionaura_db -c "SELECT version();"
```

### Step 6: Run Database Migrations

Now that the database is running, go back to the project root and run migrations:

```bash
cd /Users/lionel/Desktop/fusion
npm run db:migrate
```

This will:
- Create all the database tables
- Set up indexes
- Create the initial migration files

### Step 7: Verify Tables Were Created

You can verify the tables were created:

```bash
docker exec -it fusionaura-postgres psql -U fusionaura -d fusionaura_db -c "\dt"
```

You should see tables like: `users`, `products`, `categories`, `orders`, etc.

## Troubleshooting

### Docker is not running
**Error**: `Cannot connect to the Docker daemon`

**Solution**: 
1. Open Docker Desktop
2. Wait for it to fully start
3. Try the command again

### Port 5432 is already in use
**Error**: `Bind for 0.0.0.0:5432 failed: port is already allocated`

**Solution**: 
1. Check if PostgreSQL is already running:
   ```bash
   lsof -i :5432
   ```
2. Either stop the existing PostgreSQL service, or change the port in `infra/docker-compose.yml`

### Container won't start
**Error**: Container exits immediately

**Solution**:
1. Check logs:
   ```bash
   docker logs fusionaura-postgres
   ```
2. Remove and recreate:
   ```bash
   docker-compose -f infra/docker-compose.yml down postgres
   docker-compose -f infra/docker-compose.yml up -d postgres
   ```

### Migration fails with connection error
**Error**: `Can't reach database server`

**Solution**:
1. Verify container is running: `docker ps | grep postgres`
2. Check DATABASE_URL in `.env` matches docker-compose.yml
3. Wait a bit longer for database to initialize
4. Check container logs: `docker logs fusionaura-postgres`

## Database Connection Details

- **Host**: localhost
- **Port**: 5432
- **Database**: fusionaura_db
- **User**: fusionaura
- **Password**: fusionaura_dev
- **Connection String**: `postgresql://fusionaura:fusionaura_dev@localhost:5432/fusionaura_db`

## Useful Commands

### Stop Database
```bash
cd infra
docker-compose stop postgres
```

### Start Database
```bash
cd infra
docker-compose start postgres
```

### View Database Logs
```bash
docker logs fusionaura-postgres
```

### Access PostgreSQL Shell
```bash
docker exec -it fusionaura-postgres psql -U fusionaura -d fusionaura_db
```

### Remove Database (⚠️ Deletes all data)
```bash
cd infra
docker-compose down postgres -v
```

### Reset Database (⚠️ Deletes all data and recreates)
```bash
cd infra
docker-compose down postgres -v
docker-compose up -d postgres
cd ..
npm run db:migrate
```

## Next Steps

After database setup:
1. ✅ Database is running
2. ✅ Migrations are complete
3. Start other services (Redis, Meilisearch, MinIO)
4. Start the API server
5. Start the frontend

