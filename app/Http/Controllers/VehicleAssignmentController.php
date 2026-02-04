<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\VehicleAssignment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VehicleAssignmentController extends Controller
{
    public function index()
    {
        $participants = User::with('userType')
            ->orderBy('name')
            ->get()
            ->filter(function (User $user) {
                $name = strtoupper($user->userType?->name ?? '');
                $slug = strtoupper($user->userType?->slug ?? '');

                return $name !== 'CHED' && $slug !== 'CHED';
            })
            ->map(fn (User $user) => [
                'id' => $user->id,
                'full_name' => $user->name,
                'email' => $user->email,
            ])
            ->values();

        $assignments = VehicleAssignment::with('user')
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
                'vehicle_label' => $assignment->vehicle_label,
                'pickup_status' => $assignment->pickup_status,
                'pickup_location' => $assignment->pickup_location,
                'pickup_at' => $assignment->pickup_at?->toISOString(),
                'dropoff_location' => $assignment->dropoff_location,
                'dropoff_at' => $assignment->dropoff_at?->toISOString(),
                'updated_at' => $assignment->updated_at?->toISOString(),
            ]);

        return Inertia::render('vehicle-management', [
            'participants' => $participants,
            'assignments' => $assignments,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'vehicle_label' => ['required', 'string', 'max:255'],
            'pickup_status' => ['required', 'in:pending,picked_up,dropped_off'],
            'pickup_location' => ['nullable', 'string', 'max:255'],
            'pickup_at' => ['nullable', 'date'],
            'dropoff_location' => ['nullable', 'string', 'max:255'],
            'dropoff_at' => ['nullable', 'date'],
        ]);

        VehicleAssignment::create($validated);

        return back();
    }
}
