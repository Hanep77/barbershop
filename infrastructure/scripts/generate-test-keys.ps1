# Generates the throwaway RSA key pair used by the automated tests.
# The tests also generate it automatically when missing; this script is for
# local/manual use. Never use these keys outside tests.
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$dir = Join-Path $root "infrastructure\keys\test"
New-Item -ItemType Directory -Force -Path $dir | Out-Null

openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out (Join-Path $dir "jwt-private.pem")
openssl rsa -in (Join-Path $dir "jwt-private.pem") -pubout -out (Join-Path $dir "jwt-public.pem")

Write-Host "Test keys written to $dir"
