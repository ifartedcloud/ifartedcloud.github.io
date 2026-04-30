#!/usr/bin/env bash
set -euo pipefail

# format-on-write.sh — PostToolUse hook for Write|Edit
# Reads tool result JSON from stdin. Extracts the file path and applies
# a formatter if one is configured for the file type.
#
# Current behavior:
#   .sh  — skip (shell scripts are not auto-formatted here)
#   .md  — skip (no markdown formatter configured)
#   .ts/.tsx/.js/.jsx — run prettier if available
#   other — placeholder; plug in your formatter below

input="$(cat)"

file_path="$(printf '%s' "$input" | python3 -c "
import json, sys
data = json.load(sys.stdin)
# PostToolUse result may nest the path under different keys depending on the tool.
# Try common locations.
path = (
    data.get('file_path') or
    data.get('tool_input', {}).get('file_path') or
    ''
)
print(path)
" 2>/dev/null || true)"

if [ -z "$file_path" ]; then
  exit 0
fi

ext="${file_path##*.}"

case "$ext" in
  sh)
    # Shell scripts: skip
    ;;
  md)
    # Markdown: skip (no formatter configured)
    ;;
  ts|tsx|js|jsx)
    # TypeScript/JavaScript: run prettier if available
    if command -v prettier &>/dev/null; then
      prettier --write "$file_path" 2>/dev/null || true
    fi
    ;;
  *)
    # Plug in your formatter here for other file types.
    ;;
esac

exit 0
