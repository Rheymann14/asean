<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

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
        $asciiOnly = (bool) config('services.semaphore.ascii_only', true);
        $maxLength = (int) config('services.semaphore.max_length', 459);

        if (! $apiKey) {
            return null;
        }

        $payload = [
            'apikey' => $apiKey,
            'number' => $number,
            'message' => $this->sanitizeMessage($message, $asciiOnly, $maxLength),
            'sendername' => $sender,
        ];

        $response = Http::asForm()
            ->timeout(10)
            ->post($endpoint, $payload);

        if (! $response->successful()) {
            Log::warning('Semaphore SMS send failed.', [
                'status' => $response->status(),
                'body' => $response->body(),
                'number' => $number,
            ]);
        }

        return $response;
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

    private function sanitizeMessage(string $message, bool $asciiOnly, int $maxLength): string
    {
        $message = $asciiOnly ? Str::ascii($message) : $message;

        return Str::limit($message, $maxLength, '');
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
