#!/usr/bin/env bash
set -euo pipefail

# block-secrets.sh — PreToolUse hook for Write|Edit
# Reads tool input JSON from stdin. Exits 1 if the content being written
# contains known secret patterns. Exits 0 otherwise.

input="$(cat)"

# Extract the content field. Handles both Write (field: "content") and
# Edit (fields: "new_string", "old_string"). We check all text values.
content="$(printf '%s' "$input" | python3 -c "
import json, sys
data = json.load(sys.stdin)
parts = []
for key in ('content', 'new_string', 'old_string'):
    if key in data:
        parts.append(str(data[key]))
print('\n'.join(parts))
" 2>/dev/null || true)"

if [ -z "$content" ]; then
  # Could not extract content (e.g., different tool shape) — allow through.
  exit 0
fi

# Pattern list — case-insensitive grep
patterns=(
  'api_key\s*[:=]'
  'secret\s*[:=]'
  'password\s*[:=]'
  '\btoken\s*[:=]'
  'private_key\s*[:=]'
  '-----BEGIN RSA'
  '-----BEGIN (EC|OPENSSH|PGP) '
  '\bAKIA[0-9A-Z]{16}\b'
  '\bghp_[A-Za-z0-9]{36,}\b'
  '\bsk-[A-Za-z0-9]{32,}\b'
)

for pattern in "${patterns[@]}"; do
  if printf '%s' "$content" | grep -qiE "$pattern"; then
    echo "BLOCKED: Content matches secret pattern: ${pattern}" >&2
    echo "Remove or vault the secret before writing this file." >&2
    exit 1
  fi
done

exit 0
