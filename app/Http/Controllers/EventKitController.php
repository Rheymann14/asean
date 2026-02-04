<?php

namespace App\Http\Controllers;

use App\Models\ParticipantAttendance;
use App\Models\Programme;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventKitController extends Controller
{
    public function entry()
    {
        return Inertia::render('event-kit-entry');
    }

    public function verify(Request $request)
    {
        $validated = $request->validate([
            'participant_id' => ['required', 'string', 'max:255'],
        ]);

        $participantId = trim($validated['participant_id']);

        $participant = User::query()
            ->where('display_id', $participantId)
            ->orWhere('email', $participantId)
            ->orWhere('id', $participantId)
            ->first();

        if (!$participant) {
            return back()->withErrors([
                'participant_id' => 'Participant ID not found. Please check your ID or email.',
            ]);
        }

        $request->session()->put('event_kit.participant_id', $participant->id);
        $request->session()->forget(['event_kit.programme_id', 'event_kit.survey_completed']);

        return redirect()->route('event-kit.survey');
    }

    public function survey(Request $request)
    {
        $participant = $this->resolveParticipant($request);

        if (!$participant) {
            return redirect()->route('event-kit.entry');
        }

        [$programmes, $attendanceEntries] = $this->loadProgrammesAndAttendance($participant->id);

        return Inertia::render('event-kit-survey', [
            'participant' => $participant,
            'programmes' => $programmes,
            'attendance_entries' => $attendanceEntries,
            'selected_programme_id' => $request->session()->get('event_kit.programme_id'),
        ]);
    }

    public function submitSurvey(Request $request)
    {
        $participant = $this->resolveParticipant($request);

        if (!$participant) {
            return redirect()->route('event-kit.entry');
        }

        $validated = $request->validate([
            'programme_id' => ['required', 'integer', 'exists:programmes,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'recommend' => ['required', 'in:yes,no'],
            'feedback' => ['required', 'string', 'max:1000'],
        ]);

        $request->session()->put('event_kit.programme_id', (int) $validated['programme_id']);
        $request->session()->put('event_kit.survey_completed', true);

        return redirect()->route('event-kit.materials');
    }

    public function materials(Request $request)
    {
        $participant = $this->resolveParticipant($request);

        if (!$participant) {
            return redirect()->route('event-kit.entry');
        }

        if (!$request->session()->get('event_kit.survey_completed')) {
            return redirect()->route('event-kit.survey');
        }

        $programmeId = $request->session()->get('event_kit.programme_id');

        if (!$programmeId) {
            return redirect()->route('event-kit.survey');
        }

        $programme = Programme::query()->find($programmeId);

        if (!$programme) {
            return redirect()->route('event-kit.survey');
        }

        $attendance = ParticipantAttendance::query()
            ->where('programme_id', $programmeId)
            ->where('user_id', $participant->id)
            ->first();

        return Inertia::render('event-kit-materials', [
            'participant' => $participant,
            'programme' => [
                'id' => $programme->id,
                'title' => $programme->title,
                'description' => $programme->description,
                'starts_at' => $programme->starts_at?->toISOString(),
                'ends_at' => $programme->ends_at?->toISOString(),
                'location' => $programme->location,
                'image_url' => $programme->image_url,
                'pdf_url' => $programme->pdf_url,
            ],
            'attendance' => $attendance
                ? [
                    'scanned_at' => $attendance->scanned_at?->toISOString(),
                ]
                : null,
        ]);
    }

    public function certificate(Request $request)
    {
        $participant = $this->resolveParticipant($request);

        if (!$participant) {
            return redirect()->route('event-kit.entry');
        }

        $programmeId = $request->session()->get('event_kit.programme_id');
        $type = $request->query('type');

        if (!$programmeId || !in_array($type, ['appearance', 'participation'], true)) {
            return redirect()->route('event-kit.materials');
        }

        $programme = Programme::query()->find($programmeId);

        if (!$programme) {
            return redirect()->route('event-kit.materials');
        }

        return Inertia::render('event-kit-certificate', [
            'participant' => $participant,
            'programme' => [
                'id' => $programme->id,
                'title' => $programme->title,
                'starts_at' => $programme->starts_at?->toISOString(),
                'ends_at' => $programme->ends_at?->toISOString(),
                'location' => $programme->location,
            ],
            'type' => $type,
        ]);
    }

    public function reset(Request $request)
    {
        $request->session()->forget(['event_kit']);

        return redirect()->route('event-kit.entry');
    }

    private function resolveParticipant(Request $request): ?User
    {
        $participantId = $request->session()->get('event_kit.participant_id');

        if (!$participantId) {
            return null;
        }

        return User::query()->find($participantId);
    }

    private function loadProgrammesAndAttendance(int $participantId): array
    {
        $programmes = Programme::query()
            ->latest('starts_at')
            ->get()
            ->map(fn (Programme $programme) => [
                'id' => $programme->id,
                'title' => $programme->title,
                'description' => $programme->description,
                'starts_at' => $programme->starts_at?->toISOString(),
                'ends_at' => $programme->ends_at?->toISOString(),
                'location' => $programme->location,
            ])
            ->values()
            ->all();

        $attendanceEntries = ParticipantAttendance::query()
            ->select(['programme_id', 'scanned_at'])
            ->where('user_id', $participantId)
            ->get()
            ->map(fn (ParticipantAttendance $attendance) => [
                'programme_id' => $attendance->programme_id,
                'scanned_at' => $attendance->scanned_at?->toISOString(),
            ])
            ->values()
            ->all();

        return [$programmes, $attendanceEntries];
    }
}
