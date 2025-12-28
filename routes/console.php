<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Generate monthly invoices - Runs daily but only processing on 1st of Nepali month (handled in command)
Schedule::command('finance:generate-invoices --publish')
    ->dailyAt('06:00')
    ->timezone('Asia/Kathmandu')
    ->description('Generate monthly invoices for all active tenants');

// Mark overdue invoices daily at midnight
Schedule::command('finance:check-overdue')
    ->dailyAt('00:01')
    ->timezone('Asia/Kathmandu')
    ->description('Mark pending invoices as overdue if past due date');
