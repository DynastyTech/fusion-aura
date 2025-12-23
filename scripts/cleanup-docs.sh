#!/bin/bash

# Cleanup Documentation Files Script
# This removes all .md files except README.md

set -e

echo "🧹 Cleaning up documentation files..."
echo ""

# Count total .md files
TOTAL=$(find . -name "*.md" -type f | wc -l | tr -d ' ')
echo "Found $TOTAL .md files"

# Ask for confirmation
read -p "Delete all .md files except README.md? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

# Delete all .md files except README.md
DELETED=0
while IFS= read -r -d '' file; do
    if [[ "$file" != "./README.md" ]] && [[ "$file" != "README.md" ]]; then
        rm "$file"
        echo "  ✅ Deleted: $file"
        ((DELETED++))
    fi
done < <(find . -name "*.md" -type f -print0)

echo ""
echo "✅ Cleanup complete!"
echo "   Deleted: $DELETED files"
echo "   Kept: README.md"
echo ""
echo "💡 Your website functionality is NOT affected - these were just documentation files!"

