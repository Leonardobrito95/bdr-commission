#!/bin/sh
set -e

echo "[STARTUP] Criando schema bdr se não existir..."
npx prisma db execute --url "$DATABASE_URL" --stdin <<'SQL'
CREATE SCHEMA IF NOT EXISTS bdr;
SQL

echo "[STARTUP] Sincronizando tabelas com Prisma..."
npx prisma db push --accept-data-loss

echo "[STARTUP] Iniciando servidor..."
exec node dist/server.js
