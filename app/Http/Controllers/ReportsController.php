<?php

namespace App\Http\Controllers;

use App\Models\ParticipantAttendance;
use App\Models\Programme;
use App\Models\User;
use App\Models\UserType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportsController extends Controller
{
    public function updateWelcomeDinnerPreferences(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'attend_welcome_dinner' => ['required', 'boolean'],
            'avail_transport_from_makati_to_peninsula' => ['required', 'boolean'],
        ]);

        $attendWelcomeDinner = (bool) $validated['attend_welcome_dinner'];

        $user->update([
            'attend_welcome_dinner' => $attendWelcomeDinner,
            'avail_transport_from_makati_to_peninsula' => $attendWelcomeDinner
                ? (bool) $validated['avail_transport_from_makati_to_peninsula']
                : false,
        ]);

        return back()->with('success', 'Welcome dinner preferences updated.');
    }

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

        $attendanceEntriesByUser = ParticipantAttendance::query()
            ->join('users', 'participant_attendances.user_id', '=', 'users.id')
            ->where('users.is_active', true)
            ->whereNotNull('participant_attendances.scanned_at')
            ->tap(function ($query) use ($excludeAdmin) {
                $excludeAdmin($query);
            })
            ->select('participant_attendances.user_id', 'participant_attendances.programme_id', 'participant_attendances.scanned_at')
            ->orderBy('participant_attendances.scanned_at')
            ->get()
            ->groupBy('user_id');

        $rows = User::query()
            ->leftJoin('countries', 'users.country_id', '=', 'countries.id')
            ->leftJoin('user_types', 'users.user_type_id', '=', 'user_types.id')
            ->where('users.is_active', true)
            ->tap($excludeAdmin)
            ->select([
                'users.id',
                'users.honorific_title',
                'users.given_name',
                'users.family_name',
                'users.suffix',
                'users.name',
                'users.organization_name',
                'users.other_user_type',
                'users.attend_welcome_dinner',
                'users.avail_transport_from_makati_to_peninsula',
                'countries.name as country_name',
                'user_types.name as registrant_type',
            ])
            ->orderBy('users.name')
            ->get()
            ->map(function ($row) use ($joinedByUser, $attendanceEntriesByUser) {
                $joinedProgrammeIds = ($joinedByUser->get($row->id) ?? collect())->values();
                $attendanceEntries = $attendanceEntriesByUser->get($row->id, collect());

                $attendedProgrammeIds = $attendanceEntries
                    ->pluck('programme_id')
                    ->unique()
                    ->map(fn ($id) => (int) $id)
                    ->values();

                $attendanceByProgramme = $attendanceEntries
                    ->groupBy('programme_id')
                    ->map(function ($entries) {
                        $latest = $entries->last();

                        return $latest?->scanned_at?->toISOString();
                    })
                    ->all();

                $latestAttendance = $attendanceEntries->last();

                return [
                    'id' => $row->id,
                    'honorific_title' => $row->honorific_title,
                    'given_name' => $row->given_name,
                    'family_name' => $row->family_name,
                    'suffix' => $row->suffix,
                    'name' => $row->name,
                    'country_name' => $row->country_name,
                    'registrant_type' => $row->registrant_type,
                    'organization_name' => $row->organization_name,
                    'other_user_type' => $row->other_user_type,
                    'attend_welcome_dinner' => (bool) $row->attend_welcome_dinner,
                    'avail_transport_from_makati_to_peninsula' => (bool) $row->avail_transport_from_makati_to_peninsula,
                    'has_attended' => $attendedProgrammeIds->isNotEmpty(),
                    'joined_programme_ids' => $joinedProgrammeIds,
                    'attended_programme_ids' => $attendedProgrammeIds,
                    'attendance_by_programme' => $attendanceByProgramme,
                    'latest_attendance_at' => $latestAttendance?->scanned_at?->toISOString(),
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
