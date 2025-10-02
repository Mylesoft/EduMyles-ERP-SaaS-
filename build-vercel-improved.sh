#!/bin/bash

# Improved Vercel Build Script for EduMyles
# This script builds the web app without workspace dependencies

set -e  # Exit on error

echo "🚀 Starting EduMyles Improved Vercel Build..."
echo "=============================================="

# Navigate to web app directory
cd apps/web

echo "📦 Installing web app dependencies..."

# Create a temporary package.json without workspace references
cp package.json package.json.original

# Remove workspace dependencies from package.json temporarily
sed -i.bak 's/"@edumyles\/types": "workspace:\*"/"@edumyles\/types": "file:..\/..\/packages\/types"/g' package.json || \
    sed -i '' 's/"@edumyles\/types": "workspace:\*"/"@edumyles\/types": "file:..\/..\/packages\/types"/g' package.json

# Install dependencies
npm install --legacy-peer-deps

# Restore original package.json
mv package.json.original package.json

echo "🔨 Building Next.js application..."
npm run build

echo "✅ Improved build completed successfully!"
echo "Output directory: apps/web/.next"