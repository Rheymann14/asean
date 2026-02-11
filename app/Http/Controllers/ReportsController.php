<?php

namespace App\Http\Controllers;

use App\Models\ParticipantAttendance;
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
                DB::raw('EXISTS(SELECT 1 FROM participant_attendances pa WHERE pa.user_id = users.id AND pa.scanned_at IS NOT NULL) as has_attended'),
            ])
            ->orderBy('users.name')
            ->get()
            ->map(fn ($row) => [
                'id' => $row->id,
                'display_id' => $row->display_id,
                'name' => $row->name,
                'email' => $row->email,
                'country_name' => $row->country_name,
                'has_attended' => (bool) $row->has_attended,
            ])
            ->values();

        return Inertia::render('reports', [
            'summary' => [
                'total_registered_participants' => $totalRegisteredParticipants,
                'total_participants_attended' => $totalParticipantsAttended,
                'total_participants_did_not_join' => $totalParticipantsDidNotJoin,
            ],
            'rows' => $rows,
        ]);
    }
}
