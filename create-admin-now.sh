#!/bin/bash
# Quick script to create admin user

echo "Creating admin user..."

# Generate password hash
HASH=$(node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10));")

# Create admin user
docker exec fusionaura-postgres psql -U fusionaura -d fusionaura_db << SQL
INSERT INTO users (id, email, password, "firstName", "lastName", role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@fusionaura.com',
  '$HASH',
  'Admin',
  'User',
  'ADMIN',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET role = 'ADMIN';
SELECT email, role FROM users WHERE email = 'admin@fusionaura.com';
SQL

echo ""
echo "✅ Admin user created!"
echo "📧 Email: admin@fusionaura.com"
echo "🔑 Password: admin123"
