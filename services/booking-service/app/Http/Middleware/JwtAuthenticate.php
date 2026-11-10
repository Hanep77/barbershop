<?php

namespace App\Http\Middleware;

use App\Support\Jwt\JwtVerifier;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class JwtAuthenticate
{
    public function __construct(private readonly JwtVerifier $verifier)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $token = $this->bearerToken($request) ?? $request->cookie('access_token');

        if (! $token) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        try {
            $context = $this->verifier->verify($token);
        } catch (Throwable) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->attributes->set('auth_context', $context);
        $request->setUserResolver(fn () => $context);

        return $next($request);
    }

    private function bearerToken(Request $request): ?string
    {
        $header = (string) $request->header('Authorization', '');

        if (str_starts_with($header, 'Bearer ')) {
            $token = trim(substr($header, 7));

            return $token === '' ? null : $token;
        }

        return null;
    }
}
