<?php

namespace App\Http\Controllers;

use App\Models\ParticipantTable;
use App\Models\ParticipantTableAssignment;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TableAssignmentController extends Controller
{
    public function index()
    {
        $tables = ParticipantTable::with(['assignments.user.country', 'assignments.user.userType'])
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

        $assignedIds = ParticipantTableAssignment::query()->pluck('user_id');

        $participants = User::query()
            ->with(['country', 'userType'])
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
        ]);
    }

    public function storeTable(Request $request)
    {
        $validated = $request->validate([
            'table_number' => ['required', 'string', 'max:50', 'unique:participant_tables,table_number'],
            'capacity' => ['required', 'integer', 'min:1'],
        ]);

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
            'participant_table_id' => ['required', 'exists:participant_tables,id'],
            'participant_ids' => ['required', 'array', 'min:1'],
            'participant_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $table = ParticipantTable::withCount('assignments')->findOrFail($validated['participant_table_id']);
        $participantIds = collect($validated['participant_ids'])->unique()->values();

        $eligibleIds = User::query()
            ->whereIn('id', $participantIds)
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
        $participantTableAssignment->delete();

        return back();
    }
}
