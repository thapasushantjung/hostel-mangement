import { db, type SyncQueue } from './db';
import { offlineStore } from './offline-store';

/**
 * Sync service for background synchronization
 */
export const syncService = {
    isSyncing: false,

    /**
     * Fetch all data from server and populate local database
     */
    async fullSync(): Promise<boolean> {
        if (this.isSyncing) return false;
        this.isSyncing = true;

        try {
            const response = await fetch('/api/sync/full', {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error('Sync failed');
            }

            const data = await response.json();
            await offlineStore.syncFromServer(data);

            console.log('[Sync] Full sync completed');
            return true;
        } catch (error) {
            console.error('[Sync] Full sync failed:', error);
            return false;
        } finally {
            this.isSyncing = false;
        }
    },

    /**
     * Push pending local changes to server
     */
    async pushChanges(): Promise<number> {
        const pendingItems = await db.syncQueue.orderBy('created_at').toArray();
        let synced = 0;

        for (const item of pendingItems) {
            try {
                const success = await this.syncItem(item);
                if (success) {
                    await db.syncQueue.delete(item.id!);
                    synced++;
                } else {
                    // Increment retry count
                    await db.syncQueue.update(item.id!, { retries: item.retries + 1 });
                }
            } catch (error) {
                console.error('[Sync] Failed to sync item:', item, error);
                await db.syncQueue.update(item.id!, { retries: item.retries + 1 });
            }
        }

        return synced;
    },

    async syncItem(item: SyncQueue): Promise<boolean> {
        const endpoint = this.getEndpoint(item.table, item.action, item.data);
        const method = this.getMethod(item.action);

        try {
            const response = await fetch(endpoint, {
                method,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': this.getCsrfToken(),
                },
                body: method !== 'DELETE' ? JSON.stringify(item.data) : undefined,
            });

            if (!response.ok) {
                return false;
            }

            // If creating, update the local record with the real ID
            if (item.action === 'create') {
                const result = await response.json();
                if (result.id && item.data.tempId) {
                    await this.updateTempId(item.table, item.data.tempId as number, result.id);
                }
            }

            return true;
        } catch {
            return false;
        }
    },

    getEndpoint(table: string, action: string, data: Record<string, unknown>): string {
        const baseUrl = '/api/sync';

        switch (table) {
            case 'tenants':
                return action === 'create' ? '/tenants' : `/tenants/${data.id}`;
            case 'invoices':
                if (data.action === 'markPaid') {
                    return `/finance/invoices/${data.id}/mark-paid`;
                }
                return `/invoices/${data.id}`;
            case 'expenses':
                return action === 'create' ? '/finance/expenses' : `/expenses/${data.id}`;
            case 'bookings':
                return action === 'create' ? '/bookings' : `/bookings/${data.id}`;
            default:
                return `${baseUrl}/${table}`;
        }
    },

    getMethod(action: string): string {
        switch (action) {
            case 'create': return 'POST';
            case 'update': return 'PATCH';
            case 'delete': return 'DELETE';
            default: return 'POST';
        }
    },

    getCsrfToken(): string {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta?.getAttribute('content') || '';
    },

    async updateTempId(table: string, tempId: number, realId: number): Promise<void> {
        const tableRef = db[table as keyof typeof db] as any;
        if (tableRef) {
            const record = await tableRef.get(tempId);
            if (record) {
                await tableRef.delete(tempId);
                await tableRef.add({ ...record, id: realId, _synced: true, _pendingSync: undefined });
            }
        }
    },

    /**
     * Start background sync when online
     */
    startBackgroundSync(): void {
        // Listen for online event
        window.addEventListener('online', async () => {
            console.log('[Sync] Back online, pushing changes...');
            await this.pushChanges();
            await this.fullSync();
        });

        // Periodic sync every 5 minutes when online
        setInterval(async () => {
            if (navigator.onLine) {
                const pending = await db.syncQueue.count();
                if (pending > 0) {
                    await this.pushChanges();
                }
            }
        }, 5 * 60 * 1000);
    },
};
