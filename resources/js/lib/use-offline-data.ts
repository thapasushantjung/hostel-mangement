import { useState, useEffect } from 'react';
import { offlineStore } from './offline-store';
import { useOnlineStatus } from './use-offline';
import { db } from './db';

/**
 * Hook for offline-first data access
 * Returns local data when offline, syncs server data when online
 */
export function useOfflineData<T>(
    serverData: T,
    localFetcher: () => Promise<T>,
    dependencies: unknown[] = []
): { data: T; isFromCache: boolean; isLoading: boolean } {
    const status = useOnlineStatus();
    const [localData, setLocalData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFromCache, setIsFromCache] = useState(false);

    useEffect(() => {
        const fetchLocal = async () => {
            // If offline, always use local data
            if (status === 'offline') {
                setIsLoading(true);
                try {
                    const data = await localFetcher();
                    setLocalData(data);
                    setIsFromCache(true);
                } catch (error) {
                    console.error('[OfflineData] Failed to fetch local data:', error);
                }
                setIsLoading(false);
            } else {
                // Online - sync server data to local DB in background
                setIsFromCache(false);
                setLocalData(null);
            }
        };

        fetchLocal();
    }, [status, ...dependencies]);

    // Return local data when offline, server data when online
    return {
        data: status === 'offline' && localData !== null ? localData : serverData,
        isFromCache: status === 'offline',
        isLoading,
    };
}

/**
 * Hook for dashboard stats with offline support
 */
export function useDashboardStats(serverStats: {
    occupancy: { total: number; occupied: number; rate: number };
    revenue: { dueThisMonth: number; collectedThisMonth: number; collectionRate: number };
    leavingTenants: number;
    overdueInvoices: any[];
}) {
    return useOfflineData(
        serverStats,
        () => offlineStore.getDashboardStats(),
        []
    );
}

/**
 * Hook for tenants list with offline support
 */
export function useTenantsData(
    serverTenants: any[],
    filters: { search?: string; status?: string; location?: string }
) {
    return useOfflineData(
        serverTenants,
        () => offlineStore.getTenants(filters),
        [filters.search, filters.status, filters.location]
    );
}

/**
 * Hook for bed grid with offline support
 */
export function useBedGridData(serverFloors: any[]) {
    return useOfflineData(
        serverFloors,
        () => offlineStore.getFloorsWithRoomsAndBeds(),
        []
    );
}

/**
 * Hook for invoices with offline support
 */
export function useInvoicesData(serverInvoices: any[], tab: 'due' | 'paid' | 'draft') {
    return useOfflineData(
        serverInvoices,
        () => offlineStore.getInvoices(tab),
        [tab]
    );
}

/**
 * Hook for available beds with offline support
 */
export function useAvailableBedsData(serverBeds: any[]) {
    return useOfflineData(
        serverBeds,
        () => offlineStore.getAvailableBeds(),
        []
    );
}

/**
 * Sync server data to local on page load
 */
export async function syncPageData(pageType: string, data: Record<string, any>) {
    try {
        switch (pageType) {
            case 'dashboard':
                // Dashboard doesn't need to sync individual records, stats are computed
                break;
            case 'tenants':
                if (data.tenants?.data) {
                    await db.tenants.clear();
                    await db.tenants.bulkAdd(data.tenants.data.map((t: any) => ({ ...t, _synced: true })));
                }
                break;
            case 'bedGrid':
                if (data.floors?.data) {
                    const floors = data.floors.data;
                    await db.floors.clear();
                    await db.rooms.clear();
                    await db.beds.clear();

                    for (const floor of floors) {
                        await db.floors.add({ ...floor, rooms: undefined, _synced: true });
                        if (floor.rooms) {
                            for (const room of floor.rooms) {
                                await db.rooms.add({ ...room, floor_id: floor.id, beds: undefined, _synced: true });
                                if (room.beds) {
                                    for (const bed of room.beds) {
                                        await db.beds.add({ ...bed, room_id: room.id, current_tenant: undefined, _synced: true });
                                    }
                                }
                            }
                        }
                    }
                }
                break;
            case 'finance':
                if (data.invoices?.data) {
                    const serverInvoices = data.invoices.data as any[];
                    const serverIds = new Set(serverInvoices.map(i => i.id));
                    const activeTab = data.activeTab as 'due' | 'paid' | 'draft' | undefined;

                    // 1. Update/Add incoming invoices
                    await db.transaction('rw', [db.invoices], async () => {
                        for (const invoice of serverInvoices) {
                            const existing = await db.invoices.get(invoice.id);
                            if (!existing || existing._synced) {
                                await db.invoices.put({
                                    ...invoice,
                                    amount: Number(invoice.amount) || 0,
                                    fine: Number(invoice.fine) || 0,
                                    paid_amount: Number(invoice.paid_amount) || 0,
                                    _synced: true,
                                });
                            }
                        }

                        // 2. Remove stale invoices based on the active tab
                        // If we are looking at a specific tab, any local invoice that SHOULD be in this tab
                        // but is NOT in the server response implies it has moved status or been deleted.
                        if (activeTab) {
                            const localInvoices = await db.invoices.toArray();
                            const staleIds: number[] = [];

                            for (const localInv of localInvoices) {
                                // Skip offline-created items that haven't synced yet
                                if (!localInv._synced) continue;

                                let shouldBeInList = false;
                                if (activeTab === 'due') {
                                    shouldBeInList = ['pending', 'partial', 'overdue'].includes(localInv.status);
                                } else if (activeTab === 'paid') {
                                    shouldBeInList = localInv.status === 'paid';
                                } else if (activeTab === 'draft') {
                                    shouldBeInList = localInv.status === 'draft';
                                }

                                // If it should be in the list but isn't, and it's a synced item, delete it
                                if (shouldBeInList && !serverIds.has(localInv.id)) {
                                    staleIds.push(localInv.id);
                                }
                            }

                            if (staleIds.length > 0) {
                                await db.invoices.bulkDelete(staleIds);
                            }
                        }
                    });
                }
                if (data.expenses?.data) {
                    for (const expense of data.expenses.data) {
                        const existing = await db.expenses.get(expense.id);
                        if (!existing || existing._synced) {
                            await db.expenses.put({ ...expense, _synced: true });
                        }
                    }
                }
                break;
        }
    } catch (error) {
        console.error('[SyncPageData] Failed to sync:', error);
    }
}
