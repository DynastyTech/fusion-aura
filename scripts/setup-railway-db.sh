#!/bin/bash

# Script to set up Railway Postgres database
# This script runs migrations and seeds the database

set -e

echo "🚀 Setting up Railway Postgres database..."

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

# Navigate to db package
cd "$(dirname "$0")/../packages/db"

echo "📦 Running database migrations..."
railway run -- npm run migrate:deploy

echo "🌱 Seeding database with sample data..."
railway run -- npm run seed

echo "✅ Database setup complete!"
echo ""
echo "📊 You can now:"
echo "   - View your database in Railway dashboard"
echo "   - Check that tables were created"
echo "   - Verify sample products were added"

