<?php

namespace App\Mail;

use App\Models\Programme;
use App\Models\User;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ParticipantWelcomeMail extends Mailable
{
    use SerializesModels;

    public function __construct(
        public User $user,
        public bool $useBrevoView = false, // ✅ toggle which blade to use
    ) {
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
        return new Content(
            view: $this->useBrevoView
                ? 'emails.participant-welcome-brevo'
                : 'emails.participant-welcome',
            with: $this->data(),
        );
    }

    public function data(): array
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

        $assignments = $this->user->tableAssignments->keyBy('programme_id');

        // ✅ Prefer CDN base for email images (Brevo/Gmail safe)
        // Example: https://asean.chedro12.com OR https://cdn.chedro12.com
        $cdnBase = rtrim((string) env('MAIL_ASSET_URL', config('app.url', 'https://asean.chedro12.com')), '/');

        // ✅ Image public paths (for SMTP embeds only)
        $bannerPath = public_path('img/asean_banner_logo.png');
        $logoPath = public_path('img/asean_logo.png');
        $bagongPilipinasPath = public_path('img/bagong_pilipinas.png');

        return [
            // links
            'appUrl' => rtrim((string) config('app.url', 'https://asean.chedro12.com'), '/'),

            // ✅ always absolute, Gmail-safe
            'bannerUrl' => $cdnBase . '/img/asean_banner_logo.png',
            'logoUrl' => $cdnBase . '/img/asean_logo.png',
            'bagongPilipinasUrl' => $cdnBase . '/img/bagong_pilipinas.png',

            // ✅ for embed usage in normal SMTP blade only
            'bannerPath' => is_file($bannerPath) ? $bannerPath : null,
            'logoPath' => is_file($logoPath) ? $logoPath : null,
            'bagongPilipinasPath' => is_file($bagongPilipinasPath) ? $bagongPilipinasPath : null,

            // data
            'events' => $events,
            'assignments' => $assignments,
            'qrImage' => null,
            'qrUrl' => $qrUrl,
            'user' => $this->user,
        ];
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
}
