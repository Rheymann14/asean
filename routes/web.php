<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

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

Route::get('/programme', function () {
    return Inertia::render('programme');
})->name('programme');

Route::get('/issuances', function () {
    return Inertia::render('issuances');
})->name('issuances');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
