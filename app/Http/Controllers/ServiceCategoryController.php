<?php

namespace App\Http\Controllers;

use App\Models\ServiceCategory;
use Illuminate\Http\Request;

class ServiceCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $categories = ServiceCategory::all();
            return response()->json([
                "message" => "Service categories fetched successfully",
                "categories" => $categories
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                "message" => "Failed to fetch service categories",
                "error" => $e->getMessage()
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
            $request->validate([
                "name" => "required|string|max:255",
            ]);

            $category = ServiceCategory::create([
                "name" => $request->name,
                "barbershop_id" => $request->user()->barbershop->id,
            ]);

            return response()->json([
                "message" => "Service category created successfully",
                "category" => $category
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                "message" => "Failed to create service category",
                "error" => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(ServiceCategory $serviceCategory)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ServiceCategory $serviceCategory)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ServiceCategory $serviceCategory)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ServiceCategory $serviceCategory)
    {
        //
    }
}
