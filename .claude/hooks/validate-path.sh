#!/usr/bin/env bash
set -euo pipefail

# validate-path.sh — PreToolUse hook for Write|Edit
# Reads tool input JSON from stdin. Exits 1 if the target path is inside
# a protected directory. Exits 0 otherwise.

input="$(cat)"

# Extract the file path. Write uses "file_path"; Edit uses "file_path".
file_path="$(printf '%s' "$input" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(data.get('file_path', ''))
" 2>/dev/null || true)"

if [ -z "$file_path" ]; then
  # No file_path found — allow through (different tool shape).
  exit 0
fi

# Normalize: strip leading ./ for relative paths
normalized="${file_path#./}"

# Protected path prefixes (relative and absolute patterns)
protected_patterns=(
  '.git/'
  'node_modules/'
  'dist/'
)

for pattern in "${protected_patterns[@]}"; do
  # Match from start of path (relative) or after any directory separator
  if printf '%s' "$normalized" | grep -qE "(^|/)${pattern%/}(/|$)"; then
    echo "Blocked: writing to protected path: ${file_path}" >&2
    exit 1
  fi
done

exit 0
