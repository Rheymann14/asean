<?php

namespace App\Http\Controllers;

use App\Models\Country;
use App\Models\ParticipantAttendance;
use App\Models\Programme;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function show(Request $request)
    {
        $countries = Country::orderBy('name')->get()->map(fn (Country $country) => [
            'id' => $country->id,
            'code' => $country->code,
            'name' => $country->name,
            'flag_url' => $country->flag_url,
            'is_active' => $country->is_active,
        ]);

        $participantsTotal = User::query()
            ->where('is_active', true)
            ->count();

        $eventsTotal = Programme::query()->count();

        $scansTotal = ParticipantAttendance::query()
            ->whereNotNull('scanned_at')
            ->count();

        $participantsByCountry = User::query()
            ->where('is_active', true)
            ->whereNotNull('country_id')
            ->select('country_id', DB::raw('count(*) as total'))
            ->groupBy('country_id')
            ->pluck('total', 'country_id');

        $scansByCountry = ParticipantAttendance::query()
            ->join('users', 'participant_attendances.user_id', '=', 'users.id')
            ->whereNotNull('participant_attendances.scanned_at')
            ->whereNotNull('users.country_id')
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

        $start = now()->startOfDay()->subDays(6);
        $end = now()->endOfDay();

        $dailyTotals = ParticipantAttendance::query()
            ->whereNotNull('scanned_at')
            ->whereBetween('scanned_at', [$start, $end])
            ->selectRaw('DATE(scanned_at) as day, COUNT(*) as total')
            ->groupBy('day')
            ->pluck('total', 'day');

        $dailyByCountry = ParticipantAttendance::query()
            ->join('users', 'participant_attendances.user_id', '=', 'users.id')
            ->whereNotNull('participant_attendances.scanned_at')
            ->whereNotNull('users.country_id')
            ->whereBetween('participant_attendances.scanned_at', [$start, $end])
            ->selectRaw('DATE(participant_attendances.scanned_at) as day, users.country_id as country_id, COUNT(*) as total')
            ->groupBy('day', 'country_id')
            ->get()
            ->groupBy('day');

        $lineData = collect();

        for ($offset = 0; $offset < 7; $offset++) {
            $day = $start->copy()->addDays($offset);
            $dayKey = $day->toDateString();
            $countryRows = $dailyByCountry->get($dayKey, collect());
            $countryCounts = $countryRows->mapWithKeys(fn ($row) => [
                (string) $row->country_id => (int) $row->total,
            ])->all();

            $lineData->push([
                'date' => $dayKey,
                'label' => $day->format('M d'),
                'scans' => (int) ($dailyTotals[$dayKey] ?? 0),
                'scans_by_country' => $countryCounts,
            ]);
        }

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
        ]);
    }
}
