<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\ParticipantController;
use App\Http\Controllers\CountryController;
use App\Http\Controllers\UserTypeController;
use App\Http\Controllers\IssuanceController;
use App\Http\Controllers\ContactDetailController;
use App\Http\Controllers\VenueController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('/contact-us', [ContactDetailController::class, 'publicIndex'])->name('contact-us');

Route::get('/venue', function () {
    return Inertia::render('venue');
})->name('venue');

Route::get('/programme', fn () => Inertia::render('programme'))->name('programme');


Route::get('/issuances', [IssuanceController::class, 'publicIndex'])->name('issuances');

Route::middleware(['auth', 'verified'])->group(function () {
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

    Route::get('programme-management', fn () => Inertia::render('programme-management'))->name('programme-management');

    Route::get('scanner', fn () => Inertia::render('scanner'))->name('scanner');

    
});

require __DIR__.'/settings.php';
