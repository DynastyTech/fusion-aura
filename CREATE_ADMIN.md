# Create Admin User - Quick Guide

## Admin Credentials

**Email:** `admin@fusionaura.com`  
**Password:** `admin123`

## Quick Setup (Once Database is Running)

### Step 1: Start Database

```bash
cd infra
docker-compose up -d postgres
```

Wait 10-15 seconds for it to start.

### Step 2: Create Admin User

**Option A: Using the Script (Recommended)**

```bash
cd packages/db
npm run create-admin
```

**Option B: Using SQL Directly**

```bash
docker exec -it fusionaura-postgres psql -U fusionaura -d fusionaura_db
```

Then run this SQL:

```sql
-- Check if admin exists
SELECT email, role FROM users WHERE email = 'admin@fusionaura.com';

-- If it doesn't exist, create it (password hash for 'admin123')
INSERT INTO users (id, email, password, "firstName", "lastName", role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@fusionaura.com',
  '$2a$10$qiaqW/nxUAvdhLc12EIc7urR04J5GVijHbAH4H9FlKZMRBHBhqM..',
  'Admin',
  'User',
  'ADMIN',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET role = 'ADMIN';

-- Verify
SELECT email, role, "firstName", "lastName" FROM users WHERE email = 'admin@fusionaura.com';
```

**Option C: Update Existing User to Admin**

If you already registered a user and want to make them admin:

```bash
docker exec -it fusionaura-postgres psql -U fusionaura -d fusionaura_db -c "UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';"
```

## Login

1. Go to http://localhost:3000/login
2. Enter:
   - **Email:** `admin@fusionaura.com`
   - **Password:** `admin123`
3. You'll be redirected to `/admin/dashboard`

## ⚠️ Security Reminder

**Change the password after first login!** The default password is for development only.

## Verify Admin Access

After logging in, you should see:
- Admin Dashboard link in header
- Access to `/admin/dashboard`
- Ability to add/edit/delete products
- Order management features

