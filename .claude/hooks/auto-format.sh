#!/usr/bin/env bash
# Auto-format hook: runs Prettier on modified files after Edit/Write tool use.
# Reads the tool result JSON from stdin and extracts the file path.

set -euo pipefail

# Read JSON input from stdin
INPUT=$(cat)

# Extract the file path from the tool result
FILE_PATH=$(echo "$INPUT" | grep -oE '"file_path"\s*:\s*"[^"]+"' | head -1 | sed 's/.*: *"//;s/"$//')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only format supported file types
case "$FILE_PATH" in
  *.ts|*.tsx|*.css|*.json)
    npx prettier --write "$FILE_PATH" 2>/dev/null || true
    ;;
esac
