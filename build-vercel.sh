#!/bin/bash

# Vercel Build Script for EduMyles
# This script ensures the web app builds correctly on Vercel

set -e  # Exit on error

echo "🚀 Starting EduMyles Vercel Build..."
echo "====================================="

# Step 1: Build the types package first (it has no dependencies)
echo "📦 Building @edumyles/types package..."
cd packages/types
npm install --legacy-peer-deps || true
npm run build || echo "Types build skipped (no build script)"
cd ../..

# Step 2: Link types package to web app node_modules
echo "🔗 Setting up package links..."
mkdir -p apps/web/node_modules/@edumyles
cp -r packages/types apps/web/node_modules/@edumyles/

# Step 3: Install web app dependencies (excluding workspace deps)
cd apps/web
echo "📦 Installing web app dependencies..."

# Temporarily modify package.json to remove workspace: protocol
cp package.json package.json.backup
sed -i 's/"@edumyles\/types": "workspace:\*"/"@edumyles\/types": "file:..\/..\/packages\/types"/g' package.json || \
    sed -i '' 's/"@edumyles\/types": "workspace:\*"/"@edumyles\/types": "file:..\/..\/packages\/types"/g' package.json

npm install --legacy-peer-deps

# Restore original package.json
mv package.json.backup package.json

echo "🔨 Building Next.js application..."
npm run build

echo "✅ Build completed successfully!"
echo "Output directory: apps/web/.next"
