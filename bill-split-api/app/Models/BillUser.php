<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillUser extends Model
{
    use HasFactory;

    protected $fillable = [
        'bill_id',
        'user_id',
        'share_amount',
        'payment_status',
    ];

    public function bill()
    {
        return $this->belongsTo(Bill::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
