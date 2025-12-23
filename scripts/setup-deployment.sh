#!/bin/bash

# Automated Deployment Setup Script
# This script helps set up Railway and Vercel deployments

set -e

echo "🚀 FusionAura Deployment Setup"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
else
    echo -e "${GREEN}✅ Railway CLI found${NC}"
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
else
    echo -e "${GREEN}✅ Vercel CLI found${NC}"
fi

echo ""
echo "📋 Setup Steps:"
echo ""
echo "1. Railway Setup:"
echo "   - Run: railway login"
echo "   - Run: railway link"
echo "   - Add PostgreSQL: railway add postgresql"
echo ""
echo "2. Vercel Setup:"
echo "   - Run: cd apps/web && vercel login"
echo "   - Run: vercel link"
echo ""
echo "3. GitHub Secrets:"
echo "   - Go to: GitHub Repo → Settings → Secrets → Actions"
echo "   - Add: RAILWAY_TOKEN (from Railway Dashboard)"
echo "   - Add: VERCEL_TOKEN (from Vercel Dashboard)"
echo ""
echo "4. Environment Variables:"
echo "   - Railway: Set in Railway Dashboard → Variables"
echo "   - Vercel: Set in Vercel Dashboard → Environment Variables"
echo ""
echo "5. Deploy:"
echo "   - Push to GitHub: git push origin main"
echo "   - Railway and Vercel will auto-deploy!"
echo ""
echo -e "${GREEN}✅ Setup script completed!${NC}"
echo ""
echo "📚 See DEPLOYMENT_AUTOMATION.md for detailed instructions"

