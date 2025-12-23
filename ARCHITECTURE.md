# FusionAura Architecture

## System Overview

FusionAura is a headless e-commerce platform designed for scalability and maintainability. The architecture follows a microservices pattern with clear separation of concerns.

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Features**: SSR, SEO optimization, Server Components

### Backend API
- **Runtime**: Node.js 18+
- **Framework**: Fastify
- **Language**: TypeScript
- **ORM**: Prisma
- **Authentication**: JWT with Redis sessions
- **Validation**: Zod

### Order Processor
- **Language**: Go 1.21+
- **Purpose**: Stripe webhook processing, order state management, inventory updates
- **Pattern**: Simple HTTP server with async job processing capability

### Infrastructure
- **Database**: PostgreSQL 15
- **Cache/Sessions**: Redis 7
- **Search**: Meilisearch v1.5
- **Storage**: MinIO (S3-compatible)
- **Containerization**: Docker + Docker Compose

### Payments
- **Provider**: Stripe
- **Method**: Stripe Checkout (hosted payment page)
- **Currency**: ZAR (South African Rand)
- **Webhooks**: Signature-verified event processing

## Architecture Diagram

```
┌─────────────────┐
│   Next.js Web   │ (Port 3000)
│   (Frontend)    │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│  Fastify API    │ (Port 3001)
│  (Backend)      │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼───┐ ┌────▼────┐ ┌───▼────┐
│Postgres│ │Redis │ │Meilisearch│ │ MinIO │
└────────┘ └──────┘ └──────────┘ └───────┘

┌─────────────────┐
│ Order Processor │ (Port 8080)
│   (Go Service)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼───┐
│Postgres│ │Redis │
└────────┘ └──────┘
         │
         │ Webhooks
         │
┌────────▼────────┐
│     Stripe      │
└─────────────────┘
```

## Data Flow

### 1. User Registration/Login
```
User → Frontend → API (/api/auth/register|login)
                → Prisma → PostgreSQL
                → JWT Token → Redis (session)
                → Response with Token
```

### 2. Product Browsing
```
User → Frontend → API (/api/products)
                → Prisma → PostgreSQL
                → (Optional) Meilisearch (search)
                → Response
```

### 3. Add to Cart
```
User → Frontend → API (/api/cart) [Auth Required]
                → Prisma → PostgreSQL (CartItem)
                → Response
```

### 4. Checkout Flow
```
User → Frontend → API (/api/payments/checkout/create-session) [Auth]
                → Prisma → Create Order (PENDING)
                → Stripe API → Create Checkout Session
                → Response with Stripe URL
                → User redirected to Stripe
                → User completes payment
                → Stripe → Webhook → Order Processor
                → Order Processor → Update Order (PAID)
                → Order Processor → Decrement Inventory
                → Order Processor → Create Payment Record
```

### 5. Webhook Processing
```
Stripe → Order Processor (/webhooks/stripe)
       → Verify Signature
       → Process Event:
         - checkout.session.completed
         - payment_intent.succeeded
         - charge.failed
       → Update Database
       → Update Inventory
```

## Database Schema

### Core Models

1. **User**: Customer and admin accounts
   - Email, password (hashed), role
   - Stripe customer ID
   - Address fields (SA-specific)

2. **Product**: Product catalog
   - Name, slug, description, price (ZAR)
   - Images, SEO metadata
   - Category relationship

3. **Category**: Nested categories
   - Parent-child relationships
   - Slug for SEO

4. **Inventory**: Stock management
   - Quantity, reserved quantity
   - Low stock threshold

5. **Order**: Order management
   - Status tracking (PENDING → PAID → SHIPPED → DELIVERED)
   - Stripe session/payment intent IDs
   - Totals (subtotal, tax 15%, shipping, total)

6. **OrderItem**: Order line items
   - Product reference, quantity, price at purchase

7. **Payment**: Payment records
   - Linked to orders and Stripe
   - Status tracking

8. **Shipment**: Shipping tracking
   - Status, tracking number, carrier

9. **CartItem**: Shopping cart
   - User-product-quantity mapping

## Security Features

1. **Authentication**
   - JWT tokens with expiration
   - Redis session storage
   - Password hashing (bcrypt)

2. **Authorization**
   - Role-based access control (RBAC)
   - Admin vs Customer roles

3. **Input Validation**
   - Zod schemas for all inputs
   - Type-safe validation

4. **API Security**
   - Rate limiting (100 req/min)
   - CORS configuration
   - Helmet security headers
   - SQL injection protection (Prisma)

5. **Payment Security**
   - Stripe Checkout (no card data stored)
   - Webhook signature verification
   - Only Stripe IDs stored in database

## Scalability Considerations

1. **Database**
   - Indexes on frequently queried fields
   - UUIDs for distributed systems
   - Soft deletes for audit trail

2. **Caching**
   - Redis for sessions
   - Can be extended for product/category caching

3. **Search**
   - Meilisearch for fast, typo-tolerant search
   - Separate from main database

4. **File Storage**
   - MinIO (S3-compatible) for scalability
   - Can migrate to AWS S3 easily

5. **Microservices**
   - Order processor separate from API
   - Can scale independently
   - Async job processing capability

## Error Handling

1. **API Errors**
   - Centralized error handler
   - Consistent error response format
   - Proper HTTP status codes

2. **Webhook Errors**
   - Retry logic (Stripe handles)
   - Idempotent operations
   - Logging for debugging

3. **Database Errors**
   - Transaction rollback on failures
   - Constraint validation

## Monitoring & Logging

1. **Logging**
   - Structured logging (Pino)
   - Request ID tracking
   - Error stack traces (dev only)

2. **Health Checks**
   - `/health` endpoints on all services
   - Database connection checks
   - Redis connection checks

## Development Workflow

1. **Monorepo**
   - Turbo for build orchestration
   - Shared packages (db, types, ui)
   - Workspace dependencies

2. **Local Development**
   - Docker Compose for infrastructure
   - Hot reload for API and frontend
   - Stripe CLI for webhook testing

3. **Testing**
   - Unit tests (structure in place)
   - Integration test capability
   - E2E test capability

## Deployment Strategy

1. **Development**
   - Docker Compose for all services
   - Local development servers

2. **Production**
   - Containerized services
   - Environment variable configuration
   - Database migrations on deploy
   - Separate staging/production environments

## Future Enhancements

1. **Search**
   - Product indexing on create/update
   - Advanced filters
   - Faceted search

2. **Caching**
   - Product list caching
   - Category tree caching

3. **Analytics**
   - Order analytics
   - Product performance metrics

4. **Notifications**
   - Email notifications
   - Order status updates
   - Inventory alerts

5. **Multi-tenant**
   - Support for multiple stores
   - Admin dashboard

## South Africa Specific

1. **Currency**: ZAR (South African Rand)
2. **VAT**: 15% (automatically calculated)
3. **Addresses**: SA province and postal code support
4. **Shipping**: Ready for SA courier integration

