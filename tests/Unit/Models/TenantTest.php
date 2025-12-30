<?php

namespace Tests\Unit\Models;

use App\Models\Booking;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('tenant has active booking', function () {
    $tenant = Tenant::factory()->create();
    $booking = Booking::factory()->create([
        'tenant_id' => $tenant->id,
        'is_active' => true
    ]);

    expect($tenant->activeBooking->id)->toBe($booking->id);
});
