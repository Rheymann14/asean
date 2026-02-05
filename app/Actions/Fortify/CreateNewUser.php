<?php

namespace App\Actions\Fortify;

use App\Mail\ParticipantWelcomeMail;
use App\Models\User;
use App\Services\SemaphoreSms;
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
            'consent_contact_sharing' => ['required', 'accepted'],
            'consent_photo_video' => ['required', 'accepted'],
            'password' => $this->passwordRules(),
        ])->validate();

        $user = User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'contact_number' => $input['contact_number'],
            'password' => $input['password'],
            'country_id' => $input['country_id'],
            'user_type_id' => $input['user_type_id'],
            'consent_contact_sharing' => (bool) $input['consent_contact_sharing'],
            'consent_photo_video' => (bool) $input['consent_photo_video'],
        ])->refresh();

        $programmeIds = $input['programme_ids'] ?? [];
        if (! empty($programmeIds)) {
            $user->joinedProgrammes()->sync($programmeIds);
        }

        rescue(fn () => Mail::to($user->email)->send(new ParticipantWelcomeMail($user)), report: true);
        rescue(fn () => app(SemaphoreSms::class)->sendWelcome($user), report: true);

        return $user;
    }
}
