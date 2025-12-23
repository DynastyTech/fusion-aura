# Authentication & User Guide

## Overview

The FusionAura platform now has complete authentication and user management:

- **Customer Login/Registration**: Customers can sign up and purchase products
- **Admin Dashboard**: Admins can manage products (add, edit, delete)
- **Shopping Cart**: Customers can add products to cart and checkout
- **Stripe Integration**: Secure payment processing via Stripe Checkout

## User Roles

### Customer (Default)
- Browse products
- Add products to cart
- Complete purchases
- View order history

### Admin
- All customer features
- Access admin dashboard
- Add new products
- Edit existing products
- Delete products
- Manage inventory

## Getting Started

### 1. Create an Admin User

First, register a user and then manually set them as admin:

```bash
# Register via API or UI
# Then update role in database:
docker exec -it fusionaura-postgres psql -U fusionaura -d fusionaura_db -c "UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';"
```

Or use Prisma Studio:
```bash
npm run db:studio
# Navigate to Users table, edit a user, set role to ADMIN
```

### 2. Login as Admin

1. Go to http://localhost:3000/login
2. Enter your admin email and password
3. You'll be redirected to `/admin/dashboard`

### 3. Login as Customer

1. Go to http://localhost:3000/login
2. Click "Sign up" if you don't have an account
3. Register with email and password
4. You'll be redirected to `/products`

## Admin Features

### Admin Dashboard (`/admin/dashboard`)

- View all products in a table
- See product status (Active/Inactive, Featured)
- Quick access to edit/delete products
- Add new products button

### Add Product (`/admin/products/new`)

Fill in the form:
- Product name (auto-generates slug)
- Category selection
- Price in ZAR
- Stock quantity
- Images (comma-separated URLs)
- Active/Featured toggles

### Edit Product (`/admin/products/[id]/edit`)

- Modify product details
- Update pricing
- Change stock status
- Update images

### Delete Product

- Click "Delete" in the dashboard
- Confirms before deletion (soft delete)

## Customer Features

### Browse Products (`/products`)

- View all available products
- Filter by category (coming soon)
- Search products (coming soon)
- Click product to see details

### Product Details (`/products/[slug]`)

- Full product information
- Add to cart button
- Stock availability
- Price with discounts

### Shopping Cart (`/cart`)

- View all items in cart
- Update quantities
- Remove items
- See subtotal and VAT
- Proceed to checkout

### Checkout (`/checkout`)

1. Enter shipping information
2. Review order summary
3. Click "Proceed to Payment"
4. Redirected to Stripe Checkout
5. Complete payment
6. Redirected to success page

## Authentication Flow

### Registration
1. User fills registration form
2. Password is hashed (bcrypt)
3. User created with CUSTOMER role
4. JWT token generated
5. Token stored in localStorage
6. Redirect based on role

### Login
1. User enters email/password
2. Password verified
3. JWT token generated
4. Token stored in localStorage
5. User data stored
6. Redirect based on role

### Protected Routes

Routes that require authentication:
- `/cart` - Redirects to `/login` if not authenticated
- `/checkout` - Redirects to `/login` if not authenticated
- `/admin/*` - Requires ADMIN role

## API Endpoints Used

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Products (Public)
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get single product

### Products (Admin)
- `POST /api/products` - Create product
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Cart (Authenticated)
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PATCH /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove item

### Checkout (Authenticated)
- `POST /api/payments/checkout/create-session` - Create Stripe checkout

## Security Features

1. **JWT Authentication**: Secure token-based auth
2. **Password Hashing**: bcrypt with salt rounds
3. **Role-Based Access**: Admin vs Customer permissions
4. **Protected Routes**: Frontend route guards
5. **API Authorization**: Backend middleware checks
6. **Stripe Security**: No card data stored locally

## Testing

### Test Admin Flow
1. Create admin user (via database)
2. Login at `/login`
3. Access `/admin/dashboard`
4. Add a product
5. Edit the product
6. Delete a product

### Test Customer Flow
1. Register at `/login` (click Sign up)
2. Browse products at `/products`
3. Click a product to see details
4. Add to cart
5. View cart at `/cart`
6. Proceed to checkout
7. Enter shipping info
8. Complete payment (Stripe test mode)

## Troubleshooting

### "Unauthorized" errors
- Check if token exists: `localStorage.getItem('token')`
- Token may have expired (default: 7 days)
- Re-login to get new token

### Admin dashboard not accessible
- Verify user role is ADMIN in database
- Check JWT token is valid
- Clear localStorage and re-login

### Cart not working
- Ensure user is logged in
- Check API is running on port 3001
- Verify cart endpoint returns data

### Checkout fails
- Verify Stripe keys in `.env`
- Check shipping address is complete
- Ensure cart has items

## Next Steps

- [ ] Order history page for customers
- [ ] Order management for admins
- [ ] Email notifications
- [ ] Password reset functionality
- [ ] User profile management
- [ ] Product image upload (MinIO integration)
- [ ] Search and filters
- [ ] Product reviews

