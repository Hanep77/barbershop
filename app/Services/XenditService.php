<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Log;

class XenditService
{
    protected $client;
    protected $apiKey;
    protected $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.xendit.api_key');
        $this->baseUrl = config('services.xendit.base_url', 'https://api.xendit.co');
        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'headers' => [
                'Authorization' => 'Basic ' . base64_encode($this->apiKey . ':'),
                'Content-Type' => 'application/json',
            ],
        ]);
    }

    public function createInvoice(array $data)
    {
        try {
            $response = $this->client->post('/v2/invoices', [
                'json' => $data,
            ]);

            $body = json_decode($response->getBody(), true);
            Log::info('Xendit Invoice Created', ['invoice_id' => $body['id'] ?? null, 'data' => $data]);

            return $body;
        } catch (RequestException $e) {
            Log::error('Xendit Invoice Creation Failed', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);
            throw $e;
        }
    }

    public function verifyWebhookSignature($payload, $signature, $webhookToken)
    {
        $expectedSignature = hash_hmac('sha256', $payload, $webhookToken);
        return hash_equals($expectedSignature, $signature);
    }
}
