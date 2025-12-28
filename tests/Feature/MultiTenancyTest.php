<?php

use App\Models\Bed;
use App\Models\Hostel;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;

use function Pest\Laravel\actingAs;

beforeEach(function () {
    // Create two hostels with different owners
    $this->owner1 = User::factory()->create(['role' => 'owner']);
    $this->hostel1 = Hostel::factory()->create(['owner_id' => $this->owner1->id]);
    $this->owner1->update(['hostel_id' => $this->hostel1->id]);

    $this->owner2 = User::factory()->create(['role' => 'owner']);
    $this->hostel2 = Hostel::factory()->create(['owner_id' => $this->owner2->id]);
    $this->owner2->update(['hostel_id' => $this->hostel2->id]);
});

it('users can only see their own hostel tenants', function () {
    // Create tenants for both hostels
    $tenant1 = Tenant::factory()->create(['hostel_id' => $this->hostel1->id]);
    $tenant2 = Tenant::factory()->create(['hostel_id' => $this->hostel2->id]);

    // Acting as owner1, should only see tenant1
    actingAs($this->owner1);
    $tenants = Tenant::all();

    expect($tenants)->toHaveCount(1);
    expect($tenants->first()->id)->toBe($tenant1->id);
});

it('users can only see their own hostel rooms', function () {
    // Create rooms for both hostels (need floors first)
    $floor1 = \App\Models\Floor::factory()->create(['hostel_id' => $this->hostel1->id]);
    $floor2 = \App\Models\Floor::factory()->create(['hostel_id' => $this->hostel2->id]);

    $room1 = Room::factory()->create(['hostel_id' => $this->hostel1->id, 'floor_id' => $floor1->id]);
    $room2 = Room::factory()->create(['hostel_id' => $this->hostel2->id, 'floor_id' => $floor2->id]);

    actingAs($this->owner1);
    $rooms = Room::all();

    expect($rooms)->toHaveCount(1);
    expect($rooms->first()->id)->toBe($room1->id);
});

it('users can only see their own hostel beds', function () {
    $floor1 = \App\Models\Floor::factory()->create(['hostel_id' => $this->hostel1->id]);
    $floor2 = \App\Models\Floor::factory()->create(['hostel_id' => $this->hostel2->id]);

    $room1 = Room::factory()->create(['hostel_id' => $this->hostel1->id, 'floor_id' => $floor1->id]);
    $room2 = Room::factory()->create(['hostel_id' => $this->hostel2->id, 'floor_id' => $floor2->id]);

    $bed1 = Bed::factory()->create(['hostel_id' => $this->hostel1->id, 'room_id' => $room1->id]);
    $bed2 = Bed::factory()->create(['hostel_id' => $this->hostel2->id, 'room_id' => $room2->id]);

    actingAs($this->owner1);
    $beds = Bed::all();

    expect($beds)->toHaveCount(1);
    expect($beds->first()->id)->toBe($bed1->id);
});

it('automatically sets hostel_id when creating models', function () {
    actingAs($this->owner1);

    $tenant = Tenant::create([
        'name' => 'Auto Test Tenant',
        'phone' => '+977-1234567890',
    ]);

    expect($tenant->hostel_id)->toBe($this->hostel1->id);
});

it('warden users can see their hostel data', function () {
    $warden = User::factory()->create([
        'role' => 'warden',
        'hostel_id' => $this->hostel1->id,
    ]);

    $tenant1 = Tenant::factory()->create(['hostel_id' => $this->hostel1->id]);
    $tenant2 = Tenant::factory()->create(['hostel_id' => $this->hostel2->id]);

    actingAs($warden);
    $tenants = Tenant::all();

    expect($tenants)->toHaveCount(1);
    expect($tenants->first()->id)->toBe($tenant1->id);
});
