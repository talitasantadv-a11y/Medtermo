#!/usr/bin/env bash
# Monta desktop/app-bundle/: o servidor compilado, o client compilado e um
# node_modules "de produção" (sem as ferramentas de build/dev), usados pelo
# processo principal do Electron em tempo de execução.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BUNDLE_DIR="$ROOT_DIR/desktop/app-bundle"

cd "$ROOT_DIR"

echo "==> Buildando client..."
npm run build --workspace=client

echo "==> Buildando server..."
npm run build --workspace=server

echo "==> Gerando Prisma Client (engines native + windows)..."
npx prisma generate --schema="$ROOT_DIR/prisma/schema.prisma"

echo "==> Recriando $BUNDLE_DIR"
rm -rf "$BUNDLE_DIR"
mkdir -p "$BUNDLE_DIR/server" "$BUNDLE_DIR/client" "$BUNDLE_DIR/prisma"

cp -a "$ROOT_DIR/server/dist" "$BUNDLE_DIR/server/dist"
cp -a "$ROOT_DIR/client/dist" "$BUNDLE_DIR/client/dist"

MIGRATION_SQL=$(find "$ROOT_DIR/prisma/migrations" -maxdepth 2 -name "migration.sql" | sort | tail -n 1)
cp "$MIGRATION_SQL" "$BUNDLE_DIR/prisma/migration.sql"

echo "==> Copiando node_modules (isso pode levar um tempo)..."
cp -a "$ROOT_DIR/node_modules" "$BUNDLE_DIR/node_modules"

echo "==> Removendo pacotes que só são usados em build/dev (não em runtime)..."
PACOTES_PARA_REMOVER=(
  typescript
  vite
  @vitejs
  tailwindcss
  postcss
  autoprefixer
  tsx
  concurrently
  prisma
  esbuild
  rollup
  puppeteer
  tesseract.js
)
for pacote in "${PACOTES_PARA_REMOVER[@]}"; do
  rm -rf "${BUNDLE_DIR:?}/node_modules/${pacote}"
done

echo "==> Bundle pronto em $BUNDLE_DIR"
du -sh "$BUNDLE_DIR"
