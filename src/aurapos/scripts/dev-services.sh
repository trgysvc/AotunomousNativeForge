#!/usr/bin/env bash
set -euo pipefail

export PGPORT=${PGPORT:-5432}
export PGHOST=${PGHOST:-localhost}
export PGUSER=${PGUSER:-postgres}
# PGPASSWORD must be set externally - no default for security
export REDIS_HOST=${REDIS_HOST:-localhost}
export REDIS_PORT=${REDIS_PORT:-6379}

if [ -z "${PGPASSWORD:-}" ]; then
  echo "Error: PGPASSWORD environment variable must be set for PostgreSQL password"
  exit 1
fi

function start_postgres() {
  echo "Ensuring PostgreSQL container exists and is running..."
  if docker ps -a --filter "name=dev-postgres" --format '{{.Names}}' | grep -q "^dev-postgres$"; then
    echo "Found existing container. Starting if stopped..."
    docker start dev-postgres >/dev/null
  else
    echo "Creating new PostgreSQL container..."
    docker run --name dev-postgres -e POSTGRES_PASSWORD="$PGPASSWORD" -p 5432:5432 -d postgres:15-alpine >/dev/null
  fi
  echo "Waiting for PostgreSQL to be ready..."
  until docker exec dev-postgres pg_isready -U "$PGUSER" -h "$PGHOST" -p "$PGPORT"; do
    sleep 0.5
  done
  echo "PostgreSQL is ready."
}

function start_redis() {
  echo "Ensuring Redis container exists and is running..."
  if docker ps -a --filter "name=dev-redis" --format '{{.Names}}' | grep -q "^dev-redis$"; then
    echo "Found existing container. Starting if stopped..."
    docker start dev-redis >/dev/null
  else
    echo "Creating new Redis container..."
    docker run --name dev-redis -p 6379:6379 -d redis:7-alpine >/dev/null
  fi
  echo "Waiting for Redis to be ready..."
  until docker exec dev-redis redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping | grep -q PONG; do
    sleep 0.5
  done
  echo "Redis is ready."
}

case "${1:-all}" in
  db|postgres)
    start_postgres
    ;;
  redis)
    start_redis
    ;;
  *)
    start_postgres
    start_redis
    ;;
esac