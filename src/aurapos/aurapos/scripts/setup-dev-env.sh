#!/usr/bin/env bash
set -euo pipefail

# Ensure we are in the project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "🔧 Bootstrapping local development environment..."

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker is not installed. Please install Docker first."
  echo "   On Ubuntu/Debian: sudo apt-get update && sudo apt-get install -y docker.io"
  echo "   On macOS (brew): brew install --cask docker"
  echo "   On Windows: use Docker Desktop from https://www.docker.com/products/docker-desktop"
  exit 1
fi

# Start services via docker-compose
if [ -f "docker-compose.yml" ]; then
  echo "🐳 Starting Docker services..."
  docker compose up -d
else
  echo "⚠️  docker-compose.yml not found; skipping Docker compose."
fi

# Install dependencies with pnpm
if command -v pnpm &> /dev/null; then
  echo "📦 Installing Node.js dependencies with pnpm..."
  pnpm install --frozen-lockfile
else
  echo "❌ pnpm not found. Please install pnpm (https://pnpm.io/installation)."
  exit 1
fi

# Set up pre-commit hooks
if command -v pre-commit &> /dev/null; then
  echo "🪝 Installing pre-commit hooks..."
  pre-commit install
elif [ -f "package.json" ] && grep -q "husky" package.json; then
  echo "🪝 Installing husky hooks..."
  npx husky install
else
  echo "⚠️  Neither pre-commit nor husky detected; skipping hook installation."
fi

echo "✅ Environment bootstrap complete."
echo "   - Docker services are running (if docker-compose.yml present)."
echo "   - Node.js dependencies installed."
echo "   - Pre-commit hooks configured (if available)."
echo "   You can now run the dev server or tests as defined in the project."