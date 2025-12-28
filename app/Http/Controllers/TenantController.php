<?php

namespace App\Http\Controllers;

use App\Http\Resources\TenantResource;
use App\Models\Bed;
use App\Models\Booking;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TenantController extends Controller
{
    /**
     * Display a listing of tenants.
     */
    public function index(Request $request): Response
    {
        $query = Tenant::with(['activeBooking.bed.room'])
            ->orderBy('name');

        // Apply search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('home_location', 'like', "%{$search}%");
            });
        }

        // Apply status filter
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Apply location filter
        if ($location = $request->input('location')) {
            $query->where('home_location', $location);
        }

        $tenants = $query->get();

        // Get unique locations for filter
        $locations = Tenant::query()
            ->whereNotNull('home_location')
            ->distinct()
            ->pluck('home_location')
            ->sort()
            ->values();

        // Get available beds for the add tenant form
        $availableBeds = Bed::with('room')
            ->where('status', 'available')
            ->get()
            ->map(fn ($bed) => [
                'id' => $bed->id,
                'label' => 'Room '.$bed->room->room_number.'-'.$bed->label,
                'price' => $bed->room->base_price,
            ]);

        return Inertia::render('Tenants/Index', [
            'tenants' => TenantResource::collection($tenants),
            'locations' => $locations,
            'filters' => $request->only(['search', 'status', 'location']),
            'availableBeds' => $availableBeds,
        ]);
    }

    /**
     * Store a newly created tenant.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'parent_phone' => ['nullable', 'string', 'max:20'],
            'home_location' => ['nullable', 'string', 'max:255'],
            'id_type' => ['nullable', 'string', 'max:50'],
            'id_number' => ['nullable', 'string', 'max:100'],
            'bed_id' => ['nullable', 'exists:beds,id'],
            'agreed_rent' => ['required_with:bed_id', 'nullable', 'numeric', 'min:0'],
            'advance_paid' => ['nullable', 'numeric', 'min:0'],
        ]);

        return DB::transaction(function () use ($validated) {
            // Create tenant
            $tenant = Tenant::create([
                'name' => $validated['name'],
                'phone' => $validated['phone'] ?? null,
                'parent_phone' => $validated['parent_phone'] ?? null,
                'home_location' => $validated['home_location'] ?? null,
                'id_type' => $validated['id_type'] ?? null,
                'id_number' => $validated['id_number'] ?? null,
                'status' => 'active',
            ]);

            // If bed is assigned, create booking
            if (! empty($validated['bed_id'])) {
                $bed = Bed::findOrFail($validated['bed_id']);

                Booking::create([
                    'tenant_id' => $tenant->id,
                    'bed_id' => $bed->id,
                    'start_date' => now(),
                    'agreed_rent' => $validated['agreed_rent'],
                    'advance_paid' => $validated['advance_paid'] ?? 0,
                    'is_active' => true,
                ]);

                $bed->update(['status' => 'occupied']);
            }

            return redirect()->route('tenants.index')
                ->with('success', 'Tenant added successfully');
        });
    }

    /**
     * Display the specified tenant.
     */
    public function show(Tenant $tenant): Response
    {
        $tenant->load([
            'activeBooking.bed.room.floor',
            'bookings.bed.room',
            'invoices' => fn ($q) => $q->orderByDesc('period'),
        ]);

        return Inertia::render('Tenants/Show', [
            'tenant' => new TenantResource($tenant),
        ]);
    }

    /**
     * Update the specified tenant.
     */
    public function update(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'parent_phone' => ['nullable', 'string', 'max:20'],
            'home_location' => ['nullable', 'string', 'max:255'],
            'id_type' => ['nullable', 'string', 'max:50'],
            'id_number' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,leaving,left'],
        ]);

        $tenant->update($validated);

        return redirect()->back()->with('success', 'Tenant updated successfully');
    }

    /**
     * Check out a tenant (end their active booking).
     */
    public function checkout(Tenant $tenant): RedirectResponse
    {
        return DB::transaction(function () use ($tenant) {
            $activeBooking = $tenant->activeBooking;

            if ($activeBooking) {
                // End the booking
                $activeBooking->update([
                    'end_date' => now(),
                    'is_active' => false,
                ]);

                // Free up the bed
                $activeBooking->bed->update(['status' => 'available']);
            }

            // Update tenant status
            $tenant->update(['status' => 'left']);

            return redirect()->route('tenants.index')
                ->with('success', 'Tenant checked out successfully');
        });
    }
}
