<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bed;
use App\Models\Booking;
use App\Models\Expense;
use App\Models\Floor;
use App\Models\Invoice;
use App\Models\Room;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;

class SyncController extends Controller
{
    /**
     * Get all data for full sync to local database.
     */
    public function full(): JsonResponse
    {
        $floors = Floor::orderBy('order')->get();
        $rooms = Room::orderBy('room_number')->get();
        $beds = Bed::orderBy('label')->get();
        $tenants = Tenant::orderBy('name')->get();
        $bookings = Booking::all();
        $invoices = Invoice::orderByDesc('due_date')->limit(100)->get();
        $expenses = Expense::orderByDesc('expense_date')->limit(100)->get();

        // Return raw data for local storage (without resource wrapping for simplicity)
        return response()->json([
            'floors' => $floors->map(fn ($f) => [
                'id' => $f->id,
                'hostel_id' => $f->hostel_id,
                'name' => $f->name,
                'order' => $f->order,
            ]),
            'rooms' => $rooms->map(fn ($r) => [
                'id' => $r->id,
                'floor_id' => $r->floor_id,
                'room_number' => $r->room_number,
                'gender' => $r->gender,
                'base_price' => $r->base_price,
                'capacity' => $r->capacity,
            ]),
            'beds' => $beds->map(fn ($b) => [
                'id' => $b->id,
                'room_id' => $b->room_id,
                'label' => $b->label,
                'status' => $b->status,
            ]),
            'tenants' => $tenants->map(fn ($t) => [
                'id' => $t->id,
                'hostel_id' => $t->hostel_id,
                'name' => $t->name,
                'phone' => $t->phone,
                'parent_phone' => $t->parent_phone,
                'home_location' => $t->home_location,
                'id_type' => $t->id_type,
                'id_number' => $t->id_number,
                'photo_url' => $t->photo_url,
                'status' => $t->status,
                'created_at' => $t->created_at->toISOString(),
            ]),
            'bookings' => $bookings->map(fn ($b) => [
                'id' => $b->id,
                'tenant_id' => $b->tenant_id,
                'bed_id' => $b->bed_id,
                'start_date' => $b->start_date->toDateString(),
                'end_date' => $b->end_date?->toDateString(),
                'agreed_rent' => $b->agreed_rent,
                'advance_paid' => $b->advance_paid,
                'is_active' => $b->is_active,
            ]),
            'invoices' => $invoices->map(fn ($i) => [
                'id' => $i->id,
                'hostel_id' => $i->hostel_id,
                'tenant_id' => $i->tenant_id,
                'booking_id' => $i->booking_id,
                'period' => $i->period,
                'amount' => $i->amount,
                'fine' => $i->fine,
                'paid_amount' => $i->paid_amount,
                'due_date' => $i->due_date->toDateString(),
                'paid_at' => $i->paid_at?->toISOString(),
                'status' => $i->status,
            ]),
            'expenses' => $expenses->map(fn ($e) => [
                'id' => $e->id,
                'hostel_id' => $e->hostel_id,
                'category' => $e->category,
                'description' => $e->description,
                'amount' => $e->amount,
                'expense_date' => $e->expense_date->toDateString(),
            ]),
            'synced_at' => now()->toISOString(),
        ]);
    }
}
