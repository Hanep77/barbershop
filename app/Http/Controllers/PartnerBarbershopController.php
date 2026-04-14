<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Barbershop;
use App\Models\Transaction;


class PartnerBarbershopController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->barbershop()->exists()) {
            return response()->json([
                "barbershop" => $user->barbershop()->first(),
                "user" => $user->only("name", "email", "avatar")
            ], 200);
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
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request)
    {
        try {
            $findUserBarbershop = $request->user()->barbershop()->first();

            if (!$findUserBarbershop) {
                return response()->json([
                    "message" => "Barbershop not found for the user"
                ], 404);
            }

            $validatedData = $request->validate([
                "name" => "required|string|max:255",
                "address" => "required|string|max:255",
                "phone_number" => "required|string|max:20",
                "description" => "nullable|string",
                "map_url" => "nullable|url",
                "latitude" => "required|string",
                "longitude" => "required|string",
            ]);

            $findUserBarbershop->update($validatedData);

            return response()->json([
                "message" => "Barbershop updated successfully",
                "barbershop" => $findUserBarbershop
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                "message" => "Failed to update barbershop",
                "error" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
