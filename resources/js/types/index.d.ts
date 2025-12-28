import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    hostel_id: number | null;
    role: 'owner' | 'warden';
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
}

// ==================== Hostel Domain Models ====================

export interface Hostel {
    id: number;
    name: string;
    address: string | null;
    phone: string | null;
    pricing_config: PricingConfig | null;
    created_at: string;
    updated_at: string;
}

export interface PricingConfig {
    single: number;
    double: number;
    triple: number;
    quad: number;
}

export interface Floor {
    id: number;
    name: string;
    order: number;
    rooms?: Room[];
    created_at: string;
    updated_at: string;
}

export interface Room {
    id: number;
    floor_id: number;
    room_number: string;
    gender: 'male' | 'female' | 'any';
    base_price: number;
    capacity: number;
    beds?: Bed[];
    floor?: Floor;
    created_at: string;
    updated_at: string;
}

export type BedStatus = 'available' | 'occupied' | 'maintenance';

export interface Bed {
    id: number;
    room_id: number;
    label: string;
    status: BedStatus;
    room?: Room;
    current_booking?: Booking;
    current_tenant?: Tenant;
    created_at: string;
    updated_at: string;
}

export type TenantStatus = 'active' | 'leaving' | 'left';

export interface Tenant {
    id: number;
    name: string;
    phone: string | null;
    parent_phone: string | null;
    photo_url: string | null;
    home_location: string | null;
    id_type: string | null;
    id_number: string | null;
    status: TenantStatus;
    total_due?: number;
    active_booking?: Booking;
    current_bed?: Bed;
    invoices?: Invoice[];
    bookings?: Booking[];
    created_at: string;
    updated_at: string;
}

export interface Booking {
    id: number;
    tenant_id: number;
    bed_id: number;
    start_date: string;
    end_date: string | null;
    agreed_rent: number;
    advance_paid: number;
    is_active: boolean;
    days_stayed?: number;
    tenant?: Tenant;
    bed?: Bed;
    created_at: string;
    updated_at: string;
}

export type InvoiceStatus = 'draft' | 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export type PaymentMode = 'cash' | 'esewa' | 'khalti' | 'bank' | 'other';

export interface Payment {
    id: number;
    invoice_id: number;
    tenant_id: number;
    amount: number;
    mode: PaymentMode;
    mode_label: string;
    reference_no: string | null;
    remarks: string | null;
    payment_date: string;
    created_by?: {
        id: number;
        name: string;
    };
    created_at: string;
}

export interface Invoice {
    id: number;
    tenant_id: number;
    booking_id: number | null;
    period: string;
    amount: number;
    fine: number;
    total_due: number;
    paid_amount: number;
    balance: number;
    status: InvoiceStatus;
    due_date: string;
    paid_at: string | null;
    is_overdue: boolean;
    cancelled_reason?: string;
    tenant?: Tenant;
    payments?: Payment[];
    created_at: string;
    updated_at: string;
}

export interface Expense {
    id: number;
    category: string;
    description: string | null;
    vendor?: string | null;
    amount: number;
    expense_date: string;
    created_at: string;
    updated_at: string;
}


