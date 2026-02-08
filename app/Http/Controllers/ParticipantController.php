<?php

namespace App\Http\Controllers;

use App\Models\Country;
use App\Models\ParticipantAttendance;
use App\Models\Programme;
use App\Models\User;
use App\Models\UserType;
use App\Services\WelcomeNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ParticipantController extends Controller
{
    private const FOOD_RESTRICTION_OPTIONS = [
        'vegetarian',
        'vegan',
        'halal',
        'kosher',
        'gluten_free',
        'lactose_intolerant',
        'nut_allergy',
        'seafood_allergy',
    ];

    public function index()
    {
        $countries = Country::orderBy('name')->get()->map(fn (Country $country) => [
            'id' => $country->id,
            'code' => $country->code,
            'name' => $country->name,
            'is_active' => $country->is_active,
            'flag_url' => $country->flag_url,
        ]);

        $userTypes = UserType::orderBy('sequence_order')->orderBy('name')->get()->map(fn (UserType $type) => [
            'id' => $type->id,
            'name' => $type->name,
            'slug' => $type->slug,
            'is_active' => $type->is_active,
            'sequence_order' => $type->sequence_order,
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
                    'other_user_type' => $user->other_user_type,
                    'is_active' => $user->is_active,
                    'consent_contact_sharing' => $user->consent_contact_sharing,
                    'consent_photo_video' => $user->consent_photo_video,
                    'has_food_restrictions' => $user->has_food_restrictions,
                    'food_restrictions' => $user->food_restrictions ?? [],
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
                            'sequence_order' => $user->userType->sequence_order,
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
            'other_user_type' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
            'password' => ['nullable', 'string', 'min:8'],
            'has_food_restrictions' => ['nullable', 'boolean'],
            'food_restrictions' => ['nullable', 'array'],
            'food_restrictions.*' => ['string', Rule::in(self::FOOD_RESTRICTION_OPTIONS)],
        ]);

        $userTypeId = $validated['user_type_id'] ?? null;
        $otherUserType = $this->isOtherUserTypeId($userTypeId)
            ? trim((string) ($validated['other_user_type'] ?? '')) ?: null
            : null;
        $foodRestrictions = array_values(array_unique($validated['food_restrictions'] ?? []));

        $user = User::create([
            'name' => $validated['full_name'],
            'email' => $validated['email'],
            'contact_number' => $validated['contact_number'] ?? null,
            'password' => $validated['password'] ?? 'aseanph2026',
            'country_id' => $validated['country_id'] ?? null,
            'user_type_id' => $validated['user_type_id'] ?? null,
            'other_user_type' => $otherUserType,
            'is_active' => $validated['is_active'] ?? true,
            'has_food_restrictions' => $this->canHaveFoodRestrictions($userTypeId)
                ? ! empty($foodRestrictions)
                : false,
            'food_restrictions' => $this->canHaveFoodRestrictions($userTypeId) ? $foodRestrictions : [],
        ])->refresh();

        app(WelcomeNotificationService::class)->dispatch($user);

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
            'other_user_type' => ['sometimes', 'nullable', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
            'has_food_restrictions' => ['sometimes', 'boolean'],
            'food_restrictions' => ['sometimes', 'array'],
            'food_restrictions.*' => ['string', Rule::in(self::FOOD_RESTRICTION_OPTIONS)],
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

        $nextUserTypeId = array_key_exists('user_type_id', $validated)
            ? $validated['user_type_id']
            : $participant->user_type_id;

        if (array_key_exists('other_user_type', $validated) || array_key_exists('user_type_id', $validated)) {
            $updates['other_user_type'] = $this->isOtherUserTypeId($nextUserTypeId)
                ? trim((string) ($validated['other_user_type'] ?? '')) ?: null
                : null;
        }

        if (array_key_exists('food_restrictions', $validated)) {
            $foodRestrictions = array_values(array_unique($validated['food_restrictions'] ?? []));
            $updates['food_restrictions'] = $this->canHaveFoodRestrictions($nextUserTypeId)
                ? $foodRestrictions
                : [];
            $updates['has_food_restrictions'] = ! empty($updates['food_restrictions']);
        } elseif (! $this->canHaveFoodRestrictions($nextUserTypeId)) {
            $updates['food_restrictions'] = [];
            $updates['has_food_restrictions'] = false;
        } elseif (array_key_exists('has_food_restrictions', $validated) && ! $validated['has_food_restrictions']) {
            $updates['food_restrictions'] = [];
            $updates['has_food_restrictions'] = false;
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

    private function canHaveFoodRestrictions(?int $userTypeId): bool
    {
        if (! $userTypeId) {
            return true;
        }

        $userType = UserType::query()->find($userTypeId);
        if (! $userType) {
            return true;
        }

        $value = Str::of((string) ($userType->slug ?: $userType->name))
            ->lower()
            ->replace(['_', '-'], ' ')
            ->trim();

        return $value !== 'ched' && ! $value->startsWith('ched ');
    }

    private function isOtherUserTypeId(?int $userTypeId): bool
    {
        if (! $userTypeId) {
            return false;
        }

        $userType = UserType::query()->find($userTypeId);
        if (! $userType) {
            return false;
        }

        return Str::lower((string) $userType->slug) === 'other' || Str::lower($userType->name) === 'other';
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
