import { type Room } from '@/types';
import { BedBadge } from './bed-badge';
import { IconMars, IconVenus, IconGenderBigender } from '@tabler/icons-react';
import { type TenantOption } from '@/pages/BedGrid/Index';

interface RoomCardProps {
    room: Room;
    allTenants: TenantOption[];
}

export function RoomCard({ room, allTenants }: RoomCardProps) {
    const beds = room.beds || [];

    const genderIcon = {
        male: <IconMars className="h-4 w-4 text-blue-500" />,
        female: <IconVenus className="h-4 w-4 text-pink-500" />,
        any: <IconGenderBigender className="h-4 w-4 text-purple-500" />,
    };

    return (
        <div className="rounded-lg border bg-background p-4 shadow-sm transition-shadow hover:shadow-md">
            {/* Room Header */}
            <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Room {room.room_number}</h3>
                    {genderIcon[room.gender]}
                </div>
                <span className="text-sm text-muted-foreground">
                    रू{room.base_price.toLocaleString()}
                </span>
            </div>

            {/* Beds Grid */}
            <div className="grid grid-cols-2 gap-2">
                {beds.map((bed) => (
                    <BedBadge
                        key={bed.id}
                        bed={bed}
                        roomNumber={room.room_number}
                        basePrice={room.base_price}
                        allTenants={allTenants}
                    />
                ))}

                {beds.length === 0 && (
                    <div className="col-span-2 text-center text-sm text-muted-foreground py-2">
                        No beds
                    </div>
                )}
            </div>
        </div>
    );
}

