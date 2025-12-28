import { type Floor } from '@/types';
import { RoomCard } from './room-card';
import { type TenantOption } from '@/pages/BedGrid/Index';

interface FloorSectionProps {
    floor: Floor;
    allTenants: TenantOption[];
}

export function FloorSection({ floor, allTenants }: FloorSectionProps) {
    const rooms = floor.rooms || [];

    return (
        <div className="rounded-lg border bg-card">
            {/* Floor Header */}
            <div className="border-b bg-muted/50 px-4 py-3">
                <h2 className="font-semibold">{floor.name}</h2>
                <p className="text-sm text-muted-foreground">
                    {rooms.length} room{rooms.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Rooms Grid */}
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {rooms.map((room) => (
                    <RoomCard key={room.id} room={room} allTenants={allTenants} />
                ))}

                {rooms.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground py-8">
                        No rooms on this floor
                    </div>
                )}
            </div>
        </div>
    );
}

