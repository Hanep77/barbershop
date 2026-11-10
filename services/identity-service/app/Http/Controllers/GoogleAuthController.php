<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Jwt\TokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    public function __construct(private readonly TokenService $tokens)
    {
    }

    public function redirect(): JsonResponse
    {
        $clientId = (string) config('services.google.client_id');
        $redirectUri = (string) config('services.google.redirect');

        if ($clientId === '' || $redirectUri === '') {
            return response()->json(['message' => 'Google OAuth is not configured'], 503);
        }

        $state = Str::random(48);
        Cache::put('oauth_state:'.$state, true, now()->addMinutes(10));

        $query = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'access_type' => 'online',
            'prompt' => 'select_account',
        ]);

        return response()->json([
            'url' => 'https://accounts.google.com/o/oauth2/v2/auth?'.$query,
        ]);
    }

    public function callback(Request $request)
    {
        $frontend = rtrim((string) env('FRONTEND_URL', config('app.url')), '/');

        $state = (string) $request->query('state', '');
        $code = (string) $request->query('code', '');

        if ($state === '' || ! Cache::pull('oauth_state:'.$state)) {
            return redirect($frontend.'/login?error=google_failed');
        }

        if ($code === '') {
            return redirect($frontend.'/login?error=google_failed');
        }

        try {
            $tokenResponse = Http::asForm()->acceptJson()->timeout(10)->post('https://oauth2.googleapis.com/token', [
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'redirect_uri' => config('services.google.redirect'),
                'grant_type' => 'authorization_code',
                'code' => $code,
            ])->throw()->json();

            $profile = Http::withToken($tokenResponse['access_token'])
                ->acceptJson()
                ->timeout(10)
                ->get('https://www.googleapis.com/oauth2/v3/userinfo')
                ->throw()
                ->json();
        } catch (\Throwable) {
            return redirect($frontend.'/login?error=google_failed');
        }

        $googleId = (string) ($profile['sub'] ?? '');
        $email = (string) ($profile['email'] ?? '');

        if ($googleId === '' || $email === '') {
            return redirect($frontend.'/login?error=google_failed');
        }

        $user = User::query()->where('google_id', $googleId)->first()
            ?? User::query()->where('email', $email)->first();

        if ($user) {
            $user->forceFill([
                'google_id' => $googleId,
                'avatar' => $profile['picture'] ?? $user->avatar,
            ])->save();
        } else {
            $user = User::query()->create([
                'name' => (string) ($profile['name'] ?? $email),
                'email' => $email,
                'google_id' => $googleId,
                'avatar' => $profile['picture'] ?? null,
                'role' => 'customer',
            ]);
        }

        $pair = $this->tokens->issuePair($user, $request);

        $fragment = http_build_query([
            'access_token' => $pair['access_token'],
            'refresh_token' => $pair['refresh_token'],
        ]);

        return redirect($frontend.'/auth/callback#'.$fragment);
    }
}
