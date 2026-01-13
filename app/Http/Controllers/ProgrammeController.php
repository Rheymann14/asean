<?php

namespace App\Http\Controllers;

use App\Models\Programme;
use App\Models\ParticipantAttendance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ProgrammeController extends Controller
{
    public function index()
    {
        $programmes = Programme::query()
            ->with('user')
            ->latest('starts_at')
            ->get()
            ->map(fn (Programme $programme) => [
                'id' => $programme->id,
                'tag' => $programme->tag,
                'title' => $programme->title,
                'description' => $programme->description,
                'starts_at' => $programme->starts_at?->toISOString(),
                'ends_at' => $programme->ends_at?->toISOString(),
                'location' => $programme->location,
                'image_url' => $programme->image_url,
                'pdf_url' => $programme->pdf_url,
                'is_active' => $programme->is_active,
                'updated_at' => $programme->updated_at?->toISOString(),
                'created_by' => $programme->user
                    ? [
                        'name' => $programme->user->name,
                    ]
                    : null,
            ]);

        return Inertia::render('event-management', [
            'programmes' => $programmes,
        ]);
    }

    public function publicIndex()
    {
        $programmes = Programme::query()
            ->where('is_active', true)
            ->latest('starts_at')
            ->get()
            ->map(fn (Programme $programme) => [
                'id' => $programme->id,
                'tag' => $programme->tag,
                'title' => $programme->title,
                'description' => $programme->description,
                'starts_at' => $programme->starts_at?->toISOString(),
                'ends_at' => $programme->ends_at?->toISOString(),
                'location' => $programme->location,
                'image_url' => $programme->image_url,
                'pdf_url' => $programme->pdf_url,
                'is_active' => $programme->is_active,
                'updated_at' => $programme->updated_at?->toISOString(),
            ]);

        return Inertia::render('event', [
            'programmes' => $programmes,
        ]);
    }

    public function participantIndex(Request $request)
    {
        $attendanceEntries = ParticipantAttendance::query()
            ->select(['programme_id', 'scanned_at'])
            ->where('user_id', $request->user()->id)
            ->get();

        $programmes = Programme::query()
            ->with(['venues' => fn ($query) => $query->where('is_active', true)->orderBy('id')])
            ->latest('starts_at')
            ->get()
            ->map(function (Programme $programme) {
                $venue = $programme->venues->first();

                return [
                    'id' => $programme->id,
                    'tag' => $programme->tag,
                    'title' => $programme->title,
                    'description' => $programme->description,
                    'starts_at' => $programme->starts_at?->toISOString(),
                    'ends_at' => $programme->ends_at?->toISOString(),
                    'location' => $programme->location,
                    'venue' => $venue
                        ? [
                            'name' => $venue->name,
                            'address' => $venue->address,
                        ]
                        : null,
                    'image_url' => $programme->image_url,
                    'pdf_url' => $programme->pdf_url,
                    'is_active' => $programme->is_active,
                    'updated_at' => $programme->updated_at?->toISOString(),
                ];
            });

        return Inertia::render('event-list', [
            'programmes' => $programmes,
            'joined_programme_ids' => $request->user()
                ->joinedProgrammes()
                ->pluck('programmes.id'),
            'checked_in_programmes' => $attendanceEntries
                ->map(fn (ParticipantAttendance $attendance) => [
                    'programme_id' => $attendance->programme_id,
                    'scanned_at' => $attendance->scanned_at?->toISOString(),
                ])
                ->values()
                ->all(),
        ]);
    }

    public function join(Request $request, Programme $programme)
    {
        $now = now();
        $startsAt = $programme->starts_at;
        $endsAt = $programme->ends_at;

        if (!$programme->is_active) {
            return back()->withErrors(['event' => 'This event is closed.']);
        }

        if ($endsAt && $now->greaterThan($endsAt)) {
            return back()->withErrors(['event' => 'This event is closed.']);
        }

        if (!$endsAt && $startsAt && $now->greaterThan($startsAt) && !$now->isSameDay($startsAt)) {
            return back()->withErrors(['event' => 'This event is closed.']);
        }

        $request->user()->joinedProgrammes()->syncWithoutDetaching([$programme->id]);

        return back();
    }

    public function leave(Request $request, Programme $programme)
    {
        $request->user()->joinedProgrammes()->detach($programme->id);

        return back();
    }

    public function clearSelections(Request $request)
    {
        $request->user()->joinedProgrammes()->detach();

        return back();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tag' => ['nullable', 'string', 'max:255'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'location' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'max:10240'],
            'pdf' => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $imageName = null;
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $imageName = Str::uuid()->toString() . '.' . $file->getClientOriginalExtension();
            $destination = public_path('event-images');

            if (!File::exists($destination)) {
                File::makeDirectory($destination, 0755, true);
            }

            $file->move($destination, $imageName);
        }

        $pdfName = null;
        if ($request->hasFile('pdf')) {
            $file = $request->file('pdf');
            $destination = public_path('downloadables');

            if (!File::exists($destination)) {
                File::makeDirectory($destination, 0755, true);
            }

            $pdfName = $this->resolveUploadName($file->getClientOriginalName(), $destination);
            $file->move($destination, $pdfName);
        }

        Programme::create([
            'user_id' => $request->user()->id,
            'tag' => $validated['tag'] ?? '',
            'title' => $validated['title'],
            'description' => $validated['description'],
            'starts_at' => $validated['starts_at'] ?? null,
            'ends_at' => $validated['ends_at'] ?? null,
            'location' => $validated['location'] ?? '',
            'image_url' => $imageName,
            'pdf_url' => $pdfName,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return back();
    }

    public function update(Request $request, Programme $programme)
    {
        $validated = $request->validate([
            'tag' => ['sometimes', 'nullable', 'string', 'max:255'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'required', 'string'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'max:10240'],
            'pdf' => ['nullable', 'file', 'mimes:pdf', 'max:20480'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $imageName = Str::uuid()->toString() . '.' . $file->getClientOriginalExtension();
            $destination = public_path('event-images');

            if (!File::exists($destination)) {
                File::makeDirectory($destination, 0755, true);
            }

            $file->move($destination, $imageName);

            if ($programme->image_url) {
                $existing = public_path('event-images/' . ltrim($programme->image_url, '/'));
                if (File::exists($existing)) {
                    File::delete($existing);
                }
            }

            $validated['image_url'] = $imageName;
        }

        if ($request->hasFile('pdf')) {
            $file = $request->file('pdf');
            $destination = public_path('downloadables');

            if (!File::exists($destination)) {
                File::makeDirectory($destination, 0755, true);
            }

            $pdfName = $this->resolveUploadName($file->getClientOriginalName(), $destination);
            $file->move($destination, $pdfName);

            if ($programme->pdf_url) {
                $existing = public_path('downloadables/' . ltrim($programme->pdf_url, '/'));
                if (File::exists($existing)) {
                    File::delete($existing);
                }
            }

            $validated['pdf_url'] = $pdfName;
        }

        $programme->update($validated);

        return back();
    }

    public function destroy(Programme $programme)
    {
        if ($programme->image_url) {
            $existing = public_path('event-images/' . ltrim($programme->image_url, '/'));
            if (File::exists($existing)) {
                File::delete($existing);
            }
        }

        if ($programme->pdf_url) {
            $existing = public_path('downloadables/' . ltrim($programme->pdf_url, '/'));
            if (File::exists($existing)) {
                File::delete($existing);
            }
        }

        $programme->delete();

        return back();
    }

    private function resolveUploadName(string $originalName, string $destination): string
    {
        $candidate = $originalName;
        $path = $destination . DIRECTORY_SEPARATOR . $candidate;

        if (!File::exists($path)) {
            return $candidate;
        }

        $base = pathinfo($originalName, PATHINFO_FILENAME);
        $ext = pathinfo($originalName, PATHINFO_EXTENSION);
        $suffix = 1;

        do {
            $candidate = $base . '-' . $suffix . ($ext ? '.' . $ext : '');
            $path = $destination . DIRECTORY_SEPARATOR . $candidate;
            $suffix++;
        } while (File::exists($path));

        return $candidate;
    }
}
