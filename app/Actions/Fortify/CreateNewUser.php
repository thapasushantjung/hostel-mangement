<?php

namespace App\Actions\Fortify;

use App\Models\Hostel;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validate and create a newly registered user with their hostel.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
            'password' => $this->passwordRules(),
            'hostel_name' => ['required', 'string', 'max:255'],
        ])->validate();

        return DB::transaction(function () use ($input) {
            // Create the user first (without hostel_id)
            $user = User::create([
                'name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
                'role' => 'owner',
            ]);

            // Create the hostel with this user as owner
            $hostel = Hostel::create([
                'owner_id' => $user->id,
                'name' => $input['hostel_name'],
                'pricing_config' => [
                    'single' => 8000,
                    'double' => 6000,
                    'triple' => 5000,
                    'quad' => 4500,
                ],
            ]);

            // Link user to their hostel
            $user->update(['hostel_id' => $hostel->id]);

            return $user->fresh();
        });
    }
}
