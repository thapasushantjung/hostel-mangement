<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('hostel_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->enum('role', ['owner', 'warden'])->default('owner')->after('hostel_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['hostel_id']);
            $table->dropColumn(['hostel_id', 'role']);
        });
    }
};
