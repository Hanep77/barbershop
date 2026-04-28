<?php

namespace App\Http\Controllers;

use App\Models\Capster;
use App\Models\Barbershop;
use Illuminate\Http\Request;

class CapsterController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request, Barbershop $barbershop = null)
    {
        try {
            if (!$barbershop) {
                $barbershop = $request->user()->barbershop;
            }

            if (!$barbershop) {
                return response()->json([
                    "message" => "Barbershop not found",
                ], 404);
            }

            $capsters = Capster::where("barbershop_id", $barbershop->id)->get();

            return response()->json([
                "message" => "Capsters fetched successfully",
                "capsters" => $capsters,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                "message" => "Failed to fetch capsters",
                "error" => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {

            $barbershop = $request->user()->barbershop;
            if (!$barbershop) {
                return response()->json([
                    "message" => "Barbershop not found for the authenticated user",
                ], 404);
            }


            $capster = $request->validate([
                "name" => "required|string|max:255",
                "is_available" => "boolean",
                "title" => "string|max:255",
                "experience" => "string|max:255",
                "rating" => "numeric|min:0|max:5",
                "specialties" => "array",
                "specialties.*" => "string",
                "bio" => "string",
                "phone" => "string|max:20",
                "image" => "string|max:255",
            ]);

            $capster["barbershop_id"] = $barbershop->id;
            $capster["rating"] = $capster["rating"] ?? 0.0;
            $capster["image"] = $capster["image"] ?? "https://ui-avatars.com/api/?name=" . urlencode($capster["name"]);

            $newCapster = Capster::create($capster);

            return response()->json([
                "message" => "Capster created successfully",
                "capster" => $newCapster,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                "message" => "Failed to create capster",
                "error" => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Capster $capster)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Capster $capster)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Capster $capster)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Capster $capster)
    {
        //
    }

    public function toggleStatus(Capster $capster)
    {
        try {
            $capster->is_available = !$capster->is_available;
            $capster->save();

            return response()->json([
                "message" => "Capster status updated successfully",
                // "capster" => $capster,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                "message" => "Failed to update capster status",
                "error" => $e->getMessage(),
            ], 500);
        }
    }
}
