<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'first_name',
        'last_name',
        'nickname',
        'username',
        'email',
        'password',
        'user_type',
        'account_type',
        'premium_expiry',
        'bills_created_count',
        'bills_count_reset_at',
        'last_access_time',
        'access_hours_used',
        'access_reset_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'premium_expiry' => 'datetime',
        'bills_count_reset_at' => 'datetime',
        'last_access_time' => 'datetime',
        'access_reset_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function bills()
    {
        return $this->hasMany(Bill::class, 'created_by');
    }

    public function billUsers()
    {
        return $this->hasMany(BillUser::class);
    }

    public function invitations()
    {
        return $this->hasMany(Invitation::class, 'invited_by');
    }

    public function isGuest()
    {
        return $this->user_type === 'guest';
    }

    public function isPremium()
    {
        return $this->account_type === 'premium' && ($this->premium_expiry === null || $this->premium_expiry->isFuture());
    }

    public function canCreateBill()
    {
        if ($this->isPremium()) {
            return true;
        }
        
        // Standard users: max 5 bills per month
        $resetAt = $this->bills_count_reset_at;
        $now = now();
        
        if ($resetAt === null || $resetAt->diffInDays($now) >= 30) {
            return true; // Reset counter
        }
        
        return $this->bills_created_count < 5;
    }

    public function canAccessBill($accessHoursUsed)
    {
        // Guest users: max 6 hours access per day
        if ($this->isGuest()) {
            return $accessHoursUsed < 6;
        }
        return true;
    }
}
