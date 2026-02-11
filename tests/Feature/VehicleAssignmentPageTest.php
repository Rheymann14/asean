<?php

use App\Models\Programme;
use App\Models\User;
use App\Models\UserType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('ched role sees participant van assignment view', function () {
    $chedType = UserType::query()->create([
        'name' => 'CHED',
        'slug' => 'CHED',
        'is_active' => true,
    ]);

    $owner = User::factory()->create();

    $programme = Programme::query()->create([
        'user_id' => $owner->id,
        'tag' => 'EVT-1',
        'title' => 'Summit Day 1',
        'description' => 'Programme description',
        'location' => 'Manila',
        'starts_at' => now(),
        'ends_at' => now()->addHour(),
        'is_active' => true,
    ]);

    $user = User::factory()->create([
        'user_type_id' => $chedType->id,
    ]);

    $user->joinedProgrammes()->attach($programme->id);

    $this->actingAs($user)
        ->get(route('vehicle-assignment'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('participant-vehicle-assignment')
            ->where('events.0.id', $programme->id)
        );
});
