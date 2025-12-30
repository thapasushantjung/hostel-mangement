import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Invoice, type Expense, type Payment, type PaymentMode } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { formatCurrency } from '@/lib/utils';
import { formatBS } from '@/lib/nepali-date';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
    IconCash,
    IconAlertTriangle,
    IconPlus,
    IconReceipt,
    IconCreditCard,
    IconHistory,
    IconBan,
} from '@tabler/icons-react';
import { useState } from 'react';

interface FinanceProps {
    invoices: { data: Invoice[] } | Invoice[];
    expenses: { data: Expense[] } | Expense[];
    stats: {
        totalDue: number;
        dueThisMonth: number;
        collectedThisMonth: number;
        overdueCount: number;
    };
    monthlyExpenses: number;
    activeTab: 'due' | 'paid' | 'draft';
    paymentModes: PaymentMode[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
];

const expenseCategories = [
    'groceries',
    'electricity',
    'water',
    'gas',
    'maintenance',
    'salaries',
    'internet',
    'other',
];

const paymentModeLabels: Record<PaymentMode, string> = {
    cash: 'Cash',
    esewa: 'eSewa',
    khalti: 'Khalti',
    bank: 'Bank Transfer',
    other: 'Other',
};

export default function FinanceIndex({
    invoices: invoicesData,
    expenses: expensesData,
    stats,
    monthlyExpenses,
    activeTab,
    paymentModes = ['cash', 'esewa', 'khalti', 'bank', 'other'],
}: FinanceProps) {
    const serverInvoices = Array.isArray(invoicesData) ? invoicesData : (invoicesData?.data ?? []);
    const expenses = Array.isArray(expensesData) ? expensesData : (expensesData?.data ?? []);
    const [showExpenseDialog, setShowExpenseDialog] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [showPaymentSheet, setShowPaymentSheet] = useState(false);
    const [showVoidDialog, setShowVoidDialog] = useState(false);



    const invoices = serverInvoices;

    const expenseForm = useForm({
        category: '',
        description: '',
        vendor: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
    });

    const paymentForm = useForm({
        amount: '',
        mode: 'cash' as PaymentMode,
        reference_no: '',
        remarks: '',
    });

    const voidForm = useForm({
        reason: '',
    });

    const handleTabChange = (tab: string) => {
        router.get('/finance', { tab }, { preserveState: true, replace: true });
    };

    const handleOpenPaymentSheet = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        paymentForm.setData('amount', invoice.balance.toString());
        setShowPaymentSheet(true);
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;

        // Online: post to server
        paymentForm.post(`/finance/invoices/${selectedInvoice.id}/payment`, {
            onSuccess: () => {
                setShowPaymentSheet(false);
                setSelectedInvoice(null);
                paymentForm.reset();
            },
        });
    };

