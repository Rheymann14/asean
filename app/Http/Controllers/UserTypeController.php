<?php

namespace App\Http\Controllers;

use App\Models\UserType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UserTypeController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:user_types,name'],
            'is_active' => ['boolean'],
        ]);

        $payload = [
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'is_active' => $validated['is_active'] ?? true,
        ];

        Validator::make($payload, [
            'slug' => ['required', Rule::unique('user_types', 'slug')],
        ])->validate();

        UserType::create($payload);

        return back();
    }

    public function update(Request $request, UserType $userType)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255', 'unique:user_types,name,' . $userType->id],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $payload = [];

        if (array_key_exists('name', $validated)) {
            $payload['name'] = $validated['name'];
            $payload['slug'] = Str::slug($validated['name']);

            Validator::make($payload, [
                'slug' => ['required', Rule::unique('user_types', 'slug')->ignore($userType->id)],
            ])->validate();
        }

        if (array_key_exists('is_active', $validated)) {
            $payload['is_active'] = $validated['is_active'];
        }

        if ($payload !== []) {
            $userType->update($payload);
        }

        return back();
    }

    public function destroy(UserType $userType)
    {
        $userType->delete();

        return back();
    }
}
