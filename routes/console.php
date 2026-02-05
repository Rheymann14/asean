<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('mail:test {to : Recipient email address} {--subject=ASEAN PH 2026 Mail Test : Subject line for the test message} {--dry-run : Validate environment without sending}', function () {
    $to = (string) $this->argument('to');

    if (! filter_var($to, FILTER_VALIDATE_EMAIL)) {
        $this->error("Invalid recipient email: {$to}");

        return self::FAILURE;
    }

    $mailSettings = [
        'MAIL_MAILER' => env('MAIL_MAILER'),
        'MAIL_HOST' => env('MAIL_HOST'),
        'MAIL_PORT' => env('MAIL_PORT'),
        'MAIL_USERNAME' => env('MAIL_USERNAME'),
        'MAIL_PASSWORD' => env('MAIL_PASSWORD') ? '***set***' : null,
        'MAIL_ENCRYPTION' => env('MAIL_ENCRYPTION'),
        'MAIL_FROM_ADDRESS' => env('MAIL_FROM_ADDRESS'),
        'MAIL_FROM_NAME' => env('MAIL_FROM_NAME'),
    ];

    $this->info('Mail environment check:');
    foreach ($mailSettings as $key => $value) {
        $this->line(sprintf('- %s: %s', $key, filled($value) ? (string) $value : '<missing>'));
    }

    $requiredKeys = ['MAIL_MAILER', 'MAIL_HOST', 'MAIL_PORT', 'MAIL_FROM_ADDRESS'];
    $missing = collect($requiredKeys)
        ->filter(fn (string $key) => blank(env($key)))
        ->values();

    if ($missing->isNotEmpty()) {
        $this->warn('Missing required mail environment values: '.$missing->implode(', '));

        return self::FAILURE;
    }

    if ($this->option('dry-run')) {
        $this->comment('Dry run complete. No email was sent.');

        return self::SUCCESS;
    }

    $subject = (string) $this->option('subject');

    try {
        Mail::html(
            '<h2>ASEAN PH 2026 mail test</h2><p>This is a sample email to verify that outbound email is configured correctly.</p>',
            function ($message) use ($to, $subject): void {
                $message->to($to)->subject($subject);
            }
        );

        $this->info("Sample email sent successfully to {$to}.");

        return self::SUCCESS;
    } catch (Throwable $exception) {
        $this->error('Failed to send sample email.');
        $this->error($exception->getMessage());

        return self::FAILURE;
    }
})->purpose('Check mail environment variables and send a sample test email');
