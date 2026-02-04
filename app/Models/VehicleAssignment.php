<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehicleAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'vehicle_label',
        'pickup_status',
        'pickup_location',
        'pickup_at',
        'dropoff_location',
        'dropoff_at',
    ];

    protected $casts = [
        'pickup_at' => 'datetime',
        'dropoff_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
