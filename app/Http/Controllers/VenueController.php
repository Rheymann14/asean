<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Venue;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VenueController extends Controller
{
    public function index()
    {
        $events = Event::orderBy('starts_at')
            ->orderBy('title')
            ->get()
            ->map(fn (Event $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'starts_at' => $event->starts_at?->toISOString(),
                'ends_at' => $event->ends_at?->toISOString(),
            ]);

        $venues = Venue::with(['event', 'creator'])
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn (Venue $venue) => [
                'id' => $venue->id,
                'event_id' => $venue->event_id,
                'name' => $venue->name,
                'address' => $venue->address,
                'google_maps_url' => $venue->google_maps_url,
                'embed_url' => $venue->embed_url,
                'is_active' => $venue->is_active,
                'updated_at' => $venue->updated_at?->toISOString(),
                'created_by' => $venue->created_by,
                'event' => $venue->event
                    ? [
                        'id' => $venue->event->id,
                        'title' => $venue->event->title,
                        'starts_at' => $venue->event->starts_at?->toISOString(),
                        'ends_at' => $venue->event->ends_at?->toISOString(),
                    ]
                    : null,
                'creator' => $venue->creator
                    ? [
                        'id' => $venue->creator->id,
                        'name' => $venue->creator->name,
                    ]
                    : null,
            ]);

        return Inertia::render('venue-management', [
            'events' => $events,
            'venues' => $venues,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'event_id' => ['nullable', 'exists:events,id'],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string'],
            'google_maps_url' => ['nullable', 'url', 'max:255'],
            'embed_url' => ['nullable', 'url', 'max:255'],
        ]);

        Venue::create([
            'event_id' => $validated['event_id'] ?? null,
            'created_by' => $request->user()->id,
            'name' => $validated['name'],
            'address' => $validated['address'],
            'google_maps_url' => $validated['google_maps_url'] ?? null,
            'embed_url' => $validated['embed_url'] ?? null,
            'is_active' => true,
        ]);

        return back();
    }

    public function update(Request $request, Venue $venue)
    {
        $validated = $request->validate([
            'event_id' => ['nullable', 'exists:events,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'address' => ['sometimes', 'required', 'string'],
            'google_maps_url' => ['nullable', 'url', 'max:255'],
            'embed_url' => ['nullable', 'url', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $updates = [];

        if (array_key_exists('event_id', $validated)) {
            $updates['event_id'] = $validated['event_id'];
        }

        if (array_key_exists('name', $validated)) {
            $updates['name'] = $validated['name'];
        }

        if (array_key_exists('address', $validated)) {
            $updates['address'] = $validated['address'];
        }

        if (array_key_exists('google_maps_url', $validated)) {
            $updates['google_maps_url'] = $validated['google_maps_url'];
        }

        if (array_key_exists('embed_url', $validated)) {
            $updates['embed_url'] = $validated['embed_url'];
        }

        if (array_key_exists('is_active', $validated)) {
            $updates['is_active'] = $validated['is_active'];
        }

        $venue->update($updates);

        return back();
    }

    public function destroy(Venue $venue)
    {
        $venue->delete();

        return back();
    }
}
