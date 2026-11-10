#!/usr/bin/env bash
# Basic routing smoke test through Traefik.
# Usage: PUBLIC_URL=http://localhost bash infrastructure/scripts/smoke-test.sh
set -uo pipefail

BASE="${PUBLIC_URL:-http://localhost}"
failures=0

expect() {
  local label="$1" expected="$2" url="$3"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' "$url")"
  if [[ ",$expected," == *",$code,"* ]]; then
    printf 'OK   %-44s %s\n' "$label" "$code"
  else
    printf 'FAIL %-44s %s (expected %s)\n' "$label" "$code" "$expected"
    failures=$((failures + 1))
  fi
}

expect "frontend" "200" "$BASE/"
expect "catalog public list" "200" "$BASE/api/barbershop"
expect "identity unauthenticated /me" "401" "$BASE/api/me"
expect "booking unauthenticated list" "401" "$BASE/api/bookings"
expect "payment unauthenticated create" "401" "$BASE/api/payments/create"
expect "withdrawal unauthenticated" "401" "$BASE/api/partner/barbershop/withdrawals"
expect "dashboard unauthenticated" "401" "$BASE/api/partner/barbershop/dashboard/stats"
expect "internal endpoint not routed" "404" "$BASE/internal/users/00000000-0000-0000-0000-000000000000"
expect "webhook without token" "401,503" "$BASE/api/payments/webhook/xendit"

echo
if [[ $failures -eq 0 ]]; then
  echo "Smoke test passed."
else
  echo "Smoke test failed: $failures check(s)."
  exit 1
fi
