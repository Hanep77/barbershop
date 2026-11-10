<?php

namespace App\Support;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

/**
 * Thin client for synchronous service-to-service REST calls.
 *
 * Internal calls are authenticated with a shared token and must never be
 * exposed through the API gateway.
 */
final class InternalClient
{
    public function __construct(private readonly string $service)
    {
    }

    public static function for(string $service): self
    {
        return new self($service);
    }

    public function get(string $path, array $query = []): array
    {
        return $this->send('GET', $path, $query);
    }

    public function post(string $path, array $payload = []): array
    {
        return $this->send('POST', $path, [], $payload);
    }

    public function put(string $path, array $payload = []): array
    {
        return $this->send('PUT', $path, [], $payload);
    }

    public function patch(string $path, array $payload = []): array
    {
        return $this->send('PATCH', $path, [], $payload);
    }

    public function delete(string $path): array
    {
        return $this->send('DELETE', $path);
    }

    /**
     * Read helper that degrades gracefully when the dependency is down.
     */
    public function tryGet(string $path, array $query = []): ?array
    {
        try {
            return $this->get($path, $query);
        } catch (Throwable) {
            return null;
        }
    }

    private function send(string $method, string $path, array $query = [], array $payload = []): array
    {
        $baseUrl = rtrim((string) config("services.urls.{$this->service}"), '/');

        if ($baseUrl === '') {
            throw new RuntimeException("No internal URL configured for service [{$this->service}]");
        }

        $response = $this->request()->send($method, $baseUrl.$path, array_filter([
            'query' => $query,
            'json' => $payload === [] ? null : $payload,
        ], static fn ($value) => $value !== null));

        if ($response->failed()) {
            throw new RuntimeException(
                "Internal call {$method} {$this->service}{$path} failed with status {$response->status()}"
            );
        }

        return $this->decode($response);
    }

    private function request(): PendingRequest
    {
        return Http::withHeaders([
            'X-Internal-Token' => (string) config('services.internal.token'),
            'Accept' => 'application/json',
        ])->timeout((int) config('services.internal.timeout', 5));
    }

    private function decode(Response $response): array
    {
        if ($response->status() === 204) {
            return [];
        }

        $json = $response->json();

        return is_array($json) ? $json : [];
    }
}
