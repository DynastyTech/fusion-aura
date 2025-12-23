# Admin Credentials

## Default Admin Account

**Email:** `admin@fusionaura.com`  
**Password:** `admin123`

## ⚠️ Important Security Note

**Please change this password immediately after first login!**

## How to Create/Update Admin User

### Option 1: Using the Script (Recommended)

```bash
cd packages/db
npm run create-admin
```

This will:
- Create an admin user if it doesn't exist
- Update existing user to ADMIN role if needed
- Use credentials: `admin@fusionaura.com` / `admin123`

### Option 2: Manual Database Update

If you already have a user account:

```bash
docker exec -it fusionaura-postgres psql -U fusionaura -d fusionaura_db -c "UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';"
```

### Option 3: Create via Prisma Studio

```bash
npm run db:studio
```

1. Navigate to Users table
2. Create new user or edit existing
3. Set role to `ADMIN`
4. Password must be hashed (use registration endpoint or create via script)

## Login Instructions

1. Go to http://localhost:3000/login
2. Enter:
   - Email: `admin@fusionaura.com`
   - Password: `admin123`
3. You'll be redirected to `/admin/dashboard`

## Admin Dashboard Features

Once logged in as admin, you can:
- ✅ View all products
- ✅ Add new products
- ✅ Edit existing products
- ✅ Delete products
- ✅ View all orders
- ✅ Accept/Decline orders
- ✅ Update order status (Pending Delivery, Out for Delivery, Completed)

## Change Password

After logging in, you can change your password by:
1. Using the API endpoint (if implemented)
2. Or manually updating in database:
   ```bash
   # Generate new hash (use Node.js)
   node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('newpassword', 10));"
   # Then update in database
   ```

## Troubleshooting

### Can't login
- Verify user exists: Check database or run `npm run create-admin` again
- Check password is correct
- Ensure role is set to `ADMIN` (not `CUSTOMER`)

### Not redirected to admin dashboard
- Check user role in database
- Clear localStorage and re-login
- Verify JWT token is valid

