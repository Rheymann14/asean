<?php

namespace App\Http\Controllers;

use App\Models\ParticipantAttendance;
use App\Models\Programme;
use App\Models\User;
use App\Models\UserType;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportsController extends Controller
{
    public function index()
    {
        $adminTypeId = UserType::query()
            ->where('slug', 'admin')
            ->orWhere('name', 'Admin')
            ->value('id');

        $excludeAdmin = function ($query) use ($adminTypeId) {
            if (! $adminTypeId) {
                return;
            }

            $query->where(function ($inner) use ($adminTypeId) {
                $inner->where('users.user_type_id', '!=', $adminTypeId)
                    ->orWhereNull('users.user_type_id');
            });
        };

        $events = Programme::query()
            ->orderBy('starts_at')
            ->get()
            ->map(fn (Programme $programme) => [
                'id' => $programme->id,
                'title' => $programme->title,
                'starts_at' => $programme->starts_at?->toISOString(),
                'ends_at' => $programme->ends_at?->toISOString(),
                'is_active' => (bool) $programme->is_active,
            ])
            ->values();

        $totalRegisteredParticipants = User::query()
            ->where('is_active', true)
            ->tap($excludeAdmin)
            ->count();

        $attendedParticipantIds = ParticipantAttendance::query()
            ->join('users', 'participant_attendances.user_id', '=', 'users.id')
            ->whereNotNull('participant_attendances.scanned_at')
            ->tap(function ($query) use ($excludeAdmin) {
                $excludeAdmin($query);
            })
            ->distinct()
            ->pluck('participant_attendances.user_id');

        $totalParticipantsAttended = $attendedParticipantIds->count();

        $totalParticipantsDidNotJoin = max(0, $totalRegisteredParticipants - $totalParticipantsAttended);

        $joinedByUser = DB::table('participant_programmes')
            ->join('users', 'participant_programmes.user_id', '=', 'users.id')
            ->where('users.is_active', true)
            ->tap($excludeAdmin)
            ->select('participant_programmes.user_id', 'participant_programmes.programme_id')
            ->get()
            ->groupBy('user_id')
            ->map(fn ($group) => $group->pluck('programme_id')->map(fn ($id) => (int) $id)->values());

        $attendedByUser = ParticipantAttendance::query()
            ->join('users', 'participant_attendances.user_id', '=', 'users.id')
            ->where('users.is_active', true)
            ->whereNotNull('participant_attendances.scanned_at')
            ->tap(function ($query) use ($excludeAdmin) {
                $excludeAdmin($query);
            })
            ->select('participant_attendances.user_id', 'participant_attendances.programme_id')
            ->distinct()
            ->get()
            ->groupBy('user_id')
            ->map(fn ($group) => $group->pluck('programme_id')->map(fn ($id) => (int) $id)->values());

        $rows = User::query()
            ->leftJoin('countries', 'users.country_id', '=', 'countries.id')
            ->where('users.is_active', true)
            ->tap($excludeAdmin)
            ->select([
                'users.id',
                'users.display_id',
                'users.name',
                'users.email',
                'countries.name as country_name',
            ])
            ->orderBy('users.name')
            ->get()
            ->map(function ($row) use ($joinedByUser, $attendedByUser) {
                $joinedProgrammeIds = ($joinedByUser->get($row->id) ?? collect())->values();
                $attendedProgrammeIds = ($attendedByUser->get($row->id) ?? collect())->values();

                return [
                    'id' => $row->id,
                    'display_id' => $row->display_id,
                    'name' => $row->name,
                    'email' => $row->email,
                    'country_name' => $row->country_name,
                    'has_attended' => $attendedProgrammeIds->isNotEmpty(),
                    'joined_programme_ids' => $joinedProgrammeIds,
                    'attended_programme_ids' => $attendedProgrammeIds,
                ];
            })
            ->values();

        return Inertia::render('reports', [
            'summary' => [
                'total_registered_participants' => $totalRegisteredParticipants,
                'total_participants_attended' => $totalParticipantsAttended,
                'total_participants_did_not_join' => $totalParticipantsDidNotJoin,
            ],
            'rows' => $rows,
            'events' => $events,
            'now_iso' => now()->toISOString(),
        ]);
    }
}
