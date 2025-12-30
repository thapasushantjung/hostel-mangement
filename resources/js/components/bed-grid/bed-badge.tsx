import { type Bed } from '@/types';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconUser, IconPhone, IconHome, IconUserPlus, IconUsers, IconSearch, IconWifi } from '@tabler/icons-react';
import { Link, router, useForm } from '@inertiajs/react';
import { type TenantOption } from '@/pages/BedGrid/Index';


interface BedBadgeProps {
    bed: Bed;
    roomNumber: string;
    basePrice: number;
    allTenants: TenantOption[];
}

export function BedBadge({ bed, roomNumber, basePrice, allTenants }: BedBadgeProps) {
    const [showAddTenant, setShowAddTenant] = useState(false);
    const [showTenantProfile, setShowTenantProfile] = useState(false);
    const [selectedExistingTenant, setSelectedExistingTenant] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const tenant = bed.current_tenant;
    const booking = bed.current_booking;
    const isLeaving = tenant?.status === 'leaving';

    // Filter tenants based on search
    const filteredTenants = useMemo(() => {
        if (!searchQuery.trim()) return allTenants;
        const query = searchQuery.toLowerCase();
        return allTenants.filter(t =>
            t.name.toLowerCase().includes(query) ||
            t.phone?.toLowerCase().includes(query) ||
            t.home_location?.toLowerCase().includes(query)
        );
    }, [allTenants, searchQuery]);

    // Form for new tenant
    const newTenantForm = useForm({
        name: '',
        phone: '',
        parent_phone: '',
        home_location: '',
        id_type: '',
        id_number: '',
        agreed_rent: basePrice,
        advance_paid: 0,
    });

    // Form for existing tenant
    const existingTenantForm = useForm({
        tenant_id: null as number | null,
        agreed_rent: basePrice,
        advance_paid: 0,
    });

    const statusColors = {
        available: 'bg-green-500 hover:bg-green-600 text-white cursor-pointer',
        occupied: isLeaving
            ? 'bg-yellow-500 hover:bg-yellow-600 text-white cursor-pointer'
            : 'bg-red-500 hover:bg-red-600 text-white cursor-pointer',
        maintenance: 'bg-gray-400 text-white cursor-not-allowed',
    };

    const handleClick = () => {
        if (bed.status === 'maintenance') return;

        if (bed.status === 'available') {
            setShowAddTenant(true);
        } else if (bed.status === 'occupied') {
            setShowTenantProfile(true);
        }
    };

    const handleDialogClose = (open: boolean) => {
        setShowAddTenant(open);
        if (!open) {
            setSearchQuery('');
            setSelectedExistingTenant(null);
        }
    };

    const handleNewTenantSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        newTenantForm.post(`/bed-grid/${bed.id}/assign`, {
            onSuccess: () => {
                setShowAddTenant(false);
                newTenantForm.reset();
            },
        });
    };

    const handleExistingTenantSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedExistingTenant) return;

        router.post(`/bed-grid/${bed.id}/assign`, {
            tenant_id: selectedExistingTenant,
            agreed_rent: existingTenantForm.data.agreed_rent,
            advance_paid: existingTenantForm.data.advance_paid,
        }, {
            onSuccess: () => {
                setShowAddTenant(false);
                setSelectedExistingTenant(null);
                setSearchQuery('');
            },
        });
    };

    const handleCheckoutFromSheet = () => {
        if (confirm('Are you sure you want to check out this tenant?')) {
            router.post(`/tenants/${tenant?.id}/checkout`);
            setShowTenantProfile(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            active: 'bg-green-100 text-green-800',
            leaving: 'bg-yellow-100 text-yellow-800',
            left: 'bg-gray-100 text-gray-800',
        };
        return <Badge className={variants[status] || ''}>{status}</Badge>;
    };

    return (
        <>
            <button
                onClick={handleClick}
                className={cn(
                    'flex h-12 items-center justify-center rounded-md font-medium transition-colors',
                    statusColors[bed.status]
                )}
                title={
                    bed.status === 'occupied' && tenant
                        ? `${tenant.name} - Click to view`
                        : bed.status === 'available'
                            ? 'Click to add tenant'
                            : 'Under maintenance'
                }
            >
                {roomNumber}-{bed.label}
            </button>

            {/* Add Tenant Dialog */}
            <Dialog open={showAddTenant} onOpenChange={handleDialogClose}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Assign Tenant to Bed {roomNumber}-{bed.label}</DialogTitle>
                        <DialogDescription>
                            Choose an existing tenant or add a new one
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="existing" className="mt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="existing" className="flex items-center gap-2">
                                <IconUsers className="h-4 w-4" />
                                Existing ({allTenants.length})
                            </TabsTrigger>
                            <TabsTrigger value="new" className="flex items-center gap-2">
                                <IconUserPlus className="h-4 w-4" />
                                New Tenant
                            </TabsTrigger>
                        </TabsList>

                        {/* Existing Tenant Tab */}
                        <TabsContent value="existing">
                            <form onSubmit={handleExistingTenantSubmit} className="space-y-4">
                                {/* Search Input */}
                                <div className="relative">
                                    <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name, phone, or location..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                {filteredTenants.length > 0 ? (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Select Tenant ({filteredTenants.length} found)</Label>
                                            <div className="grid gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
                                                {filteredTenants.map((t) => (
                                                    <button
                                                        key={t.id}
                                                        type="button"
                                                        onClick={() => setSelectedExistingTenant(t.id)}
                                                        className={cn(
                                                            'flex items-center gap-3 p-3 rounded-md border text-left transition-colors',
                                                            selectedExistingTenant === t.id
                                                                ? 'border-primary bg-primary/5'
                                                                : 'hover:bg-muted'
                                                        )}
                                                    >
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                                                            <IconUser className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium truncate">{t.name}</span>
                                                                {getStatusBadge(t.status)}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground truncate">
                                                                {t.current_bed ? (
                                                                    <span className="text-orange-600">Currently in {t.current_bed}</span>
                                                                ) : (
                                                                    t.phone || t.home_location || 'No contact info'
                                                                )}
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {selectedExistingTenant && allTenants.find(t => t.id === selectedExistingTenant)?.current_bed && (
                                            <div className="rounded-md bg-orange-50 p-3 text-sm text-orange-800 dark:bg-orange-950 dark:text-orange-200">
                                                ⚠️ This tenant will be <strong>transferred</strong> from their current bed.
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="ex_agreed_rent">Monthly Rent *</Label>
                                                <Input
                                                    id="ex_agreed_rent"
                                                    type="number"
                                                    value={existingTenantForm.data.agreed_rent}
                                                    onChange={(e) => existingTenantForm.setData('agreed_rent', parseFloat(e.target.value) || 0)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ex_advance_paid">Advance Paid</Label>
                                                <Input
                                                    id="ex_advance_paid"
                                                    type="number"
                                                    value={existingTenantForm.data.advance_paid}
                                                    onChange={(e) => existingTenantForm.setData('advance_paid', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={!selectedExistingTenant}
                                        >
                                            {allTenants.find(t => t.id === selectedExistingTenant)?.current_bed
                                                ? 'Transfer Tenant'
                                                : 'Assign Tenant'}
                                        </Button>
                                    </>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <IconUsers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        {searchQuery ? (
                                            <p>No tenants match "{searchQuery}"</p>
                                        ) : (
                                            <>
                                                <p>No tenants available</p>
                                                <p className="text-sm">Add a new tenant instead</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </form>
                        </TabsContent>

                        {/* New Tenant Tab */}
                        <TabsContent value="new">
                            <form onSubmit={handleNewTenantSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={newTenantForm.data.name}
                                        onChange={(e) => newTenantForm.setData('name', e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input
                                            id="phone"
                                            value={newTenantForm.data.phone}
                                            onChange={(e) => newTenantForm.setData('phone', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="parent_phone">Guardian Phone</Label>
                                        <Input
                                            id="parent_phone"
                                            value={newTenantForm.data.parent_phone}
                                            onChange={(e) => newTenantForm.setData('parent_phone', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="home_location">Home Location</Label>
                                    <Input
                                        id="home_location"
                                        value={newTenantForm.data.home_location}
                                        onChange={(e) => newTenantForm.setData('home_location', e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="id_type">ID Type</Label>
                                        <Select
                                            value={newTenantForm.data.id_type}
                                            onValueChange={(v) => newTenantForm.setData('id_type', v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select ID type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Citizenship">Citizenship</SelectItem>
                                                <SelectItem value="NID">National ID</SelectItem>
                                                <SelectItem value="Passport">Passport</SelectItem>
                                                <SelectItem value="License">Driving License</SelectItem>
                                                <SelectItem value="Voter">Voter ID</SelectItem>
                                                <SelectItem value="Student">Student ID</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="id_number">ID Number</Label>
                                        <Input
                                            id="id_number"
                                            value={newTenantForm.data.id_number}
                                            onChange={(e) => newTenantForm.setData('id_number', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                                    <div className="space-y-2">
                                        <Label htmlFor="agreed_rent">Monthly Rent *</Label>
                                        <Input
                                            id="agreed_rent"
                                            type="number"
                                            value={newTenantForm.data.agreed_rent}
                                            onChange={(e) => newTenantForm.setData('agreed_rent', parseFloat(e.target.value) || 0)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="advance_paid">Advance Paid</Label>
                                        <Input
                                            id="advance_paid"
                                            type="number"
                                            value={newTenantForm.data.advance_paid}
                                            onChange={(e) => newTenantForm.setData('advance_paid', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                </div>

                                <Button type="submit" className="w-full" disabled={newTenantForm.processing}>
                                    {newTenantForm.processing ? 'Adding...' : 'Add & Assign Tenant'}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* Tenant Profile Sheet */}
            <Sheet open={showTenantProfile} onOpenChange={setShowTenantProfile}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Tenant Details</SheetTitle>
                        <SheetDescription>
                            Bed {roomNumber}-{bed.label}
                        </SheetDescription>
                    </SheetHeader>

                    {tenant && (
                        <div className="mt-6 space-y-6">
                            {/* Tenant Info */}
                            <div className="flex items-start gap-4">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                    <IconUser className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">{tenant.name}</h3>
                                    {isLeaving && (
                                        <span className="inline-block rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                                            Leaving Soon
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="space-y-3">
                                {tenant.phone && (
                                    <div className="flex items-center gap-3">
                                        <IconPhone className="h-4 w-4 text-muted-foreground" />
                                        <a href={`tel:${tenant.phone}`} className="text-blue-600 hover:underline">
                                            {tenant.phone}
                                        </a>
                                    </div>
                                )}
                                {tenant.parent_phone && (
                                    <div className="flex items-center gap-3">
                                        <IconPhone className="h-4 w-4 text-muted-foreground" />
                                        <a href={`tel:${tenant.parent_phone}`} className="text-blue-600 hover:underline">
                                            {tenant.parent_phone} (Guardian)
                                        </a>
                                    </div>
                                )}
                                {tenant.home_location && (
                                    <div className="flex items-center gap-3">
                                        <IconHome className="h-4 w-4 text-muted-foreground" />
                                        <span>{tenant.home_location}</span>
                                    </div>
                                )}
                            </div>

                            {/* Booking Info */}
                            {booking && (
                                <div className="rounded-lg border p-4">
                                    <h4 className="font-medium">Booking Details</h4>
                                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                        <span className="text-muted-foreground">Check-in:</span>
                                        <span>{new Date(booking.start_date).toLocaleDateString()}</span>
                                        <span className="text-muted-foreground">Rent:</span>
                                        <span>रू{booking.agreed_rent.toLocaleString()}/month</span>
                                        <span className="text-muted-foreground">Advance:</span>
                                        <span>रू{booking.advance_paid.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button asChild variant="outline" className="flex-1">
                                    <Link href={`/tenants/${tenant.id}`}>
                                        View Full Profile
                                    </Link>
                                </Button>
                                <Button variant="destructive" className="flex-1" onClick={handleCheckoutFromSheet}>
                                    Check Out
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
