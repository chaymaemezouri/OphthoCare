#!/bin/bash

# OphthoCare Frontend Setup Script
# Installs dependencies and configures the frontend

set -e

echo "🚀 OphthoCare Frontend Setup"
echo "================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "✅ Node.js $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ npm $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Copy env file
if [ ! -f ".env.local" ]; then
    echo "📋 Creating .env.local from .env.example"
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your configuration"
fi

# Run type check
echo ""
echo "🔍 Type checking..."
npm run type-check || true

# Run linter
echo ""
echo "✨ Linting code..."
npm run lint || true

echo ""
echo "================================"
echo "✅ Frontend setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update .env.local with your configuration"
echo "2. Start the development server: npm run dev"
echo "3. Open http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "   README.md - Getting started"
echo "   STRUCTURE.md - Project structure"
