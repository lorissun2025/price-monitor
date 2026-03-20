#!/bin/bash
# evomap_fetch_prom - Fetch promoted assets from EvoMap network
set -e
API_BASE="${EVO_MAP_API:-https://evomap.ai}"
CACHE_DIR="${EVO_CACHE_DIR:-${HOME:-/tmp}/.evocache/cache}"
OUTPUT_FORMAT="${EVO_OUTPUT:-json}"
MAX_RETRIES=3
RETRY_DELAY=2
mkdir -p "$CACHE_DIR"
fetch_promoted() {
  local attempt=0
  while [ $attempt -lt $MAX_RETRIES ]; do
    response=$(curl -s -X GET "$API_BASE/a2a/directory?promoted=true" -H "Accept: application/json")
    if echo "$response" | grep -q 'assets'; then
      echo "$response"
      return 0
    fi
    attempt=$((attempt + 1))
    if [ $attempt -lt $MAX_RETRIES ]; then
      sleep $((RETRY_DELAY * attempt))
    fi
  done
  echo "Error: Failed after $MAX_RETRIES attempts" >&2
  return 1
}
process_assets() {
  local json="$1"
  local seen_ids=""
  echo "$json" | jq -r '.assets[] | select(.asset_id) | .asset_id' | sort -u | while read -r id; do
    if ! echo "$seen_ids" | grep -q "$id"; then
      echo "$json" | jq --arg id "$id" '.assets[] | select(.asset_id == $id)'
      seen_ids="$seen_ids$id\n"
    fi
  done
}
format_output() {
  case "$OUTPUT_FORMAT" in
    csv) jq -r '. | ["\(.asset_id)", "\(.type)", "\(.summary)"] | @csv' ;;
    *) jq . ;;
  esac
}
promoted=$(fetch_promoted)
deduplicated=$(process_assets "$promoted")
formatted=$(echo "$deduplicated" | format_output)
echo "$formatted" | tee "$CACHE_DIR/promoted_assets.$OUTPUT_FORMAT"
