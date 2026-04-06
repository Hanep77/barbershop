<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Socialite;

class SocialiteController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->redirect()->getTargetUrl();
    }

    public function callback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect(env('FRONTEND_URL') . '/login?error=google_failed');
        }

        // Cek apakah google_id sudah ada
        $user = User::where('google_id', $googleUser->getId())->first();

        if (!$user) {
            // Cek apakah email sudah terdaftar → link ke akun yang ada
            $user = User::where('email', $googleUser->getEmail())->first();

            if ($user) {
                // Link google_id ke akun yang ada
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                ]);
            } else {
                // Buat akun baru
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                ]);
            }
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect(env('FRONTEND_URL') . '/auth/callback');
    }
}
