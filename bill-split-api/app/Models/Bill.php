<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bill extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by',
        'title',
        'total_amount',
        'invitation_code',
        'status',
        'due_date',
        'description',
    ];

    protected $casts = [
        'due_date' => 'date',
        'total_amount' => 'decimal:2',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'bill_users')
            ->withPivot('share_amount', 'payment_status')
            ->withTimestamps();
    }

    public function invitations()
    {
        return $this->hasMany(Invitation::class);
    }

    public function billUsers()
    {
        return $this->hasMany(BillUser::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($bill) {
            $bill->invitation_code = strtoupper(substr(md5(uniqid()), 0, 8));
        });
    }
}
