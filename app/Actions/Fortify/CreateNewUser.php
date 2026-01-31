<?php

namespace App\Actions\Fortify;

use App\Mail\ParticipantWelcomeMail;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
            'contact_number' => ['required', 'string', 'max:30'],
            'country_id' => ['required', 'integer', 'exists:countries,id'],
            'user_type_id' => ['required', 'integer', 'exists:user_types,id'],
            'programme_ids' => ['nullable', 'array'],
            'programme_ids.*' => ['integer', 'exists:programmes,id'],
            'password' => $this->passwordRules(),
        ])->validate();

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'contact_number' => $input['contact_number'],
            'password' => $input['password'],
            'country_id' => $input['country_id'],
            'user_type_id' => $input['user_type_id'],
        ])->refresh();

        $programmeIds = $input['programme_ids'] ?? [];
        if (! empty($programmeIds)) {
            $user->joinedProgrammes()->sync($programmeIds);
        }

        Mail::to($user->email)->send(new ParticipantWelcomeMail($user));

        return $user;
    }
}
