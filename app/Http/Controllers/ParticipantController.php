<?php

namespace App\Http\Controllers;

use App\Models\Country;
use App\Models\ParticipantAttendance;
use App\Models\Programme;
use App\Models\User;
use App\Models\UserType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ParticipantController extends Controller
{
    public function index()
    {
        $countries = Country::orderBy('name')->get()->map(fn (Country $country) => [
            'id' => $country->id,
            'code' => $country->code,
            'name' => $country->name,
            'is_active' => $country->is_active,
            'flag_url' => $country->flag_url,
        ]);

        $userTypes = UserType::orderBy('name')->get()->map(fn (UserType $type) => [
            'id' => $type->id,
            'name' => $type->name,
            'slug' => $type->slug,
            'is_active' => $type->is_active,
        ]);

        $attendanceByUser = ParticipantAttendance::query()
            ->select(['user_id', 'programme_id', 'scanned_at'])
            ->get()
            ->groupBy('user_id');

        $participants = User::with(['country', 'userType', 'joinedProgrammes'])
            ->orderBy('name')
            ->get()
            ->map(function (User $user) use ($attendanceByUser) {
                $attendanceEntries = $attendanceByUser->get($user->id, collect());

                return [
                    'id' => $user->id,
                    'full_name' => $user->name,
                    'display_id' => $user->display_id,
                    'qr_payload' => $user->qr_payload,
                    'email' => $user->email,
                    'contact_number' => $user->contact_number,
                    'country_id' => $user->country_id,
                    'user_type_id' => $user->user_type_id,
                    'is_active' => $user->is_active,
                    'consent_contact_sharing' => $user->consent_contact_sharing,
                    'consent_photo_video' => $user->consent_photo_video,
                    'created_at' => $user->created_at?->toISOString(),
                    'joined_programme_ids' => $user->joinedProgrammes
                        ? $user->joinedProgrammes->pluck('id')->values()->all()
                        : [],
                    'checked_in_programme_ids' => $attendanceEntries
                        ->pluck('programme_id')
                        ->values()
                        ->all(),
                    'checked_in_programmes' => $attendanceEntries
                        ->map(fn (ParticipantAttendance $attendance) => [
                            'programme_id' => $attendance->programme_id,
                            'scanned_at' => $attendance->scanned_at?->toISOString(),
                        ])
                        ->values()
                        ->all(),
                    'country' => $user->country
                        ? [
                            'id' => $user->country->id,
                            'code' => $user->country->code,
                            'name' => $user->country->name,
                            'is_active' => $user->country->is_active,
                            'flag_url' => $user->country->flag_url,
                        ]
                        : null,
                    'user_type' => $user->userType
                        ? [
                            'id' => $user->userType->id,
                            'name' => $user->userType->name,
                            'slug' => $user->userType->slug,
                            'is_active' => $user->userType->is_active,
                        ]
                        : null,
                ];
            });

        $programmes = Programme::query()
            ->with(['venues' => fn ($query) => $query->where('is_active', true)->orderBy('id')])
            ->orderBy('starts_at')
            ->get()
            ->map(function (Programme $programme) {
                $venue = $programme->venues->first();

                return [
                    'id' => $programme->id,
                    'tag' => $programme->tag,
                    'title' => $programme->title,
                    'description' => $programme->description,
                    'starts_at' => $programme->starts_at?->toISOString(),
                    'ends_at' => $programme->ends_at?->toISOString(),
                    'location' => $programme->location,
                    'venue' => $venue
                        ? [
                            'name' => $venue->name,
                            'address' => $venue->address,
                        ]
                        : null,
                    'image_url' => $programme->image_url,
                    'is_active' => $programme->is_active,
                ];
            });

        return Inertia::render('participant', [
            'countries' => $countries,
            'userTypes' => $userTypes,
            'participants' => $participants,
            'programmes' => $programmes,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'contact_number' => ['nullable', 'string', 'max:30'],
            'country_id' => ['nullable', 'exists:countries,id'],
            'user_type_id' => ['nullable', 'exists:user_types,id'],
            'is_active' => ['boolean'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        User::create([
            'name' => $validated['full_name'],
            'email' => $validated['email'],
            'contact_number' => $validated['contact_number'] ?? null,
            'password' => $validated['password'] ?? 'aseanph2026',
            'country_id' => $validated['country_id'] ?? null,
            'user_type_id' => $validated['user_type_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return back();
    }

    public function update(Request $request, User $participant)
    {
        $validated = $request->validate([
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', 'unique:users,email,' . $participant->id],
            'contact_number' => ['sometimes', 'nullable', 'string', 'max:30'],
            'country_id' => ['nullable', 'exists:countries,id'],
            'user_type_id' => ['nullable', 'exists:user_types,id'],
            'is_active' => ['sometimes', 'boolean'],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
        ]);

        $wasActive = (bool) $participant->is_active;
        $updates = [];

        if (array_key_exists('full_name', $validated)) {
            $updates['name'] = $validated['full_name'];
        }

        if (array_key_exists('email', $validated)) {
            $updates['email'] = $validated['email'];
        }

        if (array_key_exists('contact_number', $validated)) {
            $updates['contact_number'] = $validated['contact_number'];
        }

        if (array_key_exists('country_id', $validated)) {
            $updates['country_id'] = $validated['country_id'];
        }

        if (array_key_exists('user_type_id', $validated)) {
            $updates['user_type_id'] = $validated['user_type_id'];
        }

        if (array_key_exists('is_active', $validated)) {
            $updates['is_active'] = $validated['is_active'];
        }

        if (array_key_exists('password', $validated) && $validated['password'] !== null) {
            $updates['password'] = $validated['password'];
        }

        $participant->update($updates);

        if ($wasActive && array_key_exists('is_active', $updates) && ! $updates['is_active']) {
            DB::table('sessions')->where('user_id', $participant->id)->delete();
            $participant->forceFill(['remember_token' => Str::random(60)])->save();
        }

        return back();
    }

    public function destroy(User $participant)
    {
        $participant->delete();

        return back();
    }

    public function joinProgramme(Request $request, User $participant, Programme $programme)
    {
        $participant->joinedProgrammes()->syncWithoutDetaching([$programme->id]);

        return back();
    }

    public function leaveProgramme(Request $request, User $participant, Programme $programme)
    {
        $participant->joinedProgrammes()->detach($programme->id);

        return back();
    }

    public function revertAttendance(Request $request, User $participant, Programme $programme)
    {
        ParticipantAttendance::query()
            ->where('user_id', $participant->id)
            ->where('programme_id', $programme->id)
            ->delete();

        return back();
    }
}
