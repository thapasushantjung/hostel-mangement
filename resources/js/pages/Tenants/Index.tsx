import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Tenant } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import {
    IconSearch,
    IconPhone,
    IconMapPin,
    IconUser,
    IconX,
    IconPlus,
} from '@tabler/icons-react';
import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';

interface AvailableBed {
    id: number;
    label: string;
    price: number;
}

interface TenantListProps {
    tenants: { data: Tenant[] } | Tenant[];
    locations: string[];
    filters: {
        search?: string;
        status?: string;
        location?: string;
    };
    availableBeds: AvailableBed[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tenants',
        href: '/tenants',
    },
];

export default function TenantIndex({ tenants: tenantsData, locations, filters, availableBeds }: TenantListProps) {
    const tenants = Array.isArray(tenantsData) ? tenantsData : (tenantsData?.data ?? []);
    const [searchValue, setSearchValue] = useState(filters.search ?? '');
    const [showAddDialog, setShowAddDialog] = useState(false);

    const form = useForm({
        name: '',
        phone: '',
        parent_phone: '',
        home_location: '',
        id_type: '',
        id_number: '',
        bed_id: '',
        agreed_rent: '',
        advance_paid: '0',
    });

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((value: string) => {
            router.get('/tenants', { ...filters, search: value || undefined }, { preserveState: true, replace: true });
        }, 300),
        [filters]
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchValue(value);
        debouncedSearch(value);
    };

    const handleStatusChange = (value: string) => {
        router.get('/tenants', { ...filters, status: value === 'all' ? undefined : value }, { preserveState: true, replace: true });
    };

    const handleLocationChange = (value: string) => {
        router.get('/tenants', { ...filters, location: value === 'all' ? undefined : value }, { preserveState: true, replace: true });
    };

    const clearFilters = () => {
        setSearchValue('');
        router.get('/tenants', {}, { preserveState: true, replace: true });
    };

    const handleBedChange = (bedId: string) => {
        form.setData('bed_id', bedId);
        const bed = availableBeds.find(b => b.id.toString() === bedId);
        if (bed) {
            form.setData('agreed_rent', bed.price.toString());
        }
    };

    const handleAddTenant = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/tenants', {
            onSuccess: () => {
                setShowAddDialog(false);
                form.reset();
            },
        });
    };

    const hasFilters = filters.search || filters.status || filters.location;

    const statusBadge = (status: Tenant['status']) => {
        const variants = {
            active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            leaving: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            left: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        };
        return <Badge className={variants[status]}>{status}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tenants" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
                        <p className="text-muted-foreground">
                            {tenants.length} tenant{tenants.length !== 1 ? 's' : ''} found
                        </p>
                    </div>

                    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <IconPlus className="mr-2 h-4 w-4" />
                                Add Tenant
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add New Tenant</DialogTitle>
                                <DialogDescription>Fill in the tenant details</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddTenant} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Name *</Label>
                                    <Input
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        required
                                        placeholder="Full name"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Phone</Label>
                                        <Input
                                            value={form.data.phone}
                                            onChange={(e) => form.setData('phone', e.target.value)}
                                            placeholder="98XXXXXXXX"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Guardian Phone</Label>
                                        <Input
                                            value={form.data.parent_phone}
                                            onChange={(e) => form.setData('parent_phone', e.target.value)}
                                            placeholder="98XXXXXXXX"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Home Location</Label>
                                    <Input
                                        value={form.data.home_location}
                                        onChange={(e) => form.setData('home_location', e.target.value)}
                                        placeholder="e.g., Kathmandu"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>ID Type</Label>
                                        <Select
                                            value={form.data.id_type}
                                            onValueChange={(v) => form.setData('id_type', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="citizenship">Citizenship</SelectItem>
                                                <SelectItem value="passport">Passport</SelectItem>
                                                <SelectItem value="license">License</SelectItem>
                                                <SelectItem value="student_id">Student ID</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>ID Number</Label>
                                        <Input
                                            value={form.data.id_number}
                                            onChange={(e) => form.setData('id_number', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <Label className="text-base font-medium">Assign Bed (Optional)</Label>
                                    <p className="text-sm text-muted-foreground mb-2">Select a bed to check-in immediately</p>

                                    <div className="space-y-2">
                                        <Label>Available Bed</Label>
                                        <Select
                                            value={form.data.bed_id}
                                            onValueChange={handleBedChange}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select bed (optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableBeds.map((bed) => (
                                                    <SelectItem key={bed.id} value={bed.id.toString()}>
                                                        {bed.label} - रू{bed.price.toLocaleString()}/mo
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {form.data.bed_id && (
                                        <div className="grid grid-cols-2 gap-4 mt-3">
                                            <div className="space-y-2">
                                                <Label>Monthly Rent (रू)</Label>
                                                <Input
                                                    type="number"
                                                    value={form.data.agreed_rent}
                                                    onChange={(e) => form.setData('agreed_rent', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Advance Paid (रू)</Label>
                                                <Input
                                                    type="number"
                                                    value={form.data.advance_paid}
                                                    onChange={(e) => form.setData('advance_paid', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <Button type="submit" className="w-full" disabled={form.processing}>
                                    {form.processing ? 'Adding...' : 'Add Tenant'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-64">
                        <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by name, phone, or location..."
                            className="pl-9"
                            value={searchValue}
                            onChange={handleSearchChange}
                        />
                    </div>

                    {/* Status Filter */}
                    <Select value={filters.status ?? 'all'} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="leaving">Leaving</SelectItem>
                            <SelectItem value="left">Left</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Location Filter */}
                    <Select value={filters.location ?? 'all'} onValueChange={handleLocationChange}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Location" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            {locations.map((loc) => (
                                <SelectItem key={loc} value={loc}>
                                    {loc}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Clear Filters */}
                    {hasFilters && (
                        <Button variant="ghost" onClick={clearFilters} className="gap-1">
                            <IconX className="h-4 w-4" />
                            Clear
                        </Button>
                    )}
                </div>

                {/* Tenant List */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {tenants.map((tenant) => (
                        <Link
                            key={tenant.id}
                            href={`/tenants/${tenant.id}`}
                            className="group rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
                        >
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                    {tenant.photo_url ? (
                                        <img
                                            src={tenant.photo_url}
                                            alt={tenant.name}
                                            className="h-12 w-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <IconUser className="h-6 w-6 text-muted-foreground" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="font-medium truncate group-hover:text-primary">
                                            {tenant.name}
                                        </h3>
                                        {statusBadge(tenant.status)}
                                    </div>

                                    {tenant.phone && (
                                        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                            <IconPhone className="h-3 w-3" />
                                            <span className="truncate">{tenant.phone}</span>
                                        </div>
                                    )}

                                    {tenant.home_location && (
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <IconMapPin className="h-3 w-3" />
                                            <span className="truncate">{tenant.home_location}</span>
                                        </div>
                                    )}

                                    {/* Current Room/Bed if available */}
                                    {tenant.current_bed && (
                                        <div className="mt-2 text-xs font-medium text-blue-600">
                                            Room {tenant.current_bed.room?.room_number}-{tenant.current_bed.label}
                                        </div>
                                    )}

                                    {/* Due Amount */}
                                    {tenant.total_due && tenant.total_due > 0 && (
                                        <div className="mt-1 text-xs font-medium text-red-600">
                                            Due: रू{tenant.total_due.toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}

                    {tenants.length === 0 && (
                        <div className="col-span-full rounded-lg border border-dashed p-12 text-center">
                            <IconUser className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-medium">No tenants found</h3>
                            <p className="mt-1 text-muted-foreground">
                                {hasFilters
                                    ? 'Try adjusting your filters'
                                    : 'Add your first tenant to get started'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout >
    );
}
