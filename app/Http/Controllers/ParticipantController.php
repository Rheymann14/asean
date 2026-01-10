<?php

namespace App\Http\Controllers;

use App\Models\Country;
use App\Models\User;
use App\Models\UserType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

        $participants = User::with(['country', 'userType'])
            ->orderBy('name')
            ->get()
            ->map(function (User $user) {
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
                    'created_at' => $user->created_at?->toISOString(),
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

        return Inertia::render('participant', [
            'countries' => $countries,
            'userTypes' => $userTypes,
            'participants' => $participants,
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
        ]);

        User::create([
            'name' => $validated['full_name'],
            'email' => $validated['email'],
            'contact_number' => $validated['contact_number'] ?? null,
            'password' => Hash::make(Str::random(32)),
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
        ]);

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

        $participant->update($updates);

        return back();
    }

    public function destroy(User $participant)
    {
        $participant->delete();

        return back();
    }
}
