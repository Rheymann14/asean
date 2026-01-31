<?php

namespace App\Mail;

use App\Models\ParticipantTableAssignment;
use App\Models\Programme;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

class ParticipantWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user)
    {
        $this->user->loadMissing([
            'country',
            'joinedProgrammes',
            'tableAssignments.participantTable',
            'tableAssignments.programme',
        ]);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to ASEAN PH 2026 — Your Registration Details',
        );
    }

    public function content(): Content
    {
        $qrUrl = $this->qrUrl();

        $events = $this->user->joinedProgrammes
            ->sortBy('starts_at')
            ->values()
            ->map(fn (Programme $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'starts_at' => $event->starts_at?->format('F j, Y g:i A'),
                'ends_at' => $event->ends_at?->format('F j, Y g:i A'),
            ]);

        /** @var Collection<int, ParticipantTableAssignment> $assignments */
        $assignments = $this->user->tableAssignments->keyBy('programme_id');

        return new Content(
            view: 'emails.participant-welcome',
            with: [
                'appUrl' => config('app.url') ?: 'https://asean.chedro12.com',
                'bannerUrl' => 'public/img/asean_banner_logo.png',
                'logoUrl' => asset('img/asean_logo.png'),
                'events' => $events,
                'assignments' => $assignments,
                'qrImage' => $this->fetchQrImage($qrUrl),
                'qrUrl' => $qrUrl,
                'user' => $this->user,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }

    private function qrUrl(): string
    {
        $payload = urlencode((string) $this->user->qr_payload);

        return "https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data={$payload}";
    }

    private function fetchQrImage(string $url): ?string
    {
        try {
            $response = Http::timeout(6)->get($url);

            if (! $response->successful()) {
                return null;
            }

            return $response->body();
        } catch (\Throwable) {
            return null;
        }
    }
}
