import { db, generateTempId, type LocalTenant, type LocalBooking, type LocalBed, type SyncQueue } from './db';
import { toBS } from './nepali-date';

/**
 * Offline store for managing local data operations
 */
export const offlineStore = {
    // ============ INITIALIZATION ============

    /**
     * Initialize local database with server data
     */
    async syncFromServer(data: {
        floors?: any[];
        rooms?: any[];
        beds?: any[];
        tenants?: any[];
        bookings?: any[];
        invoices?: any[];
        expenses?: any[];
    }) {
        // Clear and repopulate tables
        await db.transaction('rw', [db.floors, db.rooms, db.beds, db.tenants, db.bookings, db.invoices, db.expenses], async () => {
            if (data.floors) {
                await db.floors.clear();
                await db.floors.bulkAdd(data.floors.map(f => ({ ...f, _synced: true })));
            }
            if (data.rooms) {
                await db.rooms.clear();
                await db.rooms.bulkAdd(data.rooms.map(r => ({ ...r, _synced: true })));
            }
            if (data.beds) {
                await db.beds.clear();
                await db.beds.bulkAdd(data.beds.map(b => ({ ...b, _synced: true })));
            }
            if (data.tenants) {
                await db.tenants.clear();
                await db.tenants.bulkAdd(data.tenants.map(t => ({ ...t, _synced: true })));
            }
            if (data.bookings) {
                await db.bookings.clear();
                await db.bookings.bulkAdd(data.bookings.map(b => ({ ...b, _synced: true })));
            }
            if (data.invoices) {
                await db.invoices.clear();
                await db.invoices.bulkAdd(data.invoices.map(i => ({ ...i, _synced: true })));
            }
            if (data.expenses) {
                await db.expenses.clear();
                await db.expenses.bulkAdd(data.expenses.map(e => ({ ...e, _synced: true })));
            }
        });

        // Mark last sync time
        await db.appMeta.put({ key: 'lastSync', value: new Date().toISOString() });
    },

    // ============ TENANTS ============

    async getTenants(filters?: { search?: string; status?: string; location?: string }) {
        let query = db.tenants.toCollection();

        const tenants = await query.toArray();

        // Apply filters in memory
        let filtered = tenants;

        if (filters?.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(t =>
                t.name.toLowerCase().includes(search) ||
                t.phone?.toLowerCase().includes(search) ||
                t.home_location?.toLowerCase().includes(search)
            );
        }

        if (filters?.status) {
            filtered = filtered.filter(t => t.status === filters.status);
        }

        if (filters?.location) {
            filtered = filtered.filter(t => t.home_location === filters.location);
        }

        // Load active bookings
        for (const tenant of filtered) {
            tenant.active_booking = await db.bookings
                .where({ tenant_id: tenant.id, is_active: true })
                .first();
        }

        return filtered.sort((a, b) => a.name.localeCompare(b.name));
    },

    async getTenant(id: number) {
        const tenant = await db.tenants.get(id);
        if (tenant) {
            tenant.active_booking = await db.bookings
                .where({ tenant_id: id, is_active: true })
                .first();
            if (tenant.active_booking) {
                tenant.active_booking.bed = await db.beds.get(tenant.active_booking.bed_id);
            }
        }
        return tenant;
    },

    async createTenant(data: Omit<LocalTenant, 'id' | '_synced' | '_pendingSync'>, bedId?: number, rent?: number, advance?: number) {
        const tempId = generateTempId();

        await db.transaction('rw', [db.tenants, db.bookings, db.beds, db.syncQueue], async () => {
            // Create tenant locally
            const tenant: LocalTenant = {
                ...data,
                id: tempId,
                _synced: false,
                _pendingSync: 'create',
            };
            await db.tenants.add(tenant);

            // Add to sync queue
            await db.syncQueue.add({
                table: 'tenants',
                action: 'create',
                data: { ...data, tempId },
                created_at: new Date().toISOString(),
                retries: 0,
            });

            // Create booking if bed specified
            if (bedId && rent) {
                const bookingTempId = generateTempId();
                const booking: LocalBooking = {
                    id: bookingTempId,
                    tenant_id: tempId,
                    bed_id: bedId,
                    start_date: new Date().toISOString().split('T')[0],
                    agreed_rent: rent,
                    advance_paid: advance || 0,
                    is_active: true,
                    _synced: false,
                    _pendingSync: 'create',
                };
                await db.bookings.add(booking);

                // Update bed status
                await db.beds.update(bedId, { status: 'occupied' });

                // Add booking to sync queue
                await db.syncQueue.add({
                    table: 'bookings',
                    action: 'create',
                    data: { ...booking, tempTenantId: tempId },
                    created_at: new Date().toISOString(),
                    retries: 0,
                });
            }
        });

        return tempId;
    },

    // ============ INVOICES ============

    async getInvoices(status?: 'due' | 'paid' | 'draft') {
        let invoices = await db.invoices.toArray();

        if (status === 'due') {
            invoices = invoices.filter(i => i.status === 'pending' || i.status === 'partial' || i.status === 'overdue');
        } else if (status === 'paid') {
            invoices = invoices.filter(i => i.status === 'paid');
        } else if (status === 'draft') {
            invoices = invoices.filter(i => i.status === 'draft');
        }

        // Load tenants
        for (const invoice of invoices) {
            const tenant = await db.tenants.get(invoice.tenant_id);
            if (tenant) {
                invoice.tenant = tenant;
            }
        }

        return invoices.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    },

    async markInvoicePaid(id: number) {
        await db.transaction('rw', [db.invoices, db.syncQueue], async () => {
            const invoice = await db.invoices.get(id);
            if (invoice) {
                await db.invoices.update(id, {
                    status: 'paid',
                    paid_amount: (Number(invoice.amount) || 0) + (Number(invoice.fine) || 0),
                    paid_at: new Date().toISOString(),
                    _synced: false,
                    _pendingSync: 'update',
                });

                await db.syncQueue.add({
                    table: 'invoices',
                    action: 'update',
                    data: { id, action: 'markPaid' },
                    created_at: new Date().toISOString(),
                    retries: 0,
                });
            }
        });
    },

    // ============ EXPENSES ============

    async createExpense(data: { category: string; amount: number; expense_date: string; description?: string; hostel_id: number }) {
        const tempId = generateTempId();

        await db.transaction('rw', [db.expenses, db.syncQueue], async () => {
            await db.expenses.add({
                ...data,
                id: tempId,
                _synced: false,
                _pendingSync: 'create',
            });

            await db.syncQueue.add({
                table: 'expenses',
                action: 'create',
                data: { ...data, tempId },
                created_at: new Date().toISOString(),
                retries: 0,
            });
        });

        return tempId;
    },

    // ============ BED GRID ============

    async getFloorsWithRoomsAndBeds() {
        const floors = await db.floors.orderBy('order').toArray();

        for (const floor of floors) {
            floor.rooms = await db.rooms.where({ floor_id: floor.id }).toArray();

            for (const room of floor.rooms) {
                room.beds = await db.beds.where({ room_id: room.id }).toArray();

                for (const bed of room.beds) {
                    if (bed.status === 'occupied') {
                        const booking = await db.bookings
                            .where({ bed_id: bed.id, is_active: true })
                            .first();
                        if (booking) {
                            bed.current_tenant = await db.tenants.get(booking.tenant_id);
                        }
                    }
                }
            }
        }

        return floors;
    },

    async getAvailableBeds() {
        const beds = await db.beds.where({ status: 'available' }).toArray();

        for (const bed of beds) {
            bed.room = await db.rooms.get(bed.room_id);
        }

        return beds.map(bed => ({
            id: bed.id,
            label: `Room ${bed.room?.room_number}-${bed.label}`,
            price: bed.room?.base_price || 0,
        }));
    },

    // ============ DASHBOARD STATS ============

    async getDashboardStats() {
        const beds = await db.beds.toArray();
        const totalBeds = beds.length;
        const occupiedBeds = beds.filter(b => b.status === 'occupied').length;
        const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

        const currentMonth = toBS(new Date()).slice(0, 7);
        const invoices = await db.invoices.where({ period: currentMonth }).toArray();

        // Ensure numeric values (IndexedDB may store as strings)
        const dueThisMonth = invoices.reduce((sum, i) => {
            return sum + (Number(i.amount) || 0) + (Number(i.fine) || 0);
        }, 0);
        const collectedThisMonth = invoices.reduce((sum, i) => {
            return sum + (Number(i.paid_amount) || 0);
        }, 0);
        const collectionRate = dueThisMonth > 0 ? Math.round((collectedThisMonth / dueThisMonth) * 100) : 0;

        const leavingTenants = await db.tenants.where({ status: 'leaving' }).count();

        const overdueInvoices = await db.invoices
            .filter(i => i.status === 'overdue' || (i.status === 'pending' && new Date(i.due_date) < new Date()))
            .limit(10)
            .toArray();

        for (const invoice of overdueInvoices) {
            const tenant = await db.tenants.get(invoice.tenant_id);
            if (tenant) {
                invoice.tenant = tenant;
            }
        }

        return {
            occupancy: { total: totalBeds, occupied: occupiedBeds, rate: occupancyRate },
            revenue: { dueThisMonth, collectedThisMonth, collectionRate },
            leavingTenants,
            overdueInvoices,
        };
    },

    // ============ SYNC ============

    async getPendingSyncItems() {
        return db.syncQueue.orderBy('created_at').toArray();
    },

    async removeSyncItem(id: number) {
        await db.syncQueue.delete(id);
    },

    async getLastSyncTime() {
        const meta = await db.appMeta.get('lastSync');
        return meta?.value;
    },
};
