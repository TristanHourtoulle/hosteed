#!/bin/bash
# Only run prisma generate if schema has changed since last generation
SCHEMA_FILE="prisma/schema.prisma"
HASH_FILE="node_modules/.prisma/schema-hash"

if [ ! -f "$HASH_FILE" ]; then
  echo "No previous Prisma client found, generating..."
  npx prisma generate --no-hints
  md5 -q "$SCHEMA_FILE" > "$HASH_FILE" 2>/dev/null || md5sum "$SCHEMA_FILE" | cut -d' ' -f1 > "$HASH_FILE"
  exit 0
fi

CURRENT_HASH=$(md5 -q "$SCHEMA_FILE" 2>/dev/null || md5sum "$SCHEMA_FILE" | cut -d' ' -f1)
STORED_HASH=$(cat "$HASH_FILE")

if [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
  echo "Schema changed, regenerating Prisma client..."
  npx prisma generate --no-hints
  echo "$CURRENT_HASH" > "$HASH_FILE"
else
  echo "Schema unchanged, skipping prisma generate"
fi
