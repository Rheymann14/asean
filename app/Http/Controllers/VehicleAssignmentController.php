<?php

namespace App\Http\Controllers;

use App\Models\Programme;
use App\Models\TransportVehicle;
use App\Models\User;
use App\Models\UserType;
use App\Models\VehicleAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class VehicleAssignmentController extends Controller
{
    public function managementIndex(Request $request)
    {
        $events = Programme::query()->orderBy('starts_at')->orderBy('title')->get();
        $selectedEventId = (int) $request->input('event_id', $events->first()?->id);

        $vehicles = TransportVehicle::query()
            ->with(['incharge'])
            ->when($selectedEventId, fn ($query) => $query->where('programme_id', $selectedEventId))
            ->orderBy('label')
            ->get()
            ->map(fn (TransportVehicle $vehicle) => [
                'id' => $vehicle->id,
                'label' => $vehicle->label,
                'driver_name' => $vehicle->driver_name,
                'driver_contact_number' => $vehicle->driver_contact_number,
                'incharge' => $vehicle->incharge
                    ? [
                        'id' => $vehicle->incharge->id,
                        'full_name' => $vehicle->incharge->name,
                        'email' => $vehicle->incharge->email,
                    ]
                    : null,
                'created_at' => $vehicle->created_at?->toISOString(),
            ]);

        $chedLoTypeIds = UserType::query()
            ->get()
            ->filter(fn (UserType $type) => $this->matchesChedLo((string) $type->name) || $this->matchesChedLo((string) $type->slug))
            ->pluck('id')
            ->values();

        $chedLoUsers = User::query()
            ->with('userType')
            ->when(
                $chedLoTypeIds->isNotEmpty(),
                fn ($query) => $query->whereIn('user_type_id', $chedLoTypeIds),
                fn ($query) => $query->whereHas('userType', function ($subQuery) {
                    $subQuery->where(function ($q) {
                        $q->whereRaw("UPPER(REPLACE(REPLACE(COALESCE(name, ''), '-', ''), '_', '')) LIKE 'CHEDLO%'")
                            ->orWhereRaw("UPPER(COALESCE(name, '')) LIKE 'CHED LIAISON%'")
                            ->orWhereRaw("UPPER(REPLACE(REPLACE(COALESCE(slug, ''), '-', ''), '_', '')) LIKE 'CHEDLO%'")
                            ->orWhereRaw("UPPER(COALESCE(slug, '')) LIKE 'CHED LIAISON%'");
                    });
                })
            )
            ->orderBy('name')
            ->get()
            ->filter(fn (User $user) => $this->isChedLoType($user))
            ->map(fn (User $user) => [
                'id' => $user->id,
                'full_name' => $user->name,
                'email' => $user->email,
            ])
            ->values();

        return Inertia::render('vehicle-management', [
            'events' => $events->map(fn (Programme $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'starts_at' => $event->starts_at?->toISOString(),
                'ends_at' => $event->ends_at?->toISOString(),
                'is_active' => (bool) $event->is_active,
            ]),
            'selected_event_id' => $selectedEventId ?: null,
            'vehicles' => $vehicles,
            'ched_lo_users' => $chedLoUsers,
        ]);
    }

    public function assignmentIndex(Request $request)
    {
        $events = Programme::query()->orderBy('starts_at')->orderBy('title')->get();
        $selectedEventId = (int) $request->input('event_id', $events->first()?->id);

        $vehicles = TransportVehicle::query()
            ->with('incharge')
            ->when($selectedEventId, fn ($query) => $query->where('programme_id', $selectedEventId))
            ->orderBy('label')
            ->get()
            ->map(fn (TransportVehicle $vehicle) => [
                'id' => $vehicle->id,
                'label' => $vehicle->label,
                'driver_name' => $vehicle->driver_name,
                'driver_contact_number' => $vehicle->driver_contact_number,
                'incharge' => $vehicle->incharge
                    ? [
                        'id' => $vehicle->incharge->id,
                        'full_name' => $vehicle->incharge->name,
                    ]
                    : null,
            ]);

        $participants = User::query()
            ->with(['country', 'userType'])
            ->when(
                $selectedEventId,
                fn ($query) => $query->whereHas('joinedProgrammes', fn ($subQuery) => $subQuery->where('programmes.id', $selectedEventId))
            )
            ->where(function ($query) {
                $query->whereDoesntHave('userType')
                    ->orWhereHas('userType', function ($subQuery) {
                        $subQuery->where(function ($nameQuery) {
                            $nameQuery->whereNull('name')->orWhereRaw("UPPER(name) NOT LIKE 'CHED%'");
                        })->where(function ($slugQuery) {
                            $slugQuery->whereNull('slug')->orWhereRaw("UPPER(slug) NOT LIKE 'CHED%'");
                        });
                    });
            })
            ->orderBy('name')
            ->get()
            ->map(function (User $participant) use ($selectedEventId) {
                $assignment = VehicleAssignment::query()
                    ->with('vehicle')
                    ->where('programme_id', $selectedEventId)
                    ->where('user_id', $participant->id)
                    ->first();

                return [
                    'id' => $participant->id,
                    'full_name' => $participant->name,
                    'email' => $participant->email,
                    'country' => $participant->country
                        ? [
                            'id' => $participant->country->id,
                            'code' => $participant->country->code,
                            'name' => $participant->country->name,
                            'flag_url' => $participant->country->flag_url,
                        ]
                        : null,
                    'user_type' => $participant->userType
                        ? [
                            'id' => $participant->userType->id,
                            'name' => $participant->userType->name,
                            'slug' => $participant->userType->slug,
                        ]
                        : null,
                    'assignment' => $assignment
                        ? [
                            'id' => $assignment->id,
                            'vehicle_id' => $assignment->vehicle_id,
                            'vehicle_label' => $assignment->vehicle?->label ?: $assignment->vehicle_label,
                            'pickup_status' => $assignment->pickup_status,
                            'pickup_location' => $assignment->pickup_location,
                            'pickup_at' => $assignment->pickup_at?->toISOString(),
                            'dropoff_location' => $assignment->dropoff_location,
                            'dropoff_at' => $assignment->dropoff_at?->toISOString(),
                        ]
                        : null,
                ];
            });

        return Inertia::render('vehicle-assignment', [
            'events' => $events->map(fn (Programme $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'starts_at' => $event->starts_at?->toISOString(),
                'ends_at' => $event->ends_at?->toISOString(),
                'is_active' => (bool) $event->is_active,
            ]),
            'selected_event_id' => $selectedEventId ?: null,
            'vehicles' => $vehicles,
            'participants' => $participants,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'programme_id' => ['required', 'exists:programmes,id'],
            'vehicle_id' => [
                'required',
                Rule::exists('transport_vehicles', 'id')->where('programme_id', $request->input('programme_id')),
            ],
            'participant_ids' => ['required', 'array', 'min:1'],
            'participant_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $vehicle = TransportVehicle::query()->findOrFail($validated['vehicle_id']);

        $participantIds = collect($validated['participant_ids'])->unique()->values();

        foreach ($participantIds as $participantId) {
            VehicleAssignment::updateOrCreate(
                [
                    'programme_id' => $validated['programme_id'],
                    'user_id' => $participantId,
                ],
                [
                    'vehicle_id' => $vehicle->id,
                    'driver_user_id' => $vehicle->incharge_user_id,
                    'vehicle_label' => $vehicle->label,
                ],
            );
        }

        return back();
    }

    public function destroy(VehicleAssignment $vehicleAssignment)
    {
        $vehicleAssignment->delete();

        return back();
    }

    public function storePickup(Request $request, VehicleAssignment $vehicleAssignment)
    {
        $validated = $request->validate([
            'pickup_location' => ['required', 'string', 'max:255'],
            'pickup_at' => ['required', 'date'],
        ]);

        $vehicleAssignment->update([
            'pickup_location' => $validated['pickup_location'],
            'pickup_at' => $validated['pickup_at'],
            'pickup_status' => 'picked_up',
        ]);

        return back();
    }

    public function storeDropoff(Request $request, VehicleAssignment $vehicleAssignment)
    {
        $validated = $request->validate([
            'dropoff_location' => ['required', 'string', 'max:255'],
            'dropoff_at' => ['required', 'date'],
        ]);

        $vehicleAssignment->update([
            'dropoff_location' => $validated['dropoff_location'],
            'dropoff_at' => $validated['dropoff_at'],
            'pickup_status' => 'dropped_off',
        ]);

        return back();
    }

    private function isChedLoType(User $user): bool
    {
        return $this->matchesChedLo((string) $user->userType?->name)
            || $this->matchesChedLo((string) $user->userType?->slug);
    }

    private function matchesChedLo(string $value): bool
    {
        $normalized = Str::of($value)
            ->upper()
            ->replace(['_', '-'], ' ')
            ->replaceMatches('/\s+/', ' ')
            ->trim();

        $compact = Str::of((string) $normalized)->replace(' ', '');

        return $normalized === 'CHED LO'
            || $normalized === 'CHEDLO'
            || $normalized->startsWith('CHED LO ')
            || $compact->startsWith('CHEDLO')
            || $normalized->startsWith('CHED LIAISON')
            || $compact->startsWith('CHEDLIAISON');
    }
}
