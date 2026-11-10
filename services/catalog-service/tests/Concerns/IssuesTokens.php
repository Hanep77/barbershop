<?php

namespace Tests\Concerns;

use DateTimeImmutable;
use DateTimeZone;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Signer\Rsa\Sha256;

trait IssuesTokens
{
    protected function tokenFor(string $userId, string $role = 'customer', array $claims = []): string
    {
        $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));

        $configuration = Configuration::forAsymmetricSigner(
            new Sha256(),
            InMemory::file((string) config('jwt.private_key_path')),
            InMemory::file((string) config('jwt.public_key_path')),
        );

        $builder = $configuration->builder()
            ->issuedBy((string) config('jwt.issuer'))
            ->permittedFor((string) config('jwt.audience'))
            ->relatedTo($userId)
            ->issuedAt($now)
            ->canOnlyBeUsedAfter($now->modify('-1 second'))
            ->expiresAt($now->modify('+1 hour'))
            ->withClaim('role', $role)
            ->withClaim('name', $claims['name'] ?? 'Test User')
            ->withClaim('email', $claims['email'] ?? 'test@example.com');

        if (array_key_exists('avatar', $claims)) {
            $builder = $builder->withClaim('avatar', $claims['avatar']);
        }

        return $builder
            ->getToken($configuration->signer(), $configuration->signingKey())
            ->toString();
    }

    protected function authHeader(string $token): array
    {
        return ['Authorization' => "Bearer {$token}"];
    }
}
