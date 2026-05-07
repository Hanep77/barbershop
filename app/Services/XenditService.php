<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class XenditService
{
    protected $apiKey;
    protected $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.xendit.api_key');
        $this->baseUrl = config('services.xendit.base_url', 'https://api.xendit.co');
    }

    public function createInvoice(array $data)
    {
        try {
            $body = Http::withBasicAuth($this->apiKey, '')
                ->acceptJson()
                ->asJson()
                ->post($this->baseUrl . '/v2/invoices', $data)
                ->throw()
                ->json();

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

    public function verifyWebhookToken(?string $callbackToken, ?string $webhookToken): bool
    {
        if (!$callbackToken || !$webhookToken) {
            return false;
        }

        return hash_equals($webhookToken, $callbackToken);
    }

    public function refundInvoice(string $invoiceId, float $amount)
    {
        try {
            $body = Http::withBasicAuth($this->apiKey, '')
                ->acceptJson()
                ->asJson()
                ->post($this->baseUrl . "/v2/invoices/{$invoiceId}/refund", [
                    'amount' => $amount
                ])
                ->throw()
                ->json();

            Log::info('Xendit Refund Requested', [
                'invoice_id' => $invoiceId,
                'amount' => $amount,
                'response' => $body
            ]);

            return $body;
        } catch (RequestException $e) {
            Log::error('Xendit Refund Request Failed', [
                'error' => $e->getMessage(),
                'invoice_id' => $invoiceId,
                'amount' => $amount,
            ]);
            throw $e;
        }
    }

    public function createPayout(array $data)
    {
        try {
            $body = Http::withBasicAuth($this->apiKey, '')
                ->acceptJson()
                ->asJson()
                ->post($this->baseUrl . '/v2/payouts', $data)
                ->throw()
                ->json();

            Log::info('Xendit Payout Created', ['payout_id' => $body['id'] ?? null, 'data' => $data]);

            return $body;
        } catch (RequestException $e) {
            Log::error('Xendit Payout Creation Failed', [
                'error' => $e->getMessage(),
                'data' => $data,
            ]);
            throw $e;
        }
    }
}
