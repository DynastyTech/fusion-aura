#!/bin/bash

# GitHub Setup Script for FusionAura
# This script helps you push your code to GitHub

echo "🚀 FusionAura GitHub Setup"
echo "=========================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if already a git repository
if [ -d ".git" ]; then
    echo "✅ Git repository already initialized"
else
    echo "📦 Initializing Git repository..."
    git init
fi

# Check if remote already exists
if git remote get-url origin &> /dev/null; then
    echo "✅ Remote 'origin' already exists"
    echo "Current remote: $(git remote get-url origin)"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote set-url origin https://github.com/DynastyTech/fusion-aura.git
        echo "✅ Remote updated"
    fi
else
    echo "➕ Adding GitHub remote..."
    git remote add origin https://github.com/DynastyTech/fusion-aura.git
    echo "✅ Remote added"
fi

# Check if there are changes to commit
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ No changes to commit"
else
    echo "📝 Staging files..."
    git add .
    
    echo "💾 Creating commit..."
    git commit -m "Initial commit: FusionAura e-commerce platform

- Next.js frontend with product catalog
- Fastify API backend  
- PostgreSQL database with Prisma
- Guest checkout support
- Admin dashboard for orders and products
- Cash on Delivery payment
- Email notifications
- Image upload with Cloudinary
- Product search with Meilisearch
- Order management with auto-cleanup"
    echo "✅ Commit created"
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")

if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "🌿 Renaming branch to 'main'..."
    git branch -M main
fi

echo ""
echo "📤 Ready to push to GitHub!"
echo ""
echo "To push, run:"
echo "  git push -u origin main"
echo ""
echo "If you get authentication errors, you may need to:"
echo "  1. Use a Personal Access Token (GitHub → Settings → Developer settings)"
echo "  2. Or set up SSH keys"
echo ""
read -p "Do you want to push now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Pushing to GitHub..."
    git push -u origin main
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pushed to GitHub!"
        echo "🌐 View your repo: https://github.com/DynastyTech/fusion-aura"
    else
        echo "❌ Push failed. Check authentication or run manually."
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review GITHUB_SETUP.md for detailed instructions"
echo "  2. Review GODADDY_DEPLOYMENT.md for deployment guide"
echo "  3. Deploy to Vercel (frontend) and Railway (backend)"

