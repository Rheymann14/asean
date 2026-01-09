<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\ParticipantController;
use App\Http\Controllers\CountryController;
use App\Http\Controllers\UserTypeController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('/contact-us', function () {
    return Inertia::render('contact-us');
})->name('contact-us');

Route::get('/venue', function () {
    return Inertia::render('venue');
})->name('venue');

Route::get('/programme', fn () => Inertia::render('programme'))->name('programme');


Route::get('/issuances', function () {
    return Inertia::render('issuances');
})->name('issuances');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    Route::get('participant', [ParticipantController::class, 'index'])->name('participant');

    Route::resource('participants', ParticipantController::class)->only(['store', 'update', 'destroy']);
    Route::resource('participants/countries', CountryController::class)->only(['store', 'update', 'destroy']);
    Route::resource('participants/user-types', UserTypeController::class)->only(['store', 'update', 'destroy']);

    Route::get('venue-management', fn () => Inertia::render('venue-management'))->name('venue-management');

    Route::get('issuances-management', fn () => Inertia::render('issuances-management'))->name('issuances-management');

    Route::get('contact-details', fn () => Inertia::render('contact-details'))->name('contact-details');

    Route::get('programme-management', fn () => Inertia::render('programme-management'))->name('programme-management');

    Route::get('scanner', fn () => Inertia::render('scanner'))->name('scanner');

    
});

require __DIR__.'/settings.php';
