<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ResolvesOwnedBarbershop;
use App\Models\Barbershop;
use App\Models\BarbershopImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class BarbershopImageController extends Controller
{
    use ResolvesOwnedBarbershop;

    public function publicIndex(Barbershop $barbershop): JsonResponse
    {
        return response()->json([
            'images' => $barbershop->images()->orderByDesc('is_primary')->latest()->get(),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $barbershop = $this->ownedBarbershop($request);

        if (! $barbershop) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        return response()->json([
            'images' => $barbershop->images()->orderByDesc('is_primary')->latest()->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $barbershop = $this->ownedBarbershop($request);

        if (! $barbershop) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        $validated = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $file = $validated['image'];
        $filename = Str::uuid7()->toString().'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs("barbershops/{$barbershop->id}/gallery", $filename, 'public');

        try {
            $image = DB::transaction(function () use ($barbershop, $path) {
                $hasPrimary = $barbershop->images()->where('is_primary', true)->exists();

                return $barbershop->images()->create([
                    'image_url' => Storage::disk('public')->url($path),
                    'is_primary' => ! $hasPrimary,
                ]);
            });
        } catch (Throwable $e) {
            Storage::disk('public')->delete($path);

            throw $e;
        }

        return response()->json([
            'message' => 'Image uploaded successfully',
            'image' => $image,
        ], 201);
    }

    public function setPrimary(Request $request, BarbershopImage $image): JsonResponse
    {
        $barbershop = $this->ownedBarbershop($request);

        if (! $barbershop || $image->barbershop_id !== $barbershop->id) {
            return response()->json(['message' => 'Image not found'], 404);
        }

        DB::transaction(function () use ($barbershop, $image) {
            $barbershop->images()->update(['is_primary' => false]);
            $image->update(['is_primary' => true]);
        });

        return response()->json([
            'message' => 'Primary image updated successfully',
            'image' => $image->fresh(),
        ]);
    }

    public function destroy(Request $request, BarbershopImage $image): JsonResponse
    {
        $barbershop = $this->ownedBarbershop($request);

        if (! $barbershop || $image->barbershop_id !== $barbershop->id) {
            return response()->json(['message' => 'Image not found'], 404);
        }

        $storagePath = $this->storagePath($image->image_url);

        DB::transaction(function () use ($barbershop, $image) {
            $wasPrimary = $image->is_primary;

            $image->delete();

            if ($wasPrimary) {
                $barbershop->images()->oldest()->first()?->update(['is_primary' => true]);
            }
        });

        if ($storagePath !== null) {
            Storage::disk('public')->delete($storagePath);
        }

        return response()->json(['message' => 'Image deleted successfully']);
    }

    private function storagePath(string $url): ?string
    {
        $path = parse_url($url, PHP_URL_PATH);

        if (! is_string($path) || $path === '') {
            $path = $url;
        }

        $path = ltrim($path, '/');

        if (str_contains($path, 'storage/')) {
            $path = Str::after($path, 'storage/');
        }

        return $path === '' ? null : $path;
    }
}
