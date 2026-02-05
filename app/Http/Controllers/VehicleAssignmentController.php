<?php

namespace App\Http\Controllers;

use App\Models\TransportVehicle;
use App\Models\User;
use App\Models\VehicleAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class VehicleAssignmentController extends Controller
{
    public function index()
    {
        $participants = User::with('userType')
            ->orderBy('name')
            ->get()
            ->filter(fn (User $user) => ! $this->isChedAdminType($user))
            ->map(fn (User $user) => [
                'id' => $user->id,
                'full_name' => $user->name,
                'email' => $user->email,
            ])
            ->values();

        $vehicles = TransportVehicle::query()
            ->latest('created_at')
            ->get()
            ->map(fn (TransportVehicle $vehicle) => [
                'id' => $vehicle->id,
                'label' => $vehicle->label,
                'plate_number' => $vehicle->plate_number,
                'capacity' => $vehicle->capacity,
            ]);

        $drivers = User::with('userType')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'full_name' => $user->name,
                'email' => $user->email,
            ])
            ->values();

        $assignments = VehicleAssignment::with(['user', 'driver', 'vehicle'])
            ->latest('updated_at')
            ->get()
            ->map(fn (VehicleAssignment $assignment) => [
                'id' => $assignment->id,
                'participant' => $assignment->user
                    ? [
                        'id' => $assignment->user->id,
                        'full_name' => $assignment->user->name,
                        'email' => $assignment->user->email,
                    ]
                    : null,
                'driver' => $assignment->driver
                    ? [
                        'id' => $assignment->driver->id,
                        'full_name' => $assignment->driver->name,
                        'email' => $assignment->driver->email,
                    ]
                    : null,
                'vehicle' => $assignment->vehicle
                    ? [
                        'id' => $assignment->vehicle->id,
                        'label' => $assignment->vehicle->label,
                        'plate_number' => $assignment->vehicle->plate_number,
                        'capacity' => $assignment->vehicle->capacity,
                    ]
                    : null,
                'vehicle_label' => $assignment->vehicle_label,
                'pickup_status' => $assignment->pickup_status,
                'pickup_location' => $assignment->pickup_location,
                'pickup_at' => $assignment->pickup_at?->toISOString(),
                'dropoff_location' => $assignment->dropoff_location,
                'dropoff_at' => $assignment->dropoff_at?->toISOString(),
                'notify_admin' => $assignment->notify_admin,
                'updated_at' => $assignment->updated_at?->toISOString(),
            ]);

        return Inertia::render('vehicle-management', [
            'participants' => $participants,
            'drivers' => $drivers,
            'vehicles' => $vehicles,
            'assignments' => $assignments,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'vehicle_id' => ['required', 'exists:transport_vehicles,id'],
            'driver_user_id' => ['required', 'exists:users,id'],
            'vehicle_label' => ['nullable', 'string', 'max:255'],
            'pickup_status' => ['required', 'in:pending,picked_up,dropped_off'],
            'pickup_location' => ['nullable', 'string', 'max:255'],
            'pickup_at' => ['nullable', 'date'],
            'dropoff_location' => ['nullable', 'string', 'max:255'],
            'dropoff_at' => ['nullable', 'date'],
            'notify_admin' => ['nullable', 'boolean'],
        ]);

        VehicleAssignment::create($validated + [
            'vehicle_label' => $validated['vehicle_label'] ?: optional(
                TransportVehicle::find($validated['vehicle_id'])
            )->label,
            'notify_admin' => $validated['notify_admin'] ?? false,
        ]);

        return back();
    }


    private function isChedAdminType(User $user): bool
    {
        $value = Str::of((string) ($user->userType?->slug ?: $user->userType?->name))
            ->upper()
            ->replace(['_', '-'], ' ')
            ->trim();

        return $value === 'CHED' || $value->startsWith('CHED ');
    }
}
