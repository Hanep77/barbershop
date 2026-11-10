<?php

namespace Tests\Concerns;

use DateTimeImmutable;
use DateTimeZone;
use Illuminate\Support\Str;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Signer\Rsa\Sha256;

trait IssuesTokens
{
    protected function makeToken(array $overrides = []): string
    {
        $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));
        $ttl = (int) config('jwt.access_ttl', 900);

        $configuration = Configuration::forAsymmetricSigner(
            new Sha256(),
            InMemory::file((string) config('jwt.private_key_path')),
            InMemory::file((string) config('jwt.public_key_path')),
        );

        $builder = $configuration->builder()
            ->issuedBy((string) config('jwt.issuer'))
            ->permittedFor((string) config('jwt.audience'))
            ->identifiedBy((string) Str::uuid7())
            ->relatedTo((string) ($overrides['sub'] ?? Str::uuid7()))
            ->issuedAt($now)
            ->canOnlyBeUsedAfter($now)
            ->expiresAt($now->modify("+{$ttl} seconds"))
            ->withClaim('role', (string) ($overrides['role'] ?? 'customer'))
            ->withClaim('name', (string) ($overrides['name'] ?? 'Budi'))
            ->withClaim('email', (string) ($overrides['email'] ?? 'budi@example.com'));

        return $builder
            ->getToken($configuration->signer(), $configuration->signingKey())
            ->toString();
    }

    protected function authHeaders(array $overrides = []): array
    {
        return [
            'Authorization' => 'Bearer '.$this->makeToken($overrides),
            'Accept' => 'application/json',
        ];
    }
}
