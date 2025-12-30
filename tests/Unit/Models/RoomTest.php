<?php

namespace Tests\Unit\Models;

use App\Models\Bed;
use App\Models\Floor;
use App\Models\Room;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('room belongs to a floor', function () {
    $floor = Floor::factory()->create();
    $room = Room::factory()->create(['floor_id' => $floor->id]);

    expect($room->floor->id)->toBe($floor->id);
});

test('room has many beds', function () {
    $room = Room::factory()->create();
    $bed = Bed::factory()->create(['room_id' => $room->id]);

    expect($room->beds)->toHaveCount(1)
        ->and($room->beds->first()->id)->toBe($bed->id);
});

test('room scopes by gender', function () {
    Room::factory()->create(['gender' => 'male']);
    Room::factory()->create(['gender' => 'female']);
    Room::factory()->create(['gender' => 'any']);

    expect(Room::where('gender', 'male')->count())->toBe(1);
});
