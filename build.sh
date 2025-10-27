#!/bin/bash

# Build script for Render deployment
# This script ensures vite is properly available and builds the frontend

set -e  # Exit on any error

echo "🚀 Starting build process..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Ensure vite is available and build
echo "🔨 Building frontend with vite..."
if command -v npx &> /dev/null; then
    echo "Using npx vite build..."
    npx vite build
elif [ -f "./node_modules/.bin/vite" ]; then
    echo "Using local vite binary..."
    ./node_modules/.bin/vite build
elif [ -f "./node_modules/vite/bin/vite.js" ]; then
    echo "Using node vite binary..."
    node ./node_modules/vite/bin/vite.js build
else
    echo "❌ Error: vite not found in any expected location"
    echo "Available files in node_modules:"
    ls -la node_modules/ | grep vite || echo "No vite-related files found"
    exit 1
fi

echo "✅ Build completed successfully!"
