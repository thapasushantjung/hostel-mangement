<?php

namespace Tests\Unit\Models;

use App\Models\Bed;
use App\Models\Booking;
use App\Models\Room;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('bed belongs to a room', function () {
    $room = Room::factory()->create();
    $bed = Bed::factory()->create(['room_id' => $room->id]);

    expect($bed->room->id)->toBe($room->id);
});

test('bed has loadings', function () {
    $bed = Bed::factory()->create();
    $booking = Booking::factory()->create(['bed_id' => $bed->id]);

    expect($bed->bookings)->toHaveCount(1)
        ->and($bed->bookings->first()->id)->toBe($booking->id);
});

test('bed has active booking', function () {
    $bed = Bed::factory()->create();
    $activeBooking = Booking::factory()->create([
        'bed_id' => $bed->id,
        'is_active' => true,
    ]);
    Booking::factory()->create([
        'bed_id' => $bed->id,
        'is_active' => false,
    ]);

    expect($bed->activeBooking->id)->toBe($activeBooking->id);
});
