<?php

namespace Tests\Concerns;

use DateTimeImmutable;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Signer\Rsa\Sha256;

trait IssuesTokens
{
    protected function issueToken(string $id, string $role = 'user', array $claims = []): string
    {
        $config = Configuration::forAsymmetricSigner(
            new Sha256(),
            InMemory::file((string) config('jwt.private_key_path')),
            InMemory::file((string) config('jwt.public_key_path')),
        );

        $now = new DateTimeImmutable();

        $builder = $config->builder()
            ->issuedBy((string) config('jwt.issuer'))
            ->permittedFor((string) config('jwt.audience'))
            ->relatedTo($id)
            ->issuedAt($now->modify('-5 seconds'))
            ->canOnlyBeUsedAfter($now->modify('-5 seconds'))
            ->expiresAt($now->modify('+15 minutes'))
            ->withClaim('role', $role)
            ->withClaim('name', $claims['name'] ?? 'Test User')
            ->withClaim('email', $claims['email'] ?? 'test@example.com');

        foreach ($claims as $key => $value) {
            if (! in_array($key, ['name', 'email'], true)) {
                $builder = $builder->withClaim($key, $value);
            }
        }

        return $builder->getToken($config->signer(), $config->signingKey())->toString();
    }

    protected function authHeaders(string $id, string $role = 'user', array $claims = []): array
    {
        return [
            'Authorization' => 'Bearer '.$this->issueToken($id, $role, $claims),
            'Accept' => 'application/json',
        ];
    }
}
