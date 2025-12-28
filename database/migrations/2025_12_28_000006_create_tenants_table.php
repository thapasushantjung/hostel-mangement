<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hostel_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('parent_phone')->nullable();
            $table->string('photo_url')->nullable();
            $table->string('home_location')->nullable(); // "Chitwan", "Kathmandu"
            $table->string('id_type')->nullable(); // "citizenship", "passport"
            $table->string('id_number')->nullable();
            $table->enum('status', ['active', 'leaving', 'left'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
