#!/usr/bin/env bash
# Generates local development secrets. Never commit the output.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SECRETS="$ROOT/infrastructure/secrets"
mkdir -p "$SECRETS"

new_hex() { openssl rand -hex "${1:-32}"; }
new_app_key() { printf 'base64:%s' "$(openssl rand -base64 32 | tr -d '\n')"; }

for service in identity catalog booking payment; do
  new_app_key > "$SECRETS/app_key_${service}.txt"
  new_hex 24 > "$SECRETS/db_password_${service}.txt"
done

new_hex 32 > "$SECRETS/internal_token.txt"

# Generate the JWT key pair directly in the secrets directory; do not rely on
# a committed key (test keys are generated on demand and gitignored).
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$SECRETS/jwt-private.pem"
openssl rsa -in "$SECRETS/jwt-private.pem" -pubout -out "$SECRETS/jwt-public.pem"
# Docker Compose bind-mounts file secrets with their host permissions, and the
# containers run as a non-root user. 0600 would make the key unreadable
# (login fails with "Permission denied" on /run/secrets/jwt_private).
chmod 644 "$SECRETS/jwt-private.pem"

for name in xendit_api_key xendit_webhook_token google_client_secret pusher_app_secret; do
  [ -f "$SECRETS/${name}.txt" ] || : > "$SECRETS/${name}.txt"
done

echo "Secrets written to $SECRETS"
echo "Replace Xendit/Google/Pusher placeholders before enabling those integrations."