    const handleOpenVoidDialog = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setShowVoidDialog(true);
    };

    const handleVoidInvoice = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;

        voidForm.post(`/finance/invoices/${selectedInvoice.id}/void`, {
            onSuccess: () => {
                setShowVoidDialog(false);
                setSelectedInvoice(null);
                voidForm.reset();
            },
        });
    };

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        expenseForm.post('/finance/expenses', {
            onSuccess: () => {
                setShowExpenseDialog(false);
                expenseForm.reset();
            },
        });
    };

    const statusBadge = (invoiceStatus: Invoice['status']) => {
        const variants: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-800',
            paid: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            partial: 'bg-blue-100 text-blue-800',
            overdue: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-500 line-through',
        };
        return <Badge className={variants[invoiceStatus] || ''}>{invoiceStatus}</Badge>;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
                            <p className="text-muted-foreground">Manage invoices, payments & expenses</p>
                        </div>

                    </div>

                    <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
                        <DialogTrigger asChild>
                            <Button variant="destructive">
                                <IconPlus className="mr-2 h-4 w-4" />
                                Add Expense
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Expense</DialogTitle>
                                <DialogDescription>Record a new expense</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddExpense} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category">Category</Label>
                                    <Select
                                        value={expenseForm.data.category}
                                        onValueChange={(v) => expenseForm.setData('category', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {expenseCategories.map((cat) => (
                                                <SelectItem key={cat} value={cat}>
                                                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount (रू)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        value={expenseForm.data.amount}
                                        onChange={(e) => expenseForm.setData('amount', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vendor">Vendor (optional)</Label>
                                    <Input
                                        id="vendor"
                                        placeholder="e.g., Ram Dai Water"
                                        value={expenseForm.data.vendor}
                                        onChange={(e) => expenseForm.setData('vendor', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expense_date">Date</Label>
                                    <Input
                                        id="expense_date"
                                        type="date"
                                        value={expenseForm.data.expense_date}
                                        onChange={(e) => expenseForm.setData('expense_date', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (optional)</Label>
                                    <Input
                                        id="description"
                                        value={expenseForm.data.description}
                                        onChange={(e) => expenseForm.setData('description', e.target.value)}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={expenseForm.processing}>
                                    Add Expense
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription>Total Outstanding</CardDescription>
                            <IconAlertTriangle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(stats.totalDue)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats.overdueCount} overdue
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription>Due This Month</CardDescription>
                            <IconReceipt className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.dueThisMonth)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription>Collected This Month</CardDescription>
                            <IconCash className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(stats.collectedThisMonth)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription>Expenses This Month</CardDescription>
                            <IconReceipt className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {formatCurrency(monthlyExpenses)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList>
                        <TabsTrigger value="due">
                            Due ({invoices.filter(i => ['pending', 'partial', 'overdue'].includes(i.status)).length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="paid">Paid</TabsTrigger>
                        <TabsTrigger value="draft">Drafts</TabsTrigger>
                    </TabsList>

                    <TabsContent value="due" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Outstanding Invoices</CardTitle>
                                <CardDescription>Invoices pending payment</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {invoices.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        🎉 No outstanding invoices!
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {invoices.map((invoice) => (
                                            <div
                                                key={invoice.id}
                                                className="flex items-center justify-between rounded-lg border p-4"
                                            >
                                                <div>
                                                    <div className="font-medium">
                                                        {invoice.tenant?.name ?? 'Unknown'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {invoice.period} • Due: {formatBS(invoice.due_date)}
                                                    </div>
                                                    {invoice.paid_amount > 0 && (
                                                        <div className="text-xs text-blue-600">
                                                            Paid: {formatCurrency(invoice.paid_amount)} / {formatCurrency(invoice.total_due)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="font-semibold">
                                                            {formatCurrency(invoice.balance)}
                                                        </div>
                                                        {statusBadge(invoice.status)}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleOpenVoidDialog(invoice)}
                                                            title="Cancel invoice"
                                                        >
                                                            <IconBan className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleOpenPaymentSheet(invoice)}
                                                        >
                                                            <IconCreditCard className="mr-1 h-4 w-4" />
                                                            Add Payment
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="paid" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Paid Invoices</CardTitle>
                                <CardDescription>Successfully collected payments</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {invoices.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        No paid invoices yet
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {invoices.map((invoice) => (
                                            <div
                                                key={invoice.id}
                                                className="flex items-center justify-between rounded-lg border p-4"
                                            >
                                                <div>
                                                    <div className="font-medium">
                                                        {invoice.tenant?.name ?? 'Unknown'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {invoice.period} • Paid: {formatBS(invoice.paid_at || '')}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <div className="font-semibold text-green-600">
                                                            {formatCurrency(invoice.paid_amount)}
                                                        </div>
                                                        {statusBadge(invoice.status)}
                                                    </div>
                                                    {invoice.payments && invoice.payments.length > 0 && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => { setSelectedInvoice(invoice); setShowPaymentSheet(true); }}
                                                            title="View payment history"
                                                        >
                                                            <IconHistory className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="draft" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Draft Invoices</CardTitle>
                                <CardDescription>Invoices awaiting review before sending</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {invoices.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        No draft invoices
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {invoices.map((invoice) => (
                                            <div
                                                key={invoice.id}
                                                className="flex items-center justify-between rounded-lg border p-4"
                                            >
                                                <div>
                                                    <div className="font-medium">
                                                        {invoice.tenant?.name ?? 'Unknown'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {invoice.period}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold">
                                                        {formatCurrency(invoice.total_due)}
                                                    </div>
                                                    {statusBadge(invoice.status)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Expenses Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Expenses</CardTitle>
                        <CardDescription>Operational costs and bills</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {expenses.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No expenses recorded yet
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b text-left text-sm text-muted-foreground">
                                            <th className="pb-3 font-medium">Date</th>
                                            <th className="pb-3 font-medium">Category</th>
                                            <th className="pb-3 font-medium">Vendor</th>
                                            <th className="pb-3 font-medium">Description</th>
                                            <th className="pb-3 font-medium text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenses.map((expense) => (
                                            <tr key={expense.id} className="border-b">
                                                <td className="py-3">
                                                    {new Date(expense.expense_date).toLocaleDateString()}
                                                </td>
                                                <td className="py-3">
                                                    <Badge variant="outline">
                                                        {expense.category}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 text-muted-foreground">
                                                    {expense.vendor || '-'}
                                                </td>
                                                <td className="py-3 text-muted-foreground">
                                                    {expense.description || '-'}
                                                </td>
                                                <td className="py-3 text-right font-medium">
                                                    {formatCurrency(expense.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add Payment Sheet */}
            <Sheet open={showPaymentSheet} onOpenChange={setShowPaymentSheet}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>
                            {selectedInvoice?.status === 'paid' ? 'Payment History' : 'Add Payment'}
                        </SheetTitle>
                        <SheetDescription>
                            {selectedInvoice?.tenant?.name} - {selectedInvoice?.period}
                        </SheetDescription>
                    </SheetHeader>

                    {selectedInvoice && (
                        <div className="mt-6 space-y-6">
                            {/* Invoice Summary */}
                            <div className="rounded-lg border p-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="text-muted-foreground">Total Due:</span>
                                    <span className="font-medium">{formatCurrency(selectedInvoice.total_due)}</span>
                                    <span className="text-muted-foreground">Paid:</span>
                                    <span className="font-medium text-green-600">{formatCurrency(selectedInvoice.paid_amount)}</span>
                                    <span className="text-muted-foreground">Balance:</span>
                                    <span className="font-bold text-red-600">{formatCurrency(selectedInvoice.balance)}</span>
                                </div>
                            </div>

                            {/* Payment History */}
                            {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-2 flex items-center gap-2">
                                        <IconHistory className="h-4 w-4" />
                                        Payment History
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedInvoice.payments.map((payment) => (
                                            <div key={payment.id} className="flex justify-between text-sm border-b pb-2">
                                                <div>
                                                    <div>{formatCurrency(payment.amount)}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {payment.mode_label} • {new Date(payment.payment_date).toLocaleDateString()}
                                                    </div>
                                                    {payment.remarks && (
                                                        <div className="text-xs text-muted-foreground italic">"{payment.remarks}"</div>
                                                    )}
                                                </div>
                                                {payment.reference_no && (
                                                    <span className="text-xs text-muted-foreground">Ref: {payment.reference_no}</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Add Payment Form */}
                            {selectedInvoice.balance > 0 && (
                                <form onSubmit={handleAddPayment} className="space-y-4">
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
                                            <Label htmlFor="reference_no">Reference No (last 4 digits)</Label>
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
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* Void Invoice Dialog */}
            <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Invoice</DialogTitle>
                        <DialogDescription>
                            This will cancel the invoice for {selectedInvoice?.tenant?.name}. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleVoidInvoice} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="void_reason">Reason for cancellation</Label>
                            <Textarea
                                id="void_reason"
                                value={voidForm.data.reason}
                                onChange={(e) => voidForm.setData('reason', e.target.value)}
                                placeholder="e.g., Duplicate invoice, Tenant left early"
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowVoidDialog(false)}>
                                Keep Invoice
                            </Button>
                            <Button type="submit" variant="destructive" className="flex-1" disabled={voidForm.processing}>
                                Cancel Invoice
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
