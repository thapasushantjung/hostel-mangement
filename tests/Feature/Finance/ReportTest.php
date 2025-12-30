<?php

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;

test('reports page displays daily collection and defaulters', function () {
    $user = createOwnerWithHostel();

    $response = $this
        ->actingAs($user)
        ->get(route('finance.reports'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Finance/Reports')
        ->has('dailyCollection')
        ->has('defaulters')
        ->has('profitLoss')
    );
});
