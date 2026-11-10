<?php

namespace App\Support\Jwt;

use App\Support\AuthContext;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Key\InMemory;
use Lcobucci\JWT\Signer\Rsa\Sha256;
use Lcobucci\JWT\Token\Plain;
use Lcobucci\JWT\Validation\Constraint\IssuedBy;
use Lcobucci\JWT\Validation\Constraint\PermittedFor;
use Lcobucci\JWT\Validation\Constraint\SignedWith;
use Lcobucci\JWT\Validation\Constraint\StrictValidAt;
use RuntimeException;

/**
 * Verifies access tokens with the identity service public key.
 */
final class JwtVerifier
{
    private ?Configuration $configuration = null;

    public function verify(string $jwt): AuthContext
    {
        $token = $this->configuration()->parser()->parse($jwt);

        if (! $token instanceof Plain) {
            throw new RuntimeException('Unsupported token type');
        }

        $this->configuration()->validator()->assert(
            $token,
            new SignedWith($this->configuration()->signer(), $this->configuration()->verificationKey()),
            new IssuedBy((string) config('jwt.issuer')),
            new PermittedFor((string) config('jwt.audience')),
            new StrictValidAt(new UtcClock()),
        );

        $claims = $token->claims();

        $subject = (string) $claims->get('sub');
        $role = (string) ($claims->get('role') ?? '');

        if ($subject === '' || $role === '') {
            throw new RuntimeException('Token is missing required claims');
        }

        $all = $claims->all();

        return new AuthContext(
            id: $subject,
            role: $role,
            name: (string) ($claims->get('name') ?? ''),
            email: (string) ($claims->get('email') ?? ''),
            avatar: $claims->has('avatar') ? (string) $claims->get('avatar') : null,
            claims: $all,
        );
    }

    private function configuration(): Configuration
    {
        if ($this->configuration !== null) {
            return $this->configuration;
        }

        $path = (string) config('jwt.public_key_path');

        if (! is_file($path)) {
            throw new RuntimeException("JWT public key not found at {$path}");
        }

        $this->configuration = Configuration::forAsymmetricSigner(
            new Sha256(),
            InMemory::file($path),
            InMemory::file($path),
        );

        return $this->configuration;
    }
}
