import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Tenant, type Invoice, type PaymentMode } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { formatCurrency } from '@/lib/utils';
import { formatBS } from '@/lib/nepali-date';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    IconPhone,
    IconMapPin,
    IconUser,
    IconArrowLeft,
    IconBed,
    IconCalendar,
    IconId,
    IconCreditCard,
} from '@tabler/icons-react';
import { useState } from 'react';

interface TenantShowProps {
    tenant: { data: Tenant } | Tenant;
    paymentModes?: PaymentMode[];
}

const paymentModeLabels: Record<PaymentMode, string> = {
    cash: 'Cash',
    esewa: 'eSewa',
    khalti: 'Khalti',
    bank: 'Bank Transfer',
    other: 'Other',
};

export default function TenantShow({ tenant: tenantData, paymentModes = ['cash', 'esewa', 'khalti', 'bank', 'other'] }: TenantShowProps) {
    const tenant = 'data' in tenantData ? tenantData.data : tenantData;
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [showPaymentSheet, setShowPaymentSheet] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    const editForm = useForm({
        name: tenant.name,
        phone: tenant.phone ?? '',
        parent_phone: tenant.parent_phone ?? '',
        home_location: tenant.home_location ?? '',
        id_type: tenant.id_type ?? '',
        id_number: tenant.id_number ?? '',
        status: tenant.status,
    });

    const paymentForm = useForm({
        amount: '',
        mode: 'cash' as PaymentMode,
        reference_no: '',
        remarks: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Tenants', href: '/tenants' },
        { title: tenant.name, href: `/tenants/${tenant.id}` },
    ];

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        editForm.put(`/tenants/${tenant.id}`, {
            onSuccess: () => setShowEditDialog(false),
        });
    };

    const handleCheckout = () => {
        setIsCheckingOut(true);
        router.post(`/tenants/${tenant.id}/checkout`, {}, {
            onFinish: () => setIsCheckingOut(false),
        });
    };

    const handleOpenPaymentSheet = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        paymentForm.setData('amount', invoice.balance.toString());
        setShowPaymentSheet(true);
    };

    const handleAddPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;

        paymentForm.post(`/finance/invoices/${selectedInvoice.id}/payment`, {
            onSuccess: () => {
                setShowPaymentSheet(false);
                setSelectedInvoice(null);
                paymentForm.reset();
            },
        });
    };

    const statusBadge = (status: Tenant['status']) => {
        const variants = {
            active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            leaving: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            left: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        };
        return <Badge className={variants[status]}>{status}</Badge>;
    };

    const invoiceStatusBadge = (status: Invoice['status']) => {
        const variants: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-800',
            paid: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            partial: 'bg-blue-100 text-blue-800',
            overdue: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-500 line-through',
        };
        return <Badge className={variants[status] || ''}>{status}</Badge>;
    };

    const activeBooking = tenant.active_booking;
    const invoices = tenant.invoices ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={tenant.name} />

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Tenant</DialogTitle>
                        <DialogDescription>Update tenant information</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={editForm.data.name}
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={editForm.data.phone}
                                    onChange={(e) => editForm.setData('phone', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="parent_phone">Guardian Phone</Label>
                                <Input
                                    id="parent_phone"
                                    value={editForm.data.parent_phone}
                                    onChange={(e) => editForm.setData('parent_phone', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="home_location">Home Location</Label>
                            <Input
                                id="home_location"
                                value={editForm.data.home_location}
                                onChange={(e) => editForm.setData('home_location', e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="id_type">ID Type</Label>
                                <Input
                                    id="id_type"
                                    value={editForm.data.id_type}
                                    onChange={(e) => editForm.setData('id_type', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="id_number">ID Number</Label>
                                <Input
                                    id="id_number"
                                    value={editForm.data.id_number}
                                    onChange={(e) => editForm.setData('id_number', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={editForm.data.status}
                                onValueChange={(v) => editForm.setData('status', v as Tenant['status'])}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="leaving">Leaving</SelectItem>
                                    <SelectItem value="left">Left</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button type="submit" className="w-full" disabled={editForm.processing}>
                            {editForm.processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Checkout Confirmation Dialog */}
            <AlertDialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Check Out Tenant</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to check out <strong>{tenant.name}</strong>?
                            This will end their booking and free up the bed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCheckout}
                            disabled={isCheckingOut}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isCheckingOut ? 'Checking out...' : 'Check Out'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Payment Sheet */}
            <Sheet open={showPaymentSheet} onOpenChange={setShowPaymentSheet}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Add Payment</SheetTitle>
                        <SheetDescription>
                            {selectedInvoice?.period} - Balance: {selectedInvoice ? formatCurrency(selectedInvoice.balance) : ''}
                        </SheetDescription>
                    </SheetHeader>

                    {selectedInvoice && (
                        <form onSubmit={handleAddPayment} className="mt-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="pay_amount">Amount</Label>
                                <Input
                                    id="pay_amount"
                                    type="number"
                                    value={paymentForm.data.amount}
                                    onChange={(e) => paymentForm.setData('amount', e.target.value)}
                                    max={selectedInvoice.balance}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Max: {formatCurrency(selectedInvoice.balance)}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Payment Mode</Label>
                                <Select
                                    value={paymentForm.data.mode}
                                    onValueChange={(v) => paymentForm.setData('mode', v as PaymentMode)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentModes.map((mode) => (
                                            <SelectItem key={mode} value={mode}>
                                                {paymentModeLabels[mode]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {paymentForm.data.mode !== 'cash' && (
                                <div className="space-y-2">
                                    <Label htmlFor="reference_no">Reference No</Label>
                                    <Input
                                        id="reference_no"
                                        value={paymentForm.data.reference_no}
                                        onChange={(e) => paymentForm.setData('reference_no', e.target.value)}
                                        placeholder="e.g., 1234"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="remarks">Remarks (optional)</Label>
                                <Textarea
                                    id="remarks"
                                    value={paymentForm.data.remarks}
                                    onChange={(e) => paymentForm.setData('remarks', e.target.value)}
                                    placeholder="e.g., Paid by father"
                                    rows={2}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={paymentForm.processing}>
                                {paymentForm.processing ? 'Recording...' : `Record ${formatCurrency(parseFloat(paymentForm.data.amount) || 0)} Payment`}
                            </Button>
                        </form>
                    )}
                </SheetContent>
            </Sheet>

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <Link href="/tenants">
                            <Button variant="ghost" size="icon">
                                <IconArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>

                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                            {tenant.photo_url ? (
                                <img
                                    src={tenant.photo_url}
                                    alt={tenant.name}
                                    className="h-16 w-16 rounded-full object-cover"
                                />
                            ) : (
                                <IconUser className="h-8 w-8 text-muted-foreground" />
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">{tenant.name}</h1>
                                {statusBadge(tenant.status)}
                            </div>
                            <p className="text-muted-foreground">
                                Tenant since {formatBS(tenant.created_at)}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowEditDialog(true)}>Edit</Button>
                        {tenant.status === 'active' && (
                            <Button variant="destructive" onClick={() => setShowCheckoutDialog(true)}>Check Out</Button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Contact Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {tenant.phone && (
                                <div className="flex items-center gap-3">
                                    <IconPhone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Phone</p>
                                        <a href={`tel:${tenant.phone}`} className="text-blue-600 hover:underline">
                                            {tenant.phone}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {tenant.parent_phone && (
                                <div className="flex items-center gap-3">
                                    <IconPhone className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Guardian Phone</p>
                                        <a href={`tel:${tenant.parent_phone}`} className="text-blue-600 hover:underline">
                                            {tenant.parent_phone}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {tenant.home_location && (
                                <div className="flex items-center gap-3">
                                    <IconMapPin className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Home Location</p>
                                        <p>{tenant.home_location}</p>
                                    </div>
                                </div>
                            )}
                            {tenant.id_type && (
                                <div className="flex items-center gap-3">
                                    <IconId className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">{tenant.id_type}</p>
                                        <p>{tenant.id_number}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Current Booking */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Accommodation</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {activeBooking ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <IconBed className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Bed</p>
                                            <p className="font-medium">
                                                Room {activeBooking.bed?.room?.room_number}-{activeBooking.bed?.label}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <IconCalendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Check-in Date</p>
                                            <p>{formatBS(activeBooking.start_date)}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Monthly Rent</p>
                                            <p className="text-lg font-semibold">
                                                {formatCurrency(activeBooking.agreed_rent)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Advance Paid</p>
                                            <p className="text-lg font-semibold text-green-600">
                                                {formatCurrency(activeBooking.advance_paid)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No active accommodation</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Balance Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Balance Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Due</span>
                                    <span className="font-semibold text-red-600">
                                        {formatCurrency(tenant.total_due ?? 0)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Pending Invoices</span>
                                    <span>{invoices.filter(i => !['paid', 'cancelled', 'draft'].includes(i.status)).length}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                        <CardDescription>All invoices for this tenant</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {invoices.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b text-left text-sm text-muted-foreground">
                                            <th className="pb-3 font-medium">Period</th>
                                            <th className="pb-3 font-medium">Amount</th>
                                            <th className="pb-3 font-medium">Paid</th>
                                            <th className="pb-3 font-medium">Balance</th>
                                            <th className="pb-3 font-medium">Status</th>
                                            <th className="pb-3 font-medium">Due Date</th>
                                            <th className="pb-3 font-medium">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoices.map((invoice) => (
                                            <tr key={invoice.id} className="border-b">
                                                <td className="py-3 font-medium">{invoice.period}</td>
                                                <td className="py-3">{formatCurrency(invoice.amount)}</td>
                                                <td className="py-3 text-green-600">{formatCurrency(invoice.paid_amount)}</td>
                                                <td className="py-3 text-red-600">{formatCurrency(invoice.balance)}</td>
                                                <td className="py-3">{invoiceStatusBadge(invoice.status)}</td>
                                                <td className="py-3">{formatBS(invoice.due_date)}</td>
                                                <td className="py-3">
                                                    {invoice.balance > 0 && !['paid', 'cancelled'].includes(invoice.status) && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleOpenPaymentSheet(invoice)}
                                                        >
                                                            <IconCreditCard className="mr-1 h-4 w-4" />
                                                            Pay
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">No invoices yet</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
