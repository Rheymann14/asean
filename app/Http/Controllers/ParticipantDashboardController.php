<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class ParticipantDashboardController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user()->load('country'); // make sure User has country() relation

        return Inertia::render('participant-dashboard', [
            'participant' => [
                'display_id' => $user->display_id,
                'qr_payload' => $user->qr_payload,
                'name' => $user->name,
                'email' => $user->email,
                'contact_number' => $user->contact_number,
                'country' => $user->country ? [
                    'code' => $user->country->code,
                    'name' => $user->country->name,
                    'flag_url' => $user->country->flag_url,
                ] : null,
                'food_restrictions' => $user->food_restrictions ?? [],
            ],
        ]);

    }
}
