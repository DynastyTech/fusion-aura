# FusionAura E-Commerce Platform

**Sustainable Life, Timeless Remedies, Trusted Care**

A production-ready, scalable, headless e-commerce platform built with Node.js + TypeScript + Go, integrated with Stripe for payments. Tailored for South Africa (ZAR currency).

## 🏗️ Architecture

This is a monorepo containing:

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend API**: Node.js + TypeScript using Fastify
- **Order Processor**: Go microservice for Stripe webhooks and order processing
- **Database**: PostgreSQL with Prisma ORM
- **Search**: Meilisearch (self-hosted)
- **Cache & Sessions**: Redis
- **File Storage**: MinIO (S3-compatible)
- **Payments**: Stripe Checkout + Webhooks

## 📁 Repository Structure

```
/ecommerce-monorepo
├── apps/
│   ├── web/                  # Next.js frontend
│   └── api/                  # Node.js + TypeScript backend
├── services/
│   └── order-processor/      # Go Stripe webhook & worker service
├── packages/
│   ├── db/                   # Prisma schema & migrations
│   ├── types/                # Shared TS types
│   └── ui/                   # Shared UI components
├── infra/
│   └── docker-compose.yml
├── .env.example
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Docker and Docker Compose
- Go 1.21+ (for order processor service)
- Stripe account with API keys

### 1. Clone and Install

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate
```

### 2. Environment Setup

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# Required:
# - DATABASE_URL
# - JWT_SECRET (min 32 characters)
# - STRIPE_SECRET_KEY
# - STRIPE_PUBLISHABLE_KEY
# - STRIPE_WEBHOOK_SECRET
```

### 3. Start Infrastructure Services

```bash
cd infra
docker-compose up -d postgres redis meilisearch minio
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Meilisearch on port 7700
- MinIO on ports 9000 (API) and 9001 (Console)

### 4. Database Setup

```bash
# Run migrations
npm run db:migrate

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

### 5. Start Development Servers

```bash
# Start all services (from root)
npm run dev

# Or start individually:
# Terminal 1: Backend API
cd apps/api && npm run dev

# Terminal 2: Frontend
cd apps/web && npm run dev

# Terminal 3: Go Order Processor
cd services/order-processor && go run .
```

### 6. Access Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Order Processor**: http://localhost:8080
- **Meilisearch**: http://localhost:7700
- **MinIO Console**: http://localhost:9001 (fusionaura_minio / fusionaura_minio_dev)

## 🧪 Stripe Testing

### Test Mode Setup

1. Get your Stripe test keys from https://dashboard.stripe.com/test/apikeys
2. Add them to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### Webhook Testing

For local development, use Stripe CLI:

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Linux: See https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:8080/webhooks/stripe

# This will output a webhook secret, add it to .env:
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### Test Cards

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

## 📚 API Documentation

### Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)

#### Products
- `GET /api/products` - List products (public)
- `GET /api/products/:id` - Get product (public)
- `POST /api/products` - Create product (admin)
- `PATCH /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

#### Categories
- `GET /api/categories` - List categories (public)
- `GET /api/categories/:id` - Get category (public)
- `POST /api/categories` - Create category (admin)
- `PATCH /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

#### Cart
- `GET /api/cart` - Get cart (authenticated)
- `POST /api/cart` - Add to cart (authenticated)
- `PATCH /api/cart/:id` - Update cart item (authenticated)
- `DELETE /api/cart/:id` - Remove from cart (authenticated)
- `DELETE /api/cart` - Clear cart (authenticated)

#### Orders
- `GET /api/orders` - Get user orders (authenticated)
- `GET /api/orders/:id` - Get order (authenticated)
- `GET /api/orders/admin/all` - Get all orders (admin)

#### Payments
- `POST /api/payments/checkout/create-session` - Create Stripe checkout session (authenticated)

#### Inventory
- `GET /api/inventory/product/:productId` - Get inventory (admin)
- `PATCH /api/inventory/product/:productId` - Update inventory (admin)
- `GET /api/inventory/low-stock` - Get low stock items (admin)

## 🗄️ Database Schema

Key models:
- **User**: Customer and admin accounts
- **Product**: Product catalog with pricing (ZAR)
- **Category**: Nested categories
- **Inventory**: Stock management
- **Order**: Order management with status tracking
- **OrderItem**: Order line items
- **Payment**: Payment records linked to Stripe
- **Shipment**: Shipping tracking
- **CartItem**: Shopping cart items

All models use UUIDs and support soft deletes where appropriate.

## 🔒 Security Features

- JWT authentication with Redis session support
- Role-based access control (RBAC)
- Input validation with Zod
- Rate limiting
- Secure headers (Helmet)
- Stripe webhook signature verification
- Environment variable validation
- SQL injection protection (Prisma)
- XSS protection

## 🐳 Docker Deployment

### Full Stack with Docker Compose

```bash
cd infra
docker-compose up -d
```

This starts all services including the API and order processor.

### Individual Services

See `infra/docker-compose.yml` for service configurations.

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests for specific package
cd apps/api && npm test
```

## 📝 Environment Variables

See `.env.example` for all required environment variables.

### Required for Production

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT signing (min 32 chars)
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `MEILISEARCH_MASTER_KEY` - Meilisearch master key
- `MINIO_ACCESS_KEY` - MinIO access key
- `MINIO_SECRET_KEY` - MinIO secret key

## 🛠️ Development

### Adding a New Product

1. Create category (admin):
   ```bash
   POST /api/categories
   {
     "name": "Wellness",
     "slug": "wellness"
   }
   ```

2. Create product (admin):
   ```bash
   POST /api/products
   {
     "name": "Organic Honey",
     "slug": "organic-honey",
     "price": 299.99,
     "categoryId": "<category-id>",
     "initialQuantity": 100
   }
   ```

### Order Flow

1. User adds products to cart
2. User creates checkout session → Stripe Checkout
3. User completes payment on Stripe
4. Webhook received → Order status updated to PAID
5. Inventory decremented
6. Payment record created

## 🌍 South Africa Specific

- Currency: ZAR (South African Rand)
- VAT: 15% (automatically calculated)
- Shipping addresses include SA provinces
- Postal code validation for SA format

## 📦 Production Deployment

1. Set all environment variables
2. Run database migrations: `npm run db:migrate`
3. Build frontend: `cd apps/web && npm run build`
4. Build backend: `cd apps/api && npm run build`
5. Build Go service: `cd services/order-processor && go build`
6. Deploy using Docker or your preferred platform

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For issues and questions, please contact the development team.

---

**FusionAura** - Sustainable Life, Timeless Remedies, Trusted Care

