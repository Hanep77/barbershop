<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Pusher\Pusher;

class BroadcastAuthController extends Controller
{
    public function authenticate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'socket_id' => ['required', 'string'],
            'channel_name' => ['required', 'string'],
        ]);

        $user = $request->user();
        $channel = $validated['channel_name'];

        if (str_starts_with($channel, 'private-notifications.')) {
            $target = substr($channel, strlen('private-notifications.'));

            if ($target !== $user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        } elseif (str_starts_with($channel, 'private-App.Models.User.')) {
            $target = substr($channel, strlen('private-App.Models.User.'));

            if ($target !== $user->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        } elseif (! str_starts_with($channel, 'private-')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $key = (string) config('services.pusher.key');
        $secret = (string) config('services.pusher.secret');
        $appId = (string) config('services.pusher.app_id');

        if ($key === '' || $secret === '' || $appId === '') {
            return response()->json(['message' => 'Realtime notifications are not configured'], 503);
        }

        $pusher = new Pusher($key, $secret, $appId, [
            'cluster' => (string) config('services.pusher.cluster'),
            'useTLS' => true,
        ]);

        $auth = $pusher->authorizeChannel($channel, $validated['socket_id']);

        return response()->json(json_decode($auth, true));
    }
}
