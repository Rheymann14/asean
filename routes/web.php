<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\ParticipantController;
use App\Http\Controllers\ParticipantDashboardController;
use App\Http\Controllers\CountryController;
use App\Http\Controllers\UserTypeController;
use App\Http\Controllers\IssuanceController;
use App\Http\Controllers\ContactDetailController;
use App\Http\Controllers\ProgrammeController;
use App\Http\Controllers\VenueController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('/contact-us', [ContactDetailController::class, 'publicIndex'])->name('contact-us');

Route::get('/venue', [VenueController::class, 'publicIndex'])->name('venue');

Route::get('/event', [ProgrammeController::class, 'publicIndex'])->name('event');


Route::get('/issuances', [IssuanceController::class, 'publicIndex'])->name('issuances');

    Route::middleware(['auth'])->group(function () {
        Route::middleware(['role:participant'])->group(function () {
            Route::get('participant-dashboard', function () {
                return Inertia::render('participant-dashboard');
            })->name('participant-dashboard');
            Route::get('/participant-dashboard', [ParticipantDashboardController::class, 'show'])
                ->name('participant.dashboard');
            Route::get('/event-list', [ProgrammeController::class, 'participantIndex'])
                ->name('event-list');
            Route::post('/event-list/{programme}/join', [ProgrammeController::class, 'join'])
                ->name('event-list.join');
            Route::delete('/event-list/{programme}/leave', [ProgrammeController::class, 'leave'])
                ->name('event-list.leave');
            Route::delete('/event-list/clear', [ProgrammeController::class, 'clearSelections'])
                ->name('event-list.clear');
        });

    Route::middleware(['verified', 'role:ched'])->group(function () {
        Route::get('dashboard', function () {
            return Inertia::render('dashboard');
        })->name('dashboard');
        Route::get('participant', [ParticipantController::class, 'index'])->name('participant');

        Route::resource('participants', ParticipantController::class)->only(['store', 'update', 'destroy']);
        Route::resource('participants/countries', CountryController::class)->only(['store', 'update', 'destroy']);
        Route::resource('participants/user-types', UserTypeController::class)->only(['store', 'update', 'destroy']);

        Route::get('venue-management', [VenueController::class, 'index'])->name('venue-management');
        Route::resource('venues', VenueController::class)->only(['store', 'update', 'destroy']);

        Route::get('issuances-management', [IssuanceController::class, 'index'])->name('issuances-management');
        Route::resource('issuances', IssuanceController::class)->only(['store', 'update', 'destroy']);

        Route::get('contact-details', [ContactDetailController::class, 'index'])->name('contact-details');
        Route::patch('contact-details/{contactDetail}', [ContactDetailController::class, 'update'])->name('contact-details.update');

        Route::get('event-management', [ProgrammeController::class, 'index'])->name('event-management');
        Route::resource('programmes', ProgrammeController::class)->only(['store', 'update', 'destroy']);

        Route::get('scanner', fn () => Inertia::render('scanner'))->name('scanner');
    });
});

require __DIR__.'/settings.php';
