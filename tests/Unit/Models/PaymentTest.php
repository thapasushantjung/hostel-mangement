<?php

namespace Tests\Unit\Models;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('payment belongs to invoice', function () {
    $invoice = Invoice::factory()->create();
    $payment = Payment::factory()->create([
        'invoice_id' => $invoice->id,
        'tenant_id' => $invoice->tenant_id,
        'hostel_id' => $invoice->hostel_id
    ]);

    expect($payment->invoice->id)->toBe($invoice->id);
});
