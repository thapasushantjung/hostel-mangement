<?php

use App\Models\Bed;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;

test('bed grid index page is displayed', function () {
    $user = createOwnerWithHostel();

    $response = $this
        ->actingAs($user)
        ->get(route('bed-grid'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('BedGrid/Index')
        ->has('floors')
        ->has('allTenants')
    );
});

test('can assign tenant to a bed', function () {
    $user = createOwnerWithHostel();
    // Ensure room and bed belong to the user's hostel
    $floor = \App\Models\Floor::factory()->create(['hostel_id' => $user->hostel_id]);
    $room = Room::factory()->create(['hostel_id' => $user->hostel_id, 'floor_id' => $floor->id]);
    $bed = Bed::factory()->create([
        'hostel_id' => $user->hostel_id,
        'room_id' => $room->id,
        'status' => 'available'
    ]);

    $response = $this
        ->actingAs($user)
        ->post(route('bed-grid.assign', $bed), [
            'name' => 'New Tenant',
            'phone' => '9800000000',
            'agreed_rent' => 5000,
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $bed->refresh();
    expect($bed->status)->toBe('occupied');
    expect(Tenant::where('name', 'New Tenant')->exists())->toBeTrue();
});
