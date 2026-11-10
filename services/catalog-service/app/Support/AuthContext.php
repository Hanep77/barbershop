<?php

namespace App\Support;

/**
 * Authenticated principal derived from a verified JWT.
 *
 * Services must not read the identity database. Everything needed for
 * authorization must come from the token claims.
 */
final class AuthContext
{
    public function __construct(
        public readonly string $id,
        public readonly string $role,
        public readonly string $name = '',
        public readonly string $email = '',
        public readonly ?string $avatar = null,
        public readonly array $claims = [],
    ) {
    }

    public function is(string $role): bool
    {
        return $this->role === $role;
    }

    public function claim(string $key, mixed $default = null): mixed
    {
        return $this->claims[$key] ?? $default;
    }
}
