<?php

namespace App\Http\Controllers;

use App\Models\Barbershop;
use App\Models\BarbershopImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BarbershopImageController extends Controller
{
    public function index(Request $request)
    {
        $barbershop = $this->getOwnedBarbershop($request);

        if (!$barbershop) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        return response()->json([
            'images' => $barbershop->images()->orderByDesc('is_primary')->latest()->get(),
        ]);
    }

    public function publicIndex(Barbershop $barbershop)
    {
        return response()->json([
            'images' => $barbershop->images()->orderByDesc('is_primary')->latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $barbershop = $this->getOwnedBarbershop($request);

        if (!$barbershop) {
            return response()->json(['message' => 'Barbershop not found'], 404);
        }

        $validated = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $file = $validated['image'];
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs("barbershops/{$barbershop->id}/gallery", $filename, 'public');

        try {
            $image = DB::transaction(function () use ($barbershop, $path) {
                $hasPrimary = $barbershop->images()->where('is_primary', true)->exists();

                return $barbershop->images()->create([
                    'image_url' => Storage::url($path),
                    'is_primary' => !$hasPrimary,
                ]);
            });
        } catch (\Throwable $e) {
            Storage::disk('public')->delete($path);
            throw $e;
        }

        return response()->json([
            'message' => 'Image uploaded successfully',
            'image' => $image,
        ], 201);
    }

    public function setPrimary(Request $request, BarbershopImage $image)
    {
        $barbershop = $this->getOwnedBarbershop($request);

        if (!$barbershop || $image->barbershop_id !== $barbershop->id) {
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

    public function destroy(Request $request, BarbershopImage $image)
    {
        $barbershop = $this->getOwnedBarbershop($request);

        if (!$barbershop || $image->barbershop_id !== $barbershop->id) {
            return response()->json(['message' => 'Image not found'], 404);
        }

        DB::transaction(function () use ($barbershop, $image) {
            $wasPrimary = $image->is_primary;
            $storagePath = Str::after($image->image_url, '/storage/');

            $image->delete();
            Storage::disk('public')->delete($storagePath);

            if ($wasPrimary) {
                $nextImage = $barbershop->images()->oldest()->first();
                $nextImage?->update(['is_primary' => true]);
            }
        });

        return response()->json(['message' => 'Image deleted successfully']);
    }

    private function getOwnedBarbershop(Request $request): ?Barbershop
    {
        return $request->user()?->barbershop()->first();
    }
}
