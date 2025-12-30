<?php

namespace Tests\Unit\Models;

use App\Models\Bed;
use App\Models\Floor;
use App\Models\Hostel;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('floor has many rooms', function () {
    $floor = Floor::factory()->create();
    $room = Room::factory()->create(['floor_id' => $floor->id]);

    expect($floor->rooms)->toHaveCount(1)
        ->and($floor->rooms->first()->id)->toBe($room->id);
});

test('floor belongs to a hostel', function () {
    $hostel = Hostel::factory()->create();
    $floor = Floor::factory()->create(['hostel_id' => $hostel->id]);

    expect($floor->hostel->id)->toBe($hostel->id);
});
