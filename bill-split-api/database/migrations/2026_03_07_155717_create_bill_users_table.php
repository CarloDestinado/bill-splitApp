<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bill_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bill_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->decimal('share_amount', 10, 2)->nullable();
            $table->enum('payment_status', ['pending', 'paid', 'partial'])->default('pending');
            $table->timestamps();
            
            $table->unique(['bill_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_users');
    }
};
