#!/bin/bash

# Script to run database migrations on Railway Postgres
# This script gets the DATABASE_URL from Railway and runs migrations locally

set -e

echo "🚀 Running Railway database migrations..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed."
    echo "📦 Install it with: npm install -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Not logged in to Railway. Logging in..."
    railway login
fi

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if linked
if ! railway status &> /dev/null; then
    echo "🔗 Linking to Railway project..."
    railway link
fi

echo "📋 Getting DATABASE_URL from Railway..."
echo ""
echo "⚠️  IMPORTANT: Use DATABASE_PUBLIC_URL (not DATABASE_URL)!"
echo "   Railway provides two URLs:"
echo "   - DATABASE_URL: Internal (postgres.railway.internal) - won't work locally"
echo "   - DATABASE_PUBLIC_URL: Public (switchback.proxy.rlwy.net) - use this one!"
echo ""
echo "   Get it from Railway dashboard:"
echo "   1. Go to Railway dashboard → Your Postgres service"
echo "   2. Click 'Variables' tab"
echo "   3. Copy the DATABASE_PUBLIC_URL value (or DATABASE_URL if no public URL)"
echo ""
read -p "📝 Paste your DATABASE_PUBLIC_URL here (or press Enter to try Railway CLI method): " DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo ""
    echo "🔄 Trying to get DATABASE_URL from Railway CLI..."
    
    # Try to get DATABASE_URL from Railway
    # Note: This might not work if Railway uses internal hostnames
    export DATABASE_URL=$(railway variables --json 2>/dev/null | grep -o '"DATABASE_URL":"[^"]*' | cut -d'"' -f4 || echo "")
    
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ Could not get DATABASE_URL automatically."
        echo ""
        echo "📋 Please get it manually from Railway dashboard:"
        echo "   1. Railway dashboard → Postgres service → Variables tab"
        echo "   2. Copy the DATABASE_URL"
        echo "   3. Run: export DATABASE_URL='your-url' && cd packages/db && npm run migrate:deploy"
        exit 1
    fi
fi

# Check if DATABASE_URL looks valid
if [[ ! "$DATABASE_URL" =~ ^postgresql:// ]]; then
    echo "❌ Invalid DATABASE_URL format. Should start with 'postgresql://'"
    exit 1
fi

echo "✅ Using DATABASE_URL: ${DATABASE_URL:0:30}..." # Show first 30 chars only

# Navigate to db package
cd packages/db

# Run migrations
echo ""
echo "📦 Running database migrations..."
export DATABASE_URL
npm run migrate:deploy

echo ""
echo "✅ Migrations completed successfully!"
echo ""
read -p "🌱 Do you want to seed the database with sample data? (y/n): " SEED_ANSWER

if [[ "$SEED_ANSWER" =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npm run seed
    echo "✅ Database seeded successfully!"
fi

echo ""
echo "🎉 Database setup complete!"

