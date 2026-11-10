<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Xendit HTTP client. Never logs payloads that may contain secrets.
 */
final class XenditService
{
    private ?string $apiKey;

    private string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.xendit.api_key');
        $this->baseUrl = rtrim((string) config('services.xendit.base_url', 'https://api.xendit.co'), '/');
    }

    public function createInvoice(array $data): array
    {
        try {
            $body = Http::withBasicAuth((string) $this->apiKey, '')
                ->acceptJson()
                ->asJson()
                ->post($this->baseUrl.'/v2/invoices', $data)
                ->throw()
                ->json();

            Log::info('Xendit invoice created', [
                'invoice_id' => is_array($body) ? ($body['id'] ?? null) : null,
                'external_id' => is_array($body) ? ($body['external_id'] ?? ($data['external_id'] ?? null)) : null,
            ]);

            return is_array($body) ? $body : [];
        } catch (RequestException $e) {
            Log::error('Xendit invoice creation failed', [
                'external_id' => $data['external_id'] ?? null,
                'status' => $e->response?->status(),
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function verifyWebhookToken(?string $callbackToken, ?string $webhookToken): bool
    {
        if (! $callbackToken || ! $webhookToken) {
            return false;
        }

        return hash_equals($webhookToken, $callbackToken);
    }

    public function refundInvoice(string $invoiceId, float $amount, ?string $paymentId = null): array
    {
        try {
            $payload = [
                'amount' => (int) $amount,
                'reason' => 'REQUESTED_BY_CUSTOMER',
            ];

            if ($paymentId) {
                $payload['invoice_id'] = $invoiceId;
                $url = $this->baseUrl.'/refunds';
            } else {
                $url = $this->baseUrl."/v2/invoices/{$invoiceId}/refund";
            }

            Log::info('Sending refund request to Xendit', [
                'invoice_id' => $invoiceId,
                'amount' => $amount,
            ]);

            $response = Http::withBasicAuth((string) $this->apiKey, '')
                ->acceptJson()
                ->asJson()
                ->post($url, $payload);

            $body = $response->json();

            if ($response->failed()) {
                Log::error('Xendit refund request failed', [
                    'invoice_id' => $invoiceId,
                    'status' => $response->status(),
                ]);

                return is_array($body) ? $body : [];
            }

            Log::info('Xendit refund requested', [
                'invoice_id' => $invoiceId,
                'refund_id' => is_array($body) ? ($body['id'] ?? null) : null,
            ]);

            return is_array($body) ? $body : [];
        } catch (\Exception $e) {
            Log::error('Xendit refund exception', [
                'invoice_id' => $invoiceId,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function createPayout(array $data, string $idempotencyKey): array
    {
        try {
            $body = Http::withBasicAuth((string) $this->apiKey, '')
                ->withHeaders([
                    'idempotency-key' => $idempotencyKey,
                ])
                ->acceptJson()
                ->asJson()
                ->post($this->baseUrl.'/v2/payouts', $data)
                ->throw()
                ->json();

            Log::info('Xendit payout created', [
                'payout_id' => is_array($body) ? ($body['id'] ?? null) : null,
                'idempotency_key' => $idempotencyKey,
                'status' => is_array($body) ? ($body['status'] ?? null) : null,
            ]);

            return is_array($body) ? $body : [];
        } catch (RequestException $e) {
            Log::error('Xendit payout creation failed', [
                'idempotency_key' => $idempotencyKey,
                'status' => $e->response?->status(),
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
