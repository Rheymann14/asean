<?php

namespace App\Http\Controllers;

use App\Models\ParticipantTable;
use App\Models\ParticipantTableAssignment;
use App\Models\Programme;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TableAssignmentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $user->loadMissing('userType');
        $roleName = Str::upper((string) ($user->userType->name ?? ''));
        $roleSlug = Str::upper((string) ($user->userType->slug ?? ''));
        $isChed = in_array('CHED', [$roleName, $roleSlug], true);

        if (! $isChed) {
            return $this->participantIndex($request);
        }

        $events = Programme::query()
            ->orderBy('starts_at')
            ->orderBy('title')
            ->get();

        $now = now();
        $defaultEvent = $events->first(fn (Programme $event) => $this->isProgrammeOpen($event, $now));

        $selectedEventId = (int) $request->input('event_id', $defaultEvent?->id ?? $events->first()?->id);

        $tables = ParticipantTable::with(['assignments.user.country', 'assignments.user.userType'])
            ->when($selectedEventId, fn ($query) => $query->where('programme_id', $selectedEventId))
            ->orderBy('table_number')
            ->get()
            ->map(function (ParticipantTable $table) {
                return [
                    'id' => $table->id,
                    'table_number' => $table->table_number,
                    'capacity' => $table->capacity,
                    'assigned_count' => $table->assignments->count(),
                    'assignments' => $table->assignments
                        ->sortBy('assigned_at')
                        ->values()
                        ->map(function (ParticipantTableAssignment $assignment) {
                            $participant = $assignment->user;

                            return [
                                'id' => $assignment->id,
                                'assigned_at' => $assignment->assigned_at?->toISOString(),
                                'participant' => $participant
                                    ? [
                                        'id' => $participant->id,
                                        'full_name' => $participant->name,
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
                                    ]
                                    : null,
                            ];
                        }),
                ];
            });

        $assignedIds = ParticipantTableAssignment::query()
            ->when($selectedEventId, fn ($query) => $query->where('programme_id', $selectedEventId))
            ->pluck('user_id');

        $participants = User::query()
            ->with(['country', 'userType'])
            ->when(
                $selectedEventId,
                fn ($query) => $query->whereHas('joinedProgrammes', fn ($subQuery) => $subQuery->where('programmes.id', $selectedEventId))
            )
            ->when(
                $assignedIds->isNotEmpty(),
                fn ($query) => $query->whereNotIn('id', $assignedIds)
            )
            ->where(function ($query) {
                $query->whereDoesntHave('userType')
                    ->orWhereHas('userType', function ($subQuery) {
                        $subQuery->where(function ($nameQuery) {
                            $nameQuery->whereNull('name')->orWhere('name', '!=', 'CHED');
                        })->where(function ($slugQuery) {
                            $slugQuery->whereNull('slug')->orWhere('slug', '!=', 'CHED');
                        });
                    });
            })
            ->orderBy('name')
            ->get()
            ->map(function (User $participant) {
                return [
                    'id' => $participant->id,
                    'full_name' => $participant->name,
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
                ];
            });

        return Inertia::render('table-assignmeny', [
            'tables' => $tables,
            'participants' => $participants,
            'events' => $events->map(fn (Programme $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'starts_at' => $event->starts_at?->toISOString(),
                'ends_at' => $event->ends_at?->toISOString(),
                'is_active' => $event->is_active,
            ]),
            'selected_event_id' => $selectedEventId ?: null,
        ]);
    }

    private function participantIndex(Request $request)
    {
        $participant = $request->user();

        $events = $participant->joinedProgrammes()
            ->with('venue')
            ->orderBy('starts_at')
            ->orderBy('title')
            ->get();

        $assignments = ParticipantTableAssignment::query()
            ->with(['participantTable', 'programme.venue'])
            ->where('user_id', $participant->id)
            ->get()
            ->keyBy('programme_id');

        $eventRows = $events->map(function (Programme $event) use ($assignments) {
            $venueName = trim((string) ($event->venue?->name ?? ''));
            $venueAddress = trim((string) ($event->venue?->address ?? ''));
            $venueLabel = $venueName && $venueAddress ? "{$venueName} • {$venueAddress}" : ($venueName ?: $venueAddress);
            $assignment = $assignments->get($event->id);
            $table = $assignment?->participantTable;

            return [
                'id' => $event->id,
                'title' => $event->title,
                'starts_at' => $event->starts_at?->toISOString(),
                'ends_at' => $event->ends_at?->toISOString(),
                'location' => $venueLabel ?: $event->location,
                'table' => $table
                    ? [
                        'table_number' => $table->table_number,
                        'capacity' => $table->capacity,
                        'assigned_at' => $assignment?->assigned_at?->toISOString(),
                    ]
                    : null,
            ];
        });

        return Inertia::render('participant-table-assignment', [
            'events' => $eventRows,
        ]);
    }

    public function storeTable(Request $request)
    {
        $validated = $request->validate([
            'programme_id' => ['required', 'exists:programmes,id'],
            'table_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique('participant_tables', 'table_number')->where('programme_id', $request->input('programme_id')),
            ],
            'capacity' => ['required', 'integer', 'min:1'],
        ]);

        $validated['table_number'] = trim($validated['table_number']);

        ParticipantTable::create($validated);

        return back();
    }

    public function updateTable(Request $request, ParticipantTable $participantTable)
    {
        $validated = $request->validate([
            'capacity' => ['required', 'integer', 'min:1'],
        ]);

        $participantTable->update([
            'capacity' => $validated['capacity'],
        ]);

        return back();
    }

    public function storeAssignments(Request $request)
    {
        $validated = $request->validate([
            'programme_id' => ['required', 'exists:programmes,id'],
            'participant_table_id' => [
                'required',
                Rule::exists('participant_tables', 'id')->where('programme_id', $request->input('programme_id')),
            ],
            'participant_ids' => ['required', 'array', 'min:1'],
            'participant_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $programme = Programme::query()->find($validated['programme_id']);
        if ($programme && ! $this->isProgrammeOpen($programme, now())) {
            return back()->withErrors([
                'programme_id' => 'This event is closed.',
            ]);
        }

        $table = ParticipantTable::withCount('assignments')
            ->where('programme_id', $validated['programme_id'])
            ->findOrFail($validated['participant_table_id']);
        $participantIds = collect($validated['participant_ids'])->unique()->values();

        $eligibleIds = User::query()
            ->whereIn('id', $participantIds)
            ->whereHas('joinedProgrammes', fn ($query) => $query->where('programmes.id', $validated['programme_id']))
            ->where(function ($query) {
                $query->whereDoesntHave('userType')
                    ->orWhereHas('userType', function ($subQuery) {
                        $subQuery->where(function ($nameQuery) {
                            $nameQuery->whereNull('name')->orWhere('name', '!=', 'CHED');
                        })->where(function ($slugQuery) {
                            $slugQuery->whereNull('slug')->orWhere('slug', '!=', 'CHED');
                        });
                    });
            })
            ->pluck('id');

        $alreadyAssignedIds = ParticipantTableAssignment::query()
            ->whereIn('user_id', $eligibleIds)
            ->where('programme_id', $validated['programme_id'])
            ->pluck('user_id');

        $newIds = $eligibleIds->diff($alreadyAssignedIds)->values();

        if ($newIds->isEmpty()) {
            return back();
        }

        $availableSeats = $table->capacity - $table->assignments_count;

        if ($availableSeats < $newIds->count()) {
            return back()->withErrors([
                'participant_ids' => 'Not enough available seats for this table.',
            ]);
        }

        $now = now();

        $payload = $newIds->map(fn ($id) => [
            'programme_id' => $validated['programme_id'],
            'participant_table_id' => $table->id,
            'user_id' => $id,
            'assigned_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        ParticipantTableAssignment::insert($payload->all());

        return back();
    }

    public function destroyAssignment(ParticipantTableAssignment $participantTableAssignment)
    {
        $programme = $participantTableAssignment->programme;
        if ($programme && ! $this->isProgrammeOpen($programme, now())) {
            return back()->withErrors([
                'assignment' => 'This event is closed.',
            ]);
        }

        $participantTableAssignment->delete();

        return back();
    }

    private function isProgrammeOpen(Programme $event, $now): bool
    {
        if (! $event->is_active) {
            return false;
        }

        $startsAt = $event->starts_at;
        $endsAt = $event->ends_at;

        if ($startsAt && $startsAt->isAfter($now)) {
            return false;
        }

        return ! $endsAt || $endsAt->isAfter($now) || $endsAt->equalTo($now);
    }
}
