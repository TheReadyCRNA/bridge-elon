#!/bin/bash
# Script to push Bridge App to GitHub
# Repository: https://github.com/TheReadyCRNA/bridge-elon.git

cd /app

echo "=== Git Status ==="
git status

git remote add origin https://github.com/TheReadyCRNA/bridge-elon.git 2>/dev/null || echo "Remote already exists"

git branch -M main

echo ""
echo "=== Pushing to GitHub ==="
echo "Repository: https://github.com/TheReadyCRNA/bridge-elon.git"
echo "Branch: main"
echo ""

git push -u origin main --force

echo ""
echo "=== Push Complete ==="
echo "Visit: https://github.com/TheReadyCRNA/bridge-elon"
echo ""
echo "Next steps:"
echo "1. Go to https://vercel.com/new"
echo "2. Import bridge-elon repository"
echo "3. Add environment variables (see DEPLOYMENT_GUIDE.md)"
echo "4. Deploy!"
