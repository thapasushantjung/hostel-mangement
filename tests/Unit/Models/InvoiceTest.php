<?php

namespace Tests\Unit\Models;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('invoice calculates total due', function () {
    $invoice = Invoice::factory()->create([
        'amount' => 1000,
        'fine' => 100,
    ]);

    expect($invoice->total_due)->toBe(1100.00);
});

test('invoice calculates balance', function () {
    $invoice = Invoice::factory()->create([
        'amount' => 1000,
        'fine' => 0,
        'paid_amount' => 400,
    ]);

    expect($invoice->balance)->toBe(600.00);
});

test('invoice checks overdue status', function () {
    $invoice = Invoice::factory()->create([
        'status' => 'pending',
        'due_date' => now()->subDay(),
    ]);

    expect($invoice->isOverdue())->toBeTrue();

    $invoice->update(['due_date' => now()->addDay()]);
    expect($invoice->isOverdue())->toBeFalse();
});

test('invoice adds payment and recalculates status', function () {
    $invoice = Invoice::factory()->create([
        'amount' => 1000,
        'fine' => 0,
        'paid_amount' => 0,
        'status' => 'pending',
    ]);

    // We need an authenticated user with the same hostel_id for AuditLog and Payment
    $user = User::factory()->create(['hostel_id' => $invoice->hostel_id]);
    $this->actingAs($user);

    $invoice->addPayment(500, 'cash');

    $invoice->refresh();
    expect($invoice->paid_amount)->toEqual(500.00)
        ->and($invoice->status)->toBe('partial');

    $invoice->addPayment(500, 'cash');
    $invoice->refresh();
    expect($invoice->paid_amount)->toEqual(1000.00)
        ->and($invoice->status)->toBe('paid')
        ->and($invoice->paid_at)->not->toBeNull();
});

test('invoice can be voided', function () {
    $invoice = Invoice::factory()->create();
    
    $user = User::factory()->create(['hostel_id' => $invoice->hostel_id]);
    $this->actingAs($user);

    $invoice->void('Mistake');

    expect($invoice->status)->toBe('cancelled')
        ->and($invoice->cancelled_reason)->toBe('Mistake')
        ->and($invoice->deleted_at)->not->toBeNull();
});
