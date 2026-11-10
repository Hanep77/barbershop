<?php

namespace App\Support\Jwt;

use App\Models\User;
use DateTimeImmutable;
use Illuminate\Support\Str;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Signer\Rsa\Sha256;
use RuntimeException;

final class JwtIssuer
{
    private ?Configuration $configuration = null;

    public function issue(User $user): string
    {
        $now = new DateTimeImmutable('now', new \DateTimeZone('UTC'));
        $ttl = (int) config('jwt.access_ttl', 900);

        $builder = $this->configuration()->builder()
            ->issuedBy((string) config('jwt.issuer'))
            ->permittedFor((string) config('jwt.audience'))
            ->identifiedBy((string) Str::uuid7())
            ->relatedTo((string) $user->id)
            ->issuedAt($now)
            ->canOnlyBeUsedAfter($now)
            ->expiresAt($now->modify("+{$ttl} seconds"))
            ->withClaim('role', (string) $user->role)
            ->withClaim('name', (string) $user->name)
            ->withClaim('email', (string) $user->email);

        if ($user->avatar) {
            $builder = $builder->withClaim('avatar', (string) $user->avatar);
        }

        return $builder
            ->getToken($this->configuration()->signer(), $this->configuration()->signingKey())
            ->toString();
    }

    public function expiresIn(): int
    {
        return (int) config('jwt.access_ttl', 900);
    }

    private function configuration(): Configuration
    {
        if ($this->configuration !== null) {
            return $this->configuration;
        }

        $path = (string) config('jwt.private_key_path');

        if (! is_file($path)) {
            throw new RuntimeException("JWT private key not found at {$path}");
        }

        $this->configuration = Configuration::forAsymmetricSigner(
            new Sha256(),
            InMemory::file($path),
            InMemory::file((string) config('jwt.public_key_path')),
        );

        return $this->configuration;
    }
}
