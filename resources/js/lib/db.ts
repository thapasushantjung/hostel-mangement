import Dexie, { type Table } from 'dexie';

// Local database types matching backend models
export interface LocalFloor {
    id: number;
    hostel_id: number;
    name: string;
    order: number;
    rooms?: LocalRoom[];
    _synced?: boolean;
    _pendingSync?: 'create' | 'update' | 'delete';
}

export interface LocalRoom {
    id: number;
    floor_id: number;
    room_number: string;
    gender: 'male' | 'female' | 'any';
    base_price: number;
    capacity: number;
    beds?: LocalBed[];
    _synced?: boolean;
    _pendingSync?: 'create' | 'update' | 'delete';
}

export interface LocalBed {
    id: number;
    room_id: number;
    label: string;
    status: 'available' | 'occupied' | 'maintenance' | 'reserved';
    current_tenant?: LocalTenant;
    room?: LocalRoom;
    _synced?: boolean;
    _pendingSync?: 'create' | 'update' | 'delete';
}

export interface LocalTenant {
    id: number;
    hostel_id: number;
    name: string;
    phone?: string;
    parent_phone?: string;
    home_location?: string;
    id_type?: string;
    id_number?: string;
    photo_url?: string;
    status: 'active' | 'leaving' | 'left';
    created_at: string;
    active_booking?: LocalBooking;
    _synced?: boolean;
    _pendingSync?: 'create' | 'update' | 'delete';
}

export interface LocalBooking {
    id: number;
    tenant_id: number;
    bed_id: number;
    start_date: string;
    end_date?: string;
    agreed_rent: number;
    advance_paid: number;
    is_active: boolean;
    bed?: LocalBed;
    _synced?: boolean;
    _pendingSync?: 'create' | 'update' | 'delete';
}

export interface LocalInvoice {
    id: number;
    hostel_id: number;
    tenant_id: number;
    booking_id: number;
    period: string;
    amount: number;
    fine: number;
    paid_amount: number;
    due_date: string;
    paid_at?: string;
    status: 'draft' | 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
    tenant?: LocalTenant;
    _synced?: boolean;
    _pendingSync?: 'create' | 'update' | 'delete';
}

export interface LocalExpense {
    id: number;
    hostel_id: number;
    category: string;
    description?: string;
    amount: number;
    expense_date: string;
    _synced?: boolean;
    _pendingSync?: 'create' | 'update' | 'delete';
}

export interface SyncQueue {
    id?: number;
    table: string;
    action: 'create' | 'update' | 'delete';
    data: Record<string, unknown>;
    created_at: string;
    retries: number;
}

export interface AppMeta {
    key: string;
    value: string;
}

// Dexie database class
class HostelMateDB extends Dexie {
    floors!: Table<LocalFloor, number>;
    rooms!: Table<LocalRoom, number>;
    beds!: Table<LocalBed, number>;
    tenants!: Table<LocalTenant, number>;
    bookings!: Table<LocalBooking, number>;
    invoices!: Table<LocalInvoice, number>;
    expenses!: Table<LocalExpense, number>;
    syncQueue!: Table<SyncQueue, number>;
    appMeta!: Table<AppMeta, string>;

    constructor() {
        super('hostelmate');

        this.version(1).stores({
            floors: 'id, hostel_id, order, _pendingSync',
            rooms: 'id, floor_id, room_number, _pendingSync',
            beds: 'id, room_id, status, _pendingSync',
            tenants: 'id, hostel_id, name, status, home_location, _pendingSync',
            bookings: 'id, tenant_id, bed_id, is_active, _pendingSync',
            invoices: 'id, hostel_id, tenant_id, period, status, due_date, _pendingSync',
            expenses: 'id, hostel_id, category, expense_date, _pendingSync',
            syncQueue: '++id, table, action, created_at',
            appMeta: 'key',
        });
    }
}

export const db = new HostelMateDB();

// Helper to generate temporary negative IDs for offline-created records
let tempIdCounter = -1;
export function generateTempId(): number {
    return tempIdCounter--;
}

// Check if ID is temporary (negative)
export function isTempId(id: number): boolean {
    return id < 0;
}
