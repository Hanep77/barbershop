<?php

return [

    'issuer' => env('JWT_ISSUER', 'barberbrody-identity'),

    'audience' => env('JWT_AUDIENCE', 'barberbrody-api'),

    'public_key_path' => env('JWT_PUBLIC_KEY_PATH', storage_path('keys/jwt-public.pem')),

    'private_key_path' => env('JWT_PRIVATE_KEY_PATH', storage_path('keys/jwt-private.pem')),

    'access_ttl' => (int) env('JWT_ACCESS_TTL', 900),

    'refresh_ttl' => (int) env('JWT_REFRESH_TTL', 604800),

];
