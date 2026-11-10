# -*- mode: powershell -*-
# Generates local development secrets. Never commit the output.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$secrets = Join-Path $root "infrastructure\secrets"
New-Item -ItemType Directory -Force -Path $secrets | Out-Null

function New-RandomBytes([int]$bytes = 32) {
    $buffer = New-Object byte[] $bytes
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($buffer)
    $rng.Dispose()
    return $buffer
}

function New-RandomHex([int]$bytes = 32) {
    $buffer = New-RandomBytes $bytes
    return -join ($buffer | ForEach-Object { $_.ToString("x2") })
}

function New-AppKey {
    return "base64:" + [Convert]::ToBase64String((New-RandomBytes 32))
}

foreach ($service in @("identity","catalog","booking","payment")) {
    Set-Content -NoNewline -Path (Join-Path $secrets "app_key_$service.txt") -Value (New-AppKey)
    Set-Content -NoNewline -Path (Join-Path $secrets "db_password_$service.txt") -Value (New-RandomHex 24)
}

Set-Content -NoNewline -Path (Join-Path $secrets "internal_token.txt") -Value (New-RandomHex 32)

openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out (Join-Path $secrets "jwt-private.pem")
openssl rsa -in (Join-Path $secrets "jwt-private.pem") -pubout -out (Join-Path $secrets "jwt-public.pem")

# Placeholders: replace with real credentials before exercising Xendit,
# Google OAuth or Pusher. Empty Xendit webhook token intentionally makes the
# payment webhook return 503 instead of accepting unauthenticated callbacks.
foreach ($name in @("xendit_api_key","xendit_webhook_token","google_client_secret","pusher_app_secret")) {
    $path = Join-Path $secrets "$name.txt"
    if (-not (Test-Path $path)) { Set-Content -NoNewline -Path $path -Value "" }
}

Write-Host "Secrets written to $secrets"
Write-Host "Replace Xendit/Google/Pusher placeholders before enabling those integrations."
