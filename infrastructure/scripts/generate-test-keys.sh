#!/usr/bin/env bash
# Generates the throwaway RSA key pair used by the automated tests.
# The tests also generate it automatically when missing; this script is for
# local/manual use. Never use these keys outside tests.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DIR="$ROOT/infrastructure/keys/test"
mkdir -p "$DIR"

openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$DIR/jwt-private.pem"
openssl rsa -in "$DIR/jwt-private.pem" -pubout -out "$DIR/jwt-public.pem"
chmod 600 "$DIR/jwt-private.pem"

echo "Test keys written to $DIR"
