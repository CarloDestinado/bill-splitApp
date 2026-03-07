<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'bill_id',
        'invited_by',
        'invitee_email',
        'invitation_code',
        'status',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function bill()
    {
        return $this->belongsTo(Bill::class);
    }

    public function inviter()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($invitation) {
            $invitation->invitation_code = strtoupper(substr(md5(uniqid()), 0, 8));
            $invitation->expires_at = now()->addDays(7); // 7 days expiry
        });
    }

    public function isExpired()
    {
        return $this->expires_at && $this->expires_at->isPast();
    }
}
