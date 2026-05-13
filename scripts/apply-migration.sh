#!/usr/bin/env bash
# apply-migration.sh — safely apply a SQL migration to a Supabase project.
#
# Usage:
#   ./scripts/apply-migration.sh <migration-file> [project-id]
#
# Required env vars (or pass via shell):
#   SUPABASE_ACCESS_TOKEN  — personal access token (stored in .claude/settings.json, never in git)
#
# Optional env vars:
#   SUPABASE_PROJECT_ID    — falls back to bpchjjgilooaztqipdkt if not set
#
# Example:
#   SUPABASE_ACCESS_TOKEN=sbp_xxx ./scripts/apply-migration.sh \
#     supabase/migrations/20260514_020_replace_is_staff_policies.sql
#
# The script will:
#   1. Read the SQL file
#   2. POST it to the Supabase database query API
#   3. Print the HTTP response (success = 201, error = 4xx/5xx)
#   4. Exit non-zero on failure so CI can catch it

set -euo pipefail

MIGRATION_FILE="${1:-}"
PROJECT_ID="${2:-${SUPABASE_PROJECT_ID:-bpchjjgilooaztqipdkt}}"
PAT="${SUPABASE_ACCESS_TOKEN:-}"

# ── validation ──────────────────────────────────────────────────────────────

if [[ -z "$MIGRATION_FILE" ]]; then
  echo "Error: migration file path required." >&2
  echo "Usage: $0 <migration-file> [project-id]" >&2
  exit 1
fi

if [[ ! -f "$MIGRATION_FILE" ]]; then
  echo "Error: file not found: $MIGRATION_FILE" >&2
  exit 1
fi

if [[ -z "$PAT" ]]; then
  # Try loading from .claude/settings.json (local dev only)
  SETTINGS_FILE="$(dirname "$0")/../.claude/settings.json"
  if [[ -f "$SETTINGS_FILE" ]]; then
    PAT=$(python3 -c "import json,sys; d=json.load(open('$SETTINGS_FILE')); print(d.get('env',{}).get('SUPABASE_ACCESS_TOKEN',''))" 2>/dev/null || true)
  fi
fi

if [[ -z "$PAT" ]]; then
  echo "Error: SUPABASE_ACCESS_TOKEN not set." >&2
  echo "Set it in the environment or store it in .claude/settings.json under env.SUPABASE_ACCESS_TOKEN" >&2
  exit 1
fi

# ── apply ───────────────────────────────────────────────────────────────────

SQL=$(cat "$MIGRATION_FILE")
ENDPOINT="https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query"

echo "Applying migration: $MIGRATION_FILE"
echo "Project ID: $PROJECT_ID"
echo ""

HTTP_STATUS=$(curl -s -o /tmp/migration_response.json -w "%{http_code}" \
  -X POST "$ENDPOINT" \
  -H "Authorization: Bearer $PAT" \
  -H "Content-Type: application/json" \
  -d "$(python3 -c "import json,sys; print(json.dumps({'query': sys.stdin.read()}))" <<< "$SQL")")

RESPONSE=$(cat /tmp/migration_response.json)

echo "HTTP status: $HTTP_STATUS"
echo "Response: $RESPONSE"
echo ""

if [[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]]; then
  echo "Migration applied successfully."
  exit 0
else
  echo "Migration failed with HTTP $HTTP_STATUS" >&2
  exit 1
fi
