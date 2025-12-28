<?php

namespace App\Http\Controllers;

use App\Http\Resources\FloorResource;
use App\Models\Bed;
use App\Models\Floor;
use App\Models\Room;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    /**
     * Display the settings page.
     */
    public function index(): Response
    {
        $floors = Floor::with([
            'rooms' => fn ($q) => $q->orderBy('room_number'),
            'rooms.beds' => fn ($q) => $q->orderBy('label'),
        ])
            ->orderBy('order')
            ->get();

        $staff = User::where('hostel_id', auth()->user()->hostel_id)
            ->where('id', '!=', auth()->id())
            ->get();

        $hostel = auth()->user()->hostel;

        return Inertia::render('settings/hostel', [
            'floors' => FloorResource::collection($floors),
            'staff' => $staff,
            'hostel' => $hostel,
        ]);
    }

    /**
     * Store a new floor.
     */
    public function storeFloor(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'order' => ['required', 'integer', 'min:0'],
        ]);

        Floor::create($validated);

        return back()->with('success', 'Floor created successfully');
    }

    /**
     * Store a new room.
     */
    public function storeRoom(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'floor_id' => ['required', 'exists:floors,id'],
            'room_number' => ['required', 'string', 'max:20'],
            'gender' => ['required', Rule::in(['male', 'female', 'any'])],
            'base_price' => ['required', 'numeric', 'min:0'],
            'capacity' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        $room = Room::create($validated);

        // Auto-create beds based on capacity
        $labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
        for ($i = 0; $i < $validated['capacity']; $i++) {
            Bed::create([
                'room_id' => $room->id,
                'label' => $labels[$i],
                'status' => 'available',
            ]);
        }

        return back()->with('success', 'Room created with '.$validated['capacity'].' beds');
    }

    /**
     * Delete a floor and all its rooms/beds.
     */
    public function destroyFloor(Floor $floor): RedirectResponse
    {
        // Check if any beds are occupied
        $occupiedBeds = Bed::whereHas('room', fn ($q) => $q->where('floor_id', $floor->id))
            ->where('status', 'occupied')
            ->count();

        if ($occupiedBeds > 0) {
            return back()->withErrors(['floor' => 'Cannot delete floor with occupied beds']);
        }

        $floor->delete();

        return back()->with('success', 'Floor deleted');
    }

    /**
     * Delete a room and its beds.
     */
    public function destroyRoom(Room $room): RedirectResponse
    {
        $occupiedBeds = $room->beds()->where('status', 'occupied')->count();

        if ($occupiedBeds > 0) {
            return back()->withErrors(['room' => 'Cannot delete room with occupied beds']);
        }

        $room->delete();

        return back()->with('success', 'Room deleted');
    }

    /**
     * Add a staff member (warden).
     */
    public function storeStaff(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'min:8'],
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'warden',
            'hostel_id' => auth()->user()->hostel_id,
        ]);

        return back()->with('success', 'Staff member added');
    }

    /**
     * Remove a staff member.
     */
    public function destroyStaff(User $user): RedirectResponse
    {
        if ($user->hostel_id !== auth()->user()->hostel_id) {
            abort(403);
        }

        if ($user->role === 'owner') {
            return back()->withErrors(['staff' => 'Cannot remove the owner']);
        }

        $user->delete();

        return back()->with('success', 'Staff member removed');
    }
}
