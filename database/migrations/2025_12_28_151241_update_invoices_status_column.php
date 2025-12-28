<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Changes status from enum to string to support all statuses (draft, pending, partial, paid, overdue, cancelled)
     */
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            // MySQL: Change enum to string
            DB::statement("ALTER TABLE invoices MODIFY COLUMN status VARCHAR(20) DEFAULT 'pending'");
        }
        // SQLite uses text by default for all strings, so enum columns are already string-compatible
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending'");
        }
    }
};
