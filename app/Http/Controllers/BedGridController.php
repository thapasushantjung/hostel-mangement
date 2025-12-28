<?php

namespace App\Http\Controllers;

use App\Http\Resources\FloorResource;
use App\Models\Bed;
use App\Models\Booking;
use App\Models\Floor;
use App\Models\Invoice;
use App\Models\InvoiceLineItem;
use App\Models\Tenant;
use App\Services\NepaliDate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BedGridController extends Controller
{
    /**
     * Display the bed grid view with floors, rooms, and beds.
     */
    public function index(): Response
    {
        $floors = Floor::with([
            'rooms' => fn ($query) => $query->orderBy('room_number'),
            'rooms.beds' => fn ($query) => $query->orderBy('label'),
            'rooms.beds.activeBooking.tenant',
        ])
            ->orderBy('order')
            ->get();

        // Get ALL tenants for assignment (including active, leaving, left)
        // Active tenants can be transferred to a new bed
        // Left tenants can rejoin
        $allTenants = Tenant::with('activeBooking.bed.room')
            ->orderBy('name')
            ->get()
            ->map(fn ($tenant) => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'phone' => $tenant->phone,
                'home_location' => $tenant->home_location,
                'status' => $tenant->status,
                'current_bed' => $tenant->activeBooking
                    ? 'Room '.$tenant->activeBooking->bed->room->room_number.'-'.$tenant->activeBooking->bed->label
                    : null,
            ]);

        return Inertia::render('BedGrid/Index', [
            'floors' => FloorResource::collection($floors),
            'allTenants' => $allTenants,
        ]);
    }

    /**
     * Assign a tenant to a bed (new or existing tenant, handles transfers).
     */
    public function assignTenant(Request $request, Bed $bed): RedirectResponse
    {
        $validated = $request->validate([
            'tenant_id' => ['nullable', 'exists:tenants,id'],
            'name' => ['required_without:tenant_id', 'nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'parent_phone' => ['nullable', 'string', 'max:20'],
            'home_location' => ['nullable', 'string', 'max:255'],
            'id_type' => ['nullable', 'string', 'max:50'],
            'id_number' => ['nullable', 'string', 'max:100'],
            'agreed_rent' => ['required', 'numeric', 'min:0'],
            'advance_paid' => ['nullable', 'numeric', 'min:0'],
        ]);

        return DB::transaction(function () use ($validated, $bed) {
            // Refresh the bed to ensure we have the latest data
            $bed = $bed->fresh();

            // Get or create tenant
            if (! empty($validated['tenant_id'])) {
                $tenant = Tenant::findOrFail($validated['tenant_id']);

                // Handle bed transfer: if tenant has an active booking, end it
                if ($tenant->activeBooking) {
                    $oldBed = $tenant->activeBooking->bed;

                    // End the current booking
                    $tenant->activeBooking->update([
                        'end_date' => now(),
                        'is_active' => false,
                    ]);

                    // Free up the old bed
                    $oldBed->update(['status' => 'available']);
                }

                // Reactivate tenant if they were "left"
                $tenant->update(['status' => 'active']);
            } else {
                // Create new tenant
                $tenant = Tenant::create([
                    'name' => $validated['name'],
                    'phone' => $validated['phone'] ?? null,
                    'parent_phone' => $validated['parent_phone'] ?? null,
                    'home_location' => $validated['home_location'] ?? null,
                    'id_type' => $validated['id_type'] ?? null,
                    'id_number' => $validated['id_number'] ?? null,
                    'status' => 'active',
                ]);
            }

            // Create new booking
            $booking = Booking::create([
                'tenant_id' => $tenant->id,
                'bed_id' => $bed->id,
                'start_date' => now(),
                'agreed_rent' => $validated['agreed_rent'],
                'advance_paid' => $validated['advance_paid'] ?? 0,
                'is_active' => true,
            ]);

            // Update bed status to occupied
            $bed->status = 'occupied';
            $bed->save();

            // Generate first month's invoice with pro-rata rent
            $this->generateFirstMonthInvoice($tenant, $booking, $bed);

            return redirect()->back()->with('success', 'Tenant assigned successfully');
        });
    }

    /**
     * Generate the first month's invoice for a new booking.
     * Pro-rata rent based on days remaining in the month.
     */
    private function generateFirstMonthInvoice(Tenant $tenant, Booking $booking, Bed $bed): void
    {
        $startDate = now();
        $bsDate = NepaliDate::now();

        $period = $bsDate->format('Y-m');
        $monthName = $bsDate->format('F Y');

        $daysInMonth = $bsDate->daysInMonth();
        $daysRemaining = $daysInMonth - $bsDate->day + 1; // Include today

        // Pro-rata calculation
        $proRataRent = round(($booking->agreed_rent / $daysInMonth) * $daysRemaining, 2);

        // Get hostel_id from the bed's room's floor
        $hostelId = $bed->room->floor->hostel_id;

        // Create invoice
        $invoice = Invoice::create([
            'hostel_id' => $hostelId,
            'tenant_id' => $tenant->id,
            'booking_id' => $booking->id,
            'period' => $period,
            'amount' => $proRataRent,
            'fine' => 0,
            'paid_amount' => $booking->advance_paid, // Apply advance as payment
            'status' => $booking->advance_paid >= $proRataRent ? Invoice::STATUS_PAID : Invoice::STATUS_PENDING,
            'due_date' => $startDate->copy()->addDays(10), // Due in 10 AD days
        ]);

        // Add rent line item
        InvoiceLineItem::create([
            'invoice_id' => $invoice->id,
            'category' => InvoiceLineItem::CATEGORY_RENT,
            'description' => "Rent for {$monthName} ({$daysRemaining} days pro-rata)",
            'amount' => $proRataRent,
            'quantity' => 1,
        ]);

        // Mark as paid if advance covers the amount
        if ($booking->advance_paid >= $proRataRent) {
            $invoice->update(['paid_at' => now()]);
        }
    }
}
