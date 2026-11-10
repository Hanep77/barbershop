<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards /internal/* endpoints. These routes are also kept off the
 * public Traefik router, so this is defense in depth.
 */
class InternalOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        $expected = (string) config('services.internal.token');
        $provided = (string) $request->header('X-Internal-Token', '');

        if ($expected === '' || $provided === '' || ! hash_equals($expected, $provided)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
