#!/usr/bin/env bash
set -euo pipefail

# log-tokens.sh — PostToolUse hook for Write|Edit
# Reads tool result JSON from stdin. Appends a one-line JSON record to
# .claude/logs/tokens.jsonl. Creates the log file and directory if they
# do not exist. Always exits 0.

LOG_DIR=".claude/logs"
LOG_FILE="${LOG_DIR}/tokens.jsonl"

# Ensure the log directory exists.
mkdir -p "$LOG_DIR"

input="$(cat)"

# Extract tool name and session id from the event if present.
tool_name="$(printf '%s' "$input" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(data.get('tool_name', data.get('tool', 'unknown')))
" 2>/dev/null || echo "unknown")"

session_id="$(printf '%s' "$input" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(data.get('session_id', ''))
" 2>/dev/null || echo "")"

ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

record="{\"ts\": \"${ts}\", \"tool\": \"${tool_name}\", \"session\": \"${session_id}\"}"

printf '%s\n' "$record" >> "$LOG_FILE"

exit 0
