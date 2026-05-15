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

    public function refundInvoice(string $invoiceId, float $amount, ?string $paymentId = null)
    {
        try {
            $payload = [
                'amount' => (int) $amount,
                'reason' => 'REQUESTED_BY_CUSTOMER',
            ];

            // Use unified refunds API if paymentId is available
            if ($paymentId) {
                $payload['invoice_id'] = $invoiceId; // Use invoice_id as the primary reference for invoice-based refunds
                $url = $this->baseUrl . "/refunds";
            } else {
                // Fallback to legacy invoice refund if no paymentId
                $url = $this->baseUrl . "/v2/invoices/{$invoiceId}/refund";
            }

            Log::info('Sending Refund Request to Xendit', [
                'url' => $url,
                'payload' => $payload
            ]);

            $response = Http::withBasicAuth($this->apiKey, '')
                ->acceptJson()
                ->asJson()
                ->post($url, $payload);

            if ($response->failed()) {
                Log::error('Xendit Refund Request Failed', [
                    'status' => $response->status(),
                    'body' => $response->json(),
                    'invoice_id' => $invoiceId
                ]);
                return $response->json();
            }

            $body = $response->json();
            Log::info('Xendit Refund Requested Successfully', [
                'invoice_id' => $invoiceId,
                'amount' => $amount,
                'response' => $body
            ]);

            return $body;
        } catch (\Exception $e) {
            Log::error('Xendit Refund Exception', [
                'error' => $e->getMessage(),
                'invoice_id' => $invoiceId
            ]);
            throw $e;
        }
    }

    public function createPayout(array $data, string $idempotencyKey)
    {
        try {
            $body = Http::withBasicAuth($this->apiKey, '')
                ->withHeaders([
                    'idempotency-key' => $idempotencyKey,
                ])
                ->acceptJson()
                ->asJson()
                ->post($this->baseUrl . '/v2/payouts', $data)
                ->throw()
                ->json();

            Log::info('Xendit Payout Created', [
                'payout_id' => $body['id'] ?? null,
                'idempotency_key' => $idempotencyKey,
                'data' => $data,
            ]);

            return $body;
        } catch (RequestException $e) {
            Log::error('Xendit Payout Creation Failed', [
                'error' => $e->getMessage(),
                'idempotency_key' => $idempotencyKey,
                'data' => $data,
            ]);

            throw $e;
        }
    }
}
