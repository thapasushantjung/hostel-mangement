<?php

use App\Models\User;
use Laravel\Dusk\Browser;

test('users can login', function () {
    $user = User::factory()->create([
        'email' => 'dusk@example.com',
        'password' => bcrypt('password'),
    ]);

    $this->browse(function (Browser $browser) use ($user) {
        $browser->visit('/login')
                ->type('email', $user->email)
                ->type('password', 'password')
                ->press('Log in')
                ->assertPathIs('/dashboard');
    });
});
