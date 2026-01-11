<?php

namespace App\Http\Controllers;

use App\Models\Country;
use App\Models\Feedback;
use App\Models\ParticipantAttendance;
use App\Models\Programme;
use App\Models\User;
use App\Models\UserType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function show(Request $request)
    {
        $chedTypeId = UserType::query()
            ->where('slug', 'ched')
            ->orWhere('name', 'CHED')
            ->value('id');

        $excludeChed = function ($query) use ($chedTypeId) {
            if (! $chedTypeId) {
                return;
            }

            $query->where(function ($inner) use ($chedTypeId) {
                $inner->where('users.user_type_id', '!=', $chedTypeId)
                    ->orWhereNull('users.user_type_id');
            });
        };

        $countries = Country::orderBy('name')->get()->map(fn (Country $country) => [
            'id' => $country->id,
            'code' => $country->code,
            'name' => $country->name,
            'flag_url' => $country->flag_url,
            'is_active' => $country->is_active,
        ]);

        $participantsTotal = User::query()
            ->where('is_active', true)
            ->tap($excludeChed)
            ->count();

        $eventsTotal = Programme::query()->count();

        $scansTotal = ParticipantAttendance::query()
            ->join('users', 'participant_attendances.user_id', '=', 'users.id')
            ->whereNotNull('participant_attendances.scanned_at')
            ->tap(function ($query) use ($excludeChed) {
                $excludeChed($query);
            })
            ->count();

        $participantsByCountry = User::query()
            ->where('is_active', true)
            ->whereNotNull('country_id')
            ->tap($excludeChed)
            ->select('country_id', DB::raw('count(*) as total'))
            ->groupBy('country_id')
            ->pluck('total', 'country_id');

        $scansByCountry = ParticipantAttendance::query()
            ->join('users', 'participant_attendances.user_id', '=', 'users.id')
            ->whereNotNull('participant_attendances.scanned_at')
            ->whereNotNull('users.country_id')
            ->tap(function ($query) use ($excludeChed) {
                $excludeChed($query);
            })
            ->select('users.country_id', DB::raw('count(*) as total'))
            ->groupBy('users.country_id')
            ->pluck('total', 'users.country_id');

        $countryStats = $participantsByCountry
            ->mapWithKeys(fn ($count, $countryId) => [
                $countryId => [
                    'participants' => (int) $count,
                    'scans' => (int) ($scansByCountry[$countryId] ?? 0),
                ],
            ])
            ->all();

        foreach ($scansByCountry as $countryId => $count) {
            if (! array_key_exists($countryId, $countryStats)) {
                $countryStats[$countryId] = [
                    'participants' => 0,
                    'scans' => (int) $count,
                ];
            }
        }

        $attendances = ParticipantAttendance::query()
            ->with(['participant.country'])
            ->whereNotNull('scanned_at')
            ->when($chedTypeId, function ($query) use ($chedTypeId) {
                $query->whereHas('participant', function ($inner) use ($chedTypeId) {
                    $inner->where(function ($nested) use ($chedTypeId) {
                        $nested->where('user_type_id', '!=', $chedTypeId)
                            ->orWhereNull('user_type_id');
                    });
                });
            })
            ->orderByDesc('scanned_at')
            ->get()
            ->groupBy('programme_id');

        $events = Programme::query()
            ->orderBy('starts_at')
            ->get()
            ->map(function (Programme $programme) use ($attendances) {
                $records = $attendances->get($programme->id, collect());

                return [
                    'id' => $programme->id,
                    'title' => $programme->title,
                    'starts_at' => $programme->starts_at?->toISOString(),
                    'attendance_count' => $records->count(),
                    'participants' => $records
                        ->map(function (ParticipantAttendance $attendance) {
                            $participant = $attendance->participant;

                            return [
                                'id' => $participant?->id,
                                'name' => $participant?->name,
                                'email' => $participant?->email,
                                'display_id' => $participant?->display_id,
                                'country_id' => $participant?->country_id,
                                'country_name' => $participant?->country?->name,
                                'country_flag_url' => $participant?->country?->flag_url,
                                'scanned_at' => $attendance->scanned_at?->toISOString(),
                            ];
                        })
                        ->values(),
                ];
            })
            ->values();

        $year = now()->year;

        $monthlyTotals = ParticipantAttendance::query()
            ->join('users', 'participant_attendances.user_id', '=', 'users.id')
            ->whereNotNull('participant_attendances.scanned_at')
            ->whereYear('participant_attendances.scanned_at', $year)
            ->tap(function ($query) use ($excludeChed) {
                $excludeChed($query);
            })
            ->selectRaw('MONTH(scanned_at) as month, COUNT(*) as total')
            ->groupBy('month')
            ->pluck('total', 'month');

        $monthlyByCountry = ParticipantAttendance::query()
            ->join('users', 'participant_attendances.user_id', '=', 'users.id')
            ->whereNotNull('participant_attendances.scanned_at')
            ->whereNotNull('users.country_id')
            ->whereYear('participant_attendances.scanned_at', $year)
            ->tap(function ($query) use ($excludeChed) {
                $excludeChed($query);
            })
            ->selectRaw('MONTH(participant_attendances.scanned_at) as month, users.country_id as country_id, COUNT(*) as total')
            ->groupBy('month', 'country_id')
            ->get()
            ->groupBy('month');

        $lineData = collect();

        for ($month = 1; $month <= 12; $month++) {
            $countryRows = $monthlyByCountry->get($month, collect());
            $countryCounts = $countryRows->mapWithKeys(fn ($row) => [
                (string) $row->country_id => (int) $row->total,
            ])->all();

            $lineData->push([
                'month' => $month,
                'label' => now()->copy()->startOfYear()->setMonth($month)->format('M'),
                'scans' => (int) ($monthlyTotals[$month] ?? 0),
                'scans_by_country' => $countryCounts,
            ]);
        }

        $feedbackStats = Feedback::query()
            ->selectRaw('COUNT(*) as total, AVG(user_experience_rating) as avg_rating')
            ->first();

        $feedbackEntries = Feedback::query()
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (Feedback $feedback) => [
                'id' => $feedback->id,
                'user_experience_rating' => $feedback->user_experience_rating,
                'event_ratings' => $feedback->event_ratings,
                'recommendations' => $feedback->recommendations,
                'created_at' => $feedback->created_at?->toISOString(),
            ]);

        return Inertia::render('dashboard', [
            'countries' => $countries,
            'stats' => [
                'participants_total' => $participantsTotal,
                'events_total' => $eventsTotal,
                'scans_total' => $scansTotal,
            ],
            'country_stats' => $countryStats,
            'events' => $events,
            'line_data' => $lineData,
            'feedback' => [
                'total' => (int) ($feedbackStats->total ?? 0),
                'avg_rating' => $feedbackStats?->avg_rating !== null ? round((float) $feedbackStats->avg_rating, 1) : null,
                'entries' => $feedbackEntries,
            ],
        ]);
    }
}
