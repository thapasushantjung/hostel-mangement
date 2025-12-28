import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Floor } from '@/types';
import { Head } from '@inertiajs/react';
import { FloorSection } from '@/components/bed-grid/floor-section';
import { Badge } from '@/components/ui/badge';
import { IconCloudOff } from '@tabler/icons-react';
import { useBedGridData, syncPageData } from '@/lib/use-offline-data';
import { useEffect } from 'react';

export interface TenantOption {
    id: number;
    name: string;
    phone: string | null;
    home_location: string | null;
    status: 'active' | 'leaving' | 'left';
    current_bed: string | null;
}

interface BedGridProps {
    floors: { data: Floor[] } | Floor[];
    allTenants?: TenantOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Bed Grid',
        href: '/bed-grid',
    },
];

export default function BedGridIndex({ floors: floorsData, allTenants = [] }: BedGridProps) {
    // Handle both wrapped resource collection and plain array
    const serverFloors: Floor[] = Array.isArray(floorsData)
        ? floorsData
        : (floorsData?.data ?? []);

    // Use offline-first data hook
    const { data: offlineFloors, isFromCache } = useBedGridData(serverFloors);
    const floors = isFromCache ? offlineFloors : serverFloors;

    // Sync to local DB when online
    useEffect(() => {
        syncPageData('bedGrid', { floors: floorsData });
    }, [floorsData]);

    const totalBeds = floors.reduce(
        (acc, floor) =>
            acc + (floor.rooms?.reduce((roomAcc: number, room: any) => roomAcc + (room.beds?.length || 0), 0) || 0),
        0
    );

    const occupiedBeds = floors.reduce(
        (acc, floor) =>
            acc +
            (floor.rooms?.reduce(
                (roomAcc: number, room: any) =>
                    roomAcc + (room.beds?.filter((bed: any) => bed.status === 'occupied').length || 0),
                0
            ) || 0),
        0
    );

    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bed Grid" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header with Stats */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Bed Grid</h1>
                        <p className="text-muted-foreground">
                            Visual overview of all rooms and beds
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {isFromCache && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <IconCloudOff className="h-3 w-3" />
                                Offline
                            </Badge>
                        )}
                        <div className="rounded-lg border bg-card p-3 text-center">
                            <div className="text-2xl font-bold">{occupancyRate}%</div>
                            <div className="text-xs text-muted-foreground">Occupancy</div>
                        </div>
                        <div className="rounded-lg border bg-card p-3 text-center">
                            <div className="text-2xl font-bold">
                                {occupiedBeds}/{totalBeds}
                            </div>
                            <div className="text-xs text-muted-foreground">Beds Filled</div>
                        </div>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-green-500"></div>
                        <span>Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-red-500"></div>
                        <span>Occupied</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-yellow-500"></div>
                        <span>Leaving Soon</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded bg-gray-400"></div>
                        <span>Maintenance</span>
                    </div>
                </div>

                {/* Floor Sections */}
                <div className="flex flex-col gap-6">
                    {floors.map((floor) => (
                        <FloorSection key={floor.id} floor={floor} allTenants={allTenants} />
                    ))}

                    {floors.length === 0 && (
                        <div className="rounded-lg border border-dashed p-12 text-center">
                            <h3 className="text-lg font-medium">No floors yet</h3>
                            <p className="mt-1 text-muted-foreground">
                                Go to Settings to add floors and rooms.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

