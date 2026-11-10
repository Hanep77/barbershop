<?php

return [

    'internal' => [
        'token' => env('INTERNAL_SERVICE_TOKEN'),
        'timeout' => (int) env('INTERNAL_SERVICE_TIMEOUT', 5),
    ],

    'urls' => [
        'identity' => env('IDENTITY_SERVICE_URL', 'http://identity-service'),
        'catalog' => env('CATALOG_SERVICE_URL', 'http://catalog-service'),
        'booking' => env('BOOKING_SERVICE_URL', 'http://booking-service'),
        'payment' => env('PAYMENT_SERVICE_URL', 'http://payment-service'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],

    'xendit' => [
        'api_key' => env('XENDIT_API_KEY'),
        'webhook_token' => env('XENDIT_WEBHOOK_TOKEN'),
        'base_url' => env('XENDIT_BASE_URL', 'https://api.xendit.co'),
    ],

    'pusher' => [
        'app_id' => env('PUSHER_APP_ID'),
        'key' => env('PUSHER_APP_KEY'),
        'secret' => env('PUSHER_APP_SECRET'),
        'cluster' => env('PUSHER_APP_CLUSTER', 'ap1'),
    ],

];
