<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class SemaphoreSms
{
    public function sendWelcome(User $user): ?Response
    {
        $number = $this->normalizeNumber($user->contact_number);

        if ($number === null) {
            return null;
        }

        return $this->sendMessage($number, $this->buildWelcomeMessage($user));
    }

    public function sendMessage(string $number, string $message): ?Response
    {
        $apiKey = config('services.semaphore.key');
        $sender = config('services.semaphore.sender', 'SEMAPHORE');
        $endpoint = config('services.semaphore.endpoint', 'https://semaphore.co/api/v4/messages');

        if (! $apiKey) {
            return null;
        }

        return Http::asForm()
            ->timeout(10)
            ->post($endpoint, [
                'apikey' => $apiKey,
                'number' => $number,
                'message' => $message,
                'sendername' => $sender,
            ]);
    }

    private function buildWelcomeMessage(User $user): string
    {
        $appUrl = rtrim(config('app.url') ?: 'http://localhost:8000', '/');
        $name = $user->name;
        $email = $user->email;

        return implode("\n", [
            'Your ASEAN PH 2026 Higher Education Sector registration is confirmed 🎉',
            "Hi {$name}, thank you for registering! Please keep this message for your records and for smooth entry on event day.",
            '',
            "System link: {$appUrl} — log in anytime to review your profile, joined events, and check-in updates. Your username is: {$email}",
            '',
            'This is a no-reply message. For concerns.',
            '',
            'Welcome to ASEAN PH 2026 — thank you for registering!',
        ]);
    }

    private function normalizeNumber(?string $number): ?string
    {
        $number = trim((string) $number);

        if ($number === '') {
            return null;
        }

        return $number;
    }
}
