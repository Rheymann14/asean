<?php

namespace App\Http\Controllers;

use App\Models\TransportVehicle;
use Illuminate\Http\Request;

class TransportVehicleController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'plate_number' => ['nullable', 'string', 'max:255'],
            'capacity' => ['nullable', 'integer', 'min:1'],
        ]);

        TransportVehicle::create($validated);

        return back();
    }
}
