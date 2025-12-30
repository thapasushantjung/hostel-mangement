<?php

use App\Models\Expense;
use App\Models\User;
use Illuminate\Support\Carbon;

test('finance index displays invoices and expenses', function () {
    $user = createOwnerWithHostel();

    $response = $this
        ->actingAs($user)
        ->get(route('finance.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Finance/Index')
        ->has('invoices')
        ->has('expenses')
    );
});

test('can filter invoices by tab', function () {
    $user = createOwnerWithHostel();

    $response = $this
        ->actingAs($user)
        ->get(route('finance.index', ['tab' => 'paid']));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('activeTab', 'paid')
    );
});

test('can store expense', function () {
    $user = createOwnerWithHostel();

    $response = $this
        ->actingAs($user)
        ->post(route('finance.store-expense'), [
            'category' => 'Utilities',
            'amount' => 1000,
            'expense_date' => Carbon::now()->toDateString(),
            'description' => 'Electricity Bill',
        ]);

    $response->assertRedirect();
    expect(Expense::where('description', 'Electricity Bill')->where('hostel_id', $user->hostel_id)->exists())->toBeTrue();
});
