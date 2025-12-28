<?php

namespace Database\Seeders;

use App\Models\Bed;
use App\Models\Booking;
use App\Models\Expense;
use App\Models\Floor;
use App\Models\Hostel;
use App\Models\Invoice;
use App\Models\Room;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with realistic hostel data.
     */
    public function run(): void
    {
        // Create the owner user
        $owner = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
                'email_verified_at' => now(),
                'role' => 'owner',
            ]
        );

        // Create the hostel
        $hostel = Hostel::firstOrCreate(
            ['owner_id' => $owner->id],
            [
                'name' => 'Sunrise Hostel',
                'address' => 'Bagbazar, Kathmandu',
                'phone' => '+977-9841234567',
                'pricing_config' => [
                    'single' => 8000,
                    'double' => 6000,
                    'triple' => 5000,
                    'quad' => 4500,
                ],
            ]
        );

        // Associate owner with hostel
        $owner->update(['hostel_id' => $hostel->id]);

        // Create a warden
        User::firstOrCreate(
            ['email' => 'warden@example.com'],
            [
                'name' => 'Warden User',
                'password' => 'password',
                'email_verified_at' => now(),
                'role' => 'warden',
                'hostel_id' => $hostel->id,
            ]
        );

        // Create floors
        $floors = collect([
            Floor::firstOrCreate(['hostel_id' => $hostel->id, 'name' => 'Ground Floor'], ['order' => 0]),
            Floor::firstOrCreate(['hostel_id' => $hostel->id, 'name' => '1st Floor'], ['order' => 1]),
            Floor::firstOrCreate(['hostel_id' => $hostel->id, 'name' => '2nd Floor'], ['order' => 2]),
        ]);

        $roomNumber = 100;
        $bedLabels = ['A', 'B', 'C', 'D'];

        foreach ($floors as $floor) {
            $floorPrefix = match ($floor->order) {
                0 => 'G',
                1 => '1',
                2 => '2',
                default => $floor->order,
            };

            // Create 3-4 rooms per floor
            $roomsPerFloor = $floor->order === 0 ? 3 : 4;

            for ($r = 1; $r <= $roomsPerFloor; $r++) {
                $capacity = fake()->randomElement([2, 2, 4, 4]);
                $gender = fake()->randomElement(['male', 'female', 'any']);
                $basePrice = match ($capacity) {
                    1 => 8000,
                    2 => 6000,
                    3 => 5000,
                    4 => 4500,
                    default => 5000,
                };

                $room = Room::firstOrCreate(
                    ['hostel_id' => $hostel->id, 'room_number' => $floorPrefix.'0'.$r],
                    [
                        'floor_id' => $floor->id,
                        'gender' => $gender,
                        'base_price' => $basePrice,
                        'capacity' => $capacity,
                    ]
                );

                // Create beds for this room
                for ($b = 0; $b < $capacity; $b++) {
                    Bed::firstOrCreate(
                        ['hostel_id' => $hostel->id, 'room_id' => $room->id, 'label' => $bedLabels[$b]],
                        ['status' => 'available']
                    );
                }

                $roomNumber++;
            }
        }

        // Refresh beds from DB
        $beds = Bed::where('hostel_id', $hostel->id)->get();

        // Create tenants and assign some to beds
        $occupiedCount = (int) ceil($beds->count() * 0.7); // 70% occupancy

        for ($i = 0; $i < $occupiedCount; $i++) {
            $tenant = Tenant::factory()->create([
                'hostel_id' => $hostel->id,
            ]);

            $bed = $beds[$i];

            // Create booking
            $startDate = fake()->dateTimeBetween('-6 months', '-1 month');
            $booking = Booking::create([
                'hostel_id' => $hostel->id,
                'tenant_id' => $tenant->id,
                'bed_id' => $bed->id,
                'start_date' => $startDate,
                'agreed_rent' => $bed->room->base_price,
                'advance_paid' => fake()->randomElement([0, 5000, 10000]),
                'is_active' => true,
            ]);

            // Update bed status
            $bed->update(['status' => 'occupied']);

            // Create invoices for this tenant
            $monthsStayed = now()->diffInMonths($startDate);
            for ($m = 0; $m <= $monthsStayed; $m++) {
                $period = now()->subMonths($monthsStayed - $m);
                $isPast = $m < $monthsStayed;

                Invoice::create([
                    'hostel_id' => $hostel->id,
                    'tenant_id' => $tenant->id,
                    'booking_id' => $booking->id,
                    'period' => $period->format('Y-m'),
                    'amount' => $booking->agreed_rent,
                    'fine' => $isPast && fake()->boolean(20) ? fake()->randomElement([100, 200, 500]) : 0,
                    'paid_amount' => $isPast ? $booking->agreed_rent : 0,
                    'status' => $isPast ? 'paid' : (fake()->boolean(30) ? 'overdue' : 'pending'),
                    'due_date' => $period->copy()->day(15),
                    'paid_at' => $isPast ? $period->copy()->day(fake()->numberBetween(10, 25)) : null,
                ]);
            }
        }

        // Mark some tenants as "leaving"
        Tenant::where('hostel_id', $hostel->id)
            ->inRandomOrder()
            ->limit(2)
            ->update(['status' => 'leaving']);

        // Put 1-2 beds in maintenance
        $beds->where('status', 'available')
            ->random(min(2, $beds->where('status', 'available')->count()))
            ->each(fn (Bed $bed) => $bed->update(['status' => 'maintenance']));

        // Create some expenses
        for ($i = 0; $i < 10; $i++) {
            Expense::factory()->create([
                'hostel_id' => $hostel->id,
                'expense_date' => fake()->dateTimeBetween('-3 months', 'now'),
            ]);
        }

        $this->command->info('Created: 1 Hostel, 3 Floors, '.Room::count().' Rooms, '.Bed::count().' Beds, '.Tenant::count().' Tenants');
    }
}
