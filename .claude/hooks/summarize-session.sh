#!/usr/bin/env bash
set -euo pipefail

# summarize-session.sh — Stop hook
# Reads Stop event JSON from stdin. Appends a one-line record to
# .claude/logs/sessions.jsonl. Creates the log file and directory if
# they do not exist. Always exits 0.

LOG_DIR=".claude/logs"
LOG_FILE="${LOG_DIR}/sessions.jsonl"

# Ensure the log directory exists.
mkdir -p "$LOG_DIR"

input="$(cat)"

session_id="$(printf '%s' "$input" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(data.get('session_id', ''))
" 2>/dev/null || echo "")"

ts="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

record="{\"ts\": \"${ts}\", \"event\": \"session_stop\", \"session\": \"${session_id}\"}"

printf '%s\n' "$record" >> "$LOG_FILE"

exit 0
