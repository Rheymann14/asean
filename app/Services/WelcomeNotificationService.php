<?php

namespace App\Services;

use App\Mail\ParticipantWelcomeMail;
use App\Models\User;
use Brevo\Client\Api\TransactionalEmailsApi;
use Brevo\Client\Configuration;
use Brevo\Client\Model\SendSmtpEmail;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class WelcomeNotificationService
{
    public function dispatch(User $user): void
    {
        dispatch(function () use ($user) {
            $this->sendWelcomeEmail($user);
            rescue(fn () => app(SemaphoreSms::class)->sendWelcome($user), report: true);
        })->afterResponse();
    }

    private function sendWelcomeEmail(User $user): void
    {
        try {
            Mail::to($user->email)->send(new ParticipantWelcomeMail($user));
        } catch (Throwable $exception) {
            report($exception);
            $this->sendViaBrevoApi($user, $exception);
        }
    }

    private function sendViaBrevoApi(User $user, Throwable $sourceException): void
    {
        $apiKey = env('BREVO_API_KEY');

        if (! $apiKey) {
            Log::warning('Welcome email fallback skipped: BREVO_API_KEY missing.', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $sourceException->getMessage(),
            ]);

            return;
        }

        try {
            $config = Configuration::getDefaultConfiguration()->setApiKey('api-key', $apiKey);
            $api = new TransactionalEmailsApi(new Client(), $config);

            $fromAddress = (string) config('mail.from.address', 'ph2026@asean.chedro12.com');
            $fromName = (string) config('mail.from.name', 'ASEAN PH 2026');
            $appUrl = (string) rtrim((string) config('app.url', 'https://asean.ched.gov.ph'), '/');

            $html = sprintf(
                '<p>Hi %s,</p><p>Welcome to ASEAN PH 2026. Your registration is confirmed.</p><p>You may log in at <a href="%s">%s</a> using your email: <strong>%s</strong>.</p><p>This is a no-reply email.</p>',
                e($user->name),
                e($appUrl),
                e($appUrl),
                e($user->email)
            );

            $email = new SendSmtpEmail([
                'sender' => [
                    'name' => $fromName,
                    'email' => $fromAddress,
                ],
                'to' => [[
                    'email' => $user->email,
                    'name' => $user->name,
                ]],
                'subject' => 'Welcome to ASEAN PH 2026 — Your Registration Details',
                'htmlContent' => $html,
                'textContent' => "Welcome to ASEAN PH 2026. Your registration is confirmed. Login at {$appUrl} using {$user->email}.",
            ]);

            $api->sendTransacEmail($email);
        } catch (Throwable $fallbackException) {
            report($fallbackException);

            Log::error('Welcome email fallback via Brevo API failed.', [
                'user_id' => $user->id,
                'email' => $user->email,
                'smtp_error' => $sourceException->getMessage(),
                'fallback_error' => $fallbackException->getMessage(),
            ]);
        }
    }
}
