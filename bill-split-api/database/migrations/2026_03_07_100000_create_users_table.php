<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email')->unique();
            $table->string('password')->nullable();
            $table->enum('user_type', ['guest', 'registered'])->default('guest');
            $table->enum('account_type', ['standard', 'premium'])->default('standard');
            $table->timestamp('premium_expiry')->nullable();
            $table->integer('bills_created_count')->default(0);
            $table->timestamp('bills_count_reset_at')->nullable();
            $table->timestamp('last_access_time')->nullable();
            $table->integer('access_hours_used')->default(0);
            $table->timestamp('access_reset_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
