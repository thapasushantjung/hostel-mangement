<?php

use App\Models\Tenant;
use App\Models\User;

test('tenant index page is displayed', function () {
    $user = createOwnerWithHostel();

    $response = $this
        ->actingAs($user)
        ->get(route('tenants.index'));

    $response->assertOk();
});

test('can create a tenant', function () {
    $user = createOwnerWithHostel();

    $response = $this
        ->actingAs($user)
        ->post(route('tenants.store'), [
            'name' => 'Test Tenant',
            'phone' => '9800000000',
            'home_location' => 'Kathmandu',
        ]);

    $response->assertRedirect(route('tenants.index'));
    // Scope should ensure tenant is created for this hostel
    expect(Tenant::where('name', 'Test Tenant')->where('hostel_id', $user->hostel_id)->exists())->toBeTrue();
});

test('can update a tenant', function () {
    $user = createOwnerWithHostel();
    $tenant = Tenant::factory()->create(['hostel_id' => $user->hostel_id]);

    $response = $this
        ->actingAs($user)
        ->put(route('tenants.update', $tenant), [
            'name' => 'Updated Name',
            'phone' => $tenant->phone,
        ]);

    $response->assertRedirect();
    expect($tenant->fresh()->name)->toBe('Updated Name');
});
