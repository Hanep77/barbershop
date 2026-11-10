<?php

namespace App\Support\Jwt;

use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class TokenService
{
    public function __construct(private readonly JwtIssuer $issuer)
    {
    }

    /**
     * @return array{access_token:string,refresh_token:string,token_type:string,expires_in:int}
     */
    public function issuePair(User $user, Request $request): array
    {
        $refresh = $this->createRefreshToken($user, $request);

        return [
            'access_token' => $this->issuer->issue($user),
            'refresh_token' => $refresh,
            'token_type' => 'Bearer',
            'expires_in' => $this->issuer->expiresIn(),
        ];
    }

    public function rotate(string $rawToken, Request $request): array
    {
        return DB::transaction(function () use ($rawToken, $request): array {
            $record = RefreshToken::query()
                ->where('token_hash', hash('sha256', $rawToken))
                ->lockForUpdate()
                ->first();

            if (! $record || ! $record->isUsable() || ! $record->user) {
                throw new \RuntimeException('Invalid refresh token');
            }

            $user = $record->user;

            $record->forceFill(['revoked_at' => now()])->save();

            $pair = $this->issuePair($user, $request);

            $newRecord = RefreshToken::query()
                ->where('token_hash', hash('sha256', $pair['refresh_token']))
                ->first();

            if ($newRecord) {
                $record->forceFill(['replaced_by' => $newRecord->id])->save();
            }

            return ['user' => $user] + $pair;
        });
    }

    public function revoke(string $rawToken): void
    {
        $record = $this->findUsable($rawToken);

        if ($record) {
            $record->forceFill(['revoked_at' => now()])->save();
        }
    }

    public function revokeAllFor(User $user): void
    {
        RefreshToken::query()
            ->where('user_id', $user->id)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }

    private function createRefreshToken(User $user, Request $request): string
    {
        $raw = bin2hex(random_bytes(32));

        RefreshToken::query()->create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $raw),
            'expires_at' => now()->addSeconds((int) config('jwt.refresh_ttl', 604800)),
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 500),
        ]);

        return $raw;
    }

    private function findUsable(string $rawToken): ?RefreshToken
    {
        if ($rawToken === '') {
            return null;
        }

        $record = RefreshToken::query()
            ->where('token_hash', hash('sha256', $rawToken))
            ->first();

        return $record && $record->isUsable() ? $record : null;
    }
}
