<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;


use App\Models\Country;
use App\Models\UserType;
use App\Models\Issuance;
use App\Models\Programme;
use App\Models\ParticipantTableAssignment;
use App\Models\ActivityLog;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'contact_number',
        'password',
        'country_id',
        'user_type_id',
        'is_active',
        'consent_contact_sharing',
        'consent_photo_video',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_active' => 'boolean',
            'consent_contact_sharing' => 'boolean',
            'consent_photo_video' => 'boolean',
        ];
    }


  protected static function booted(): void
{
    static::creating(function ($user) {
        if (empty($user->display_id)) {
            // Nice human-readable ID
            $user->display_id = 'ASEAN-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4));
        }

        if (empty($user->qr_token)) {
            $user->qr_token = (string) Str::uuid();
        }

        if (empty($user->qr_payload)) {
            // ✅ encrypted payload (safe to embed in QR)
            // You can encrypt the token only, or a small JSON payload.
            $user->qr_payload = Crypt::encryptString($user->qr_token);
        }
    });
}

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function userType()
    {
        return $this->belongsTo(UserType::class);
    }

    public function issuances()
    {
        return $this->hasMany(Issuance::class);
    }

    public function joinedProgrammes(): BelongsToMany
    {
        return $this->belongsToMany(Programme::class, 'participant_programmes')->withTimestamps();
    }

    public function tableAssignments(): HasMany
    {
        return $this->hasMany(ParticipantTableAssignment::class);
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }
}
