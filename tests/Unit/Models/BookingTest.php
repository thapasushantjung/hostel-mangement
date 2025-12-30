<?php

namespace Tests\Unit\Models;

use App\Models\Booking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;

uses(RefreshDatabase::class);

test('booking has days stayed attribute', function () {
    $start = Carbon::now()->subDays(10);
    $booking = Booking::factory()->create([
        'start_date' => $start,
        'end_date' => null,
    ]);

    // Difference between now and 10 days ago is 10 days
    expect($booking->days_stayed)->toBe(10);

    $booking->update(['end_date' => $start->copy()->addDays(5)]);
    expect($booking->fresh()->days_stayed)->toBe(5);
});
