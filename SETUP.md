# FusionAura Setup Guide

## Initial Setup Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# This will install dependencies for all workspaces
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp env.example .env

# Edit .env with your actual values
# Minimum required:
# - DATABASE_URL
# - JWT_SECRET (32+ characters)
# - STRIPE_SECRET_KEY
# - STRIPE_PUBLISHABLE_KEY
```

### 3. Start Infrastructure

```bash
cd infra
docker-compose up -d postgres redis meilisearch minio
```

Wait for all services to be healthy (check with `docker-compose ps`).

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed initial data
# You can use Prisma Studio to add data manually:
npm run db:studio
```

### 5. MinIO Setup

1. Access MinIO Console: http://localhost:9001
2. Login with: `fusionaura_minio` / `fusionaura_minio_dev`
3. Create bucket: `fusionaura-uploads`
4. Set bucket policy to allow public read (if needed)

### 6. Start Development Servers

**Option A: Run all with turbo (recommended)**
```bash
npm run dev
```

**Option B: Run individually**

Terminal 1 - Backend API:
```bash
cd apps/api
npm run dev
```

Terminal 2 - Frontend:
```bash
cd apps/web
npm run dev
```

Terminal 3 - Go Order Processor:
```bash
cd services/order-processor
go mod tidy
go run .
```

### 7. Stripe Webhook Setup (Local Development)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks:
   ```bash
   stripe listen --forward-to localhost:8080/webhooks/stripe
   ```
4. Copy the webhook secret (starts with `whsec_`) to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 8. Test the Setup

1. **Health Checks:**
   - API: http://localhost:3001/health
   - Order Processor: http://localhost:8080/health

2. **Create Test User:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123",
       "firstName": "Test",
       "lastName": "User"
     }'
   ```

3. **Login:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "password123"
     }'
   ```

4. **Access Frontend:**
   - Open http://localhost:3000

## Common Issues

### Database Connection Error
- Ensure PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL in `.env`
- Verify credentials match docker-compose.yml

### Prisma Client Not Generated
```bash
cd packages/db
npm run generate
```

### Port Already in Use
- Change ports in `.env` or `docker-compose.yml`
- Kill processes using those ports

### Go Module Errors
```bash
cd services/order-processor
go mod tidy
```

### Stripe Webhook Not Working
- Verify webhook secret matches Stripe CLI output
- Check order processor is running on port 8080
- Verify Stripe CLI is forwarding: `stripe listen --forward-to localhost:8080/webhooks/stripe`

## Next Steps

1. Create categories via API or Prisma Studio
2. Add products with inventory
3. Test cart functionality
4. Test checkout flow with Stripe test cards
5. Verify webhook processing

## Production Deployment

See README.md for production deployment instructions.

