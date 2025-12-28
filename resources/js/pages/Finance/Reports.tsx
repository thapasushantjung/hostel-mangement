import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaymentMode } from '@/types';
import { Head, Link } from '@inertiajs/react';
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
    IconCash,
    IconAlertTriangle,
    IconArrowLeft,
    IconTrendingUp,
    IconUsers,
} from '@tabler/icons-react';

interface DailyCollection {
    total: number;
    by_mode: Record<PaymentMode, { total: number; count: number }>;
}

interface Defaulter {
    id: number;
    tenant_id: number;
    tenant_name: string;
    tenant_phone: string | null;
    period: string;
    balance: number;
    due_date: string;
    days_overdue: number;
}

interface ProfitLoss {
    period: string;
    total_billed: number;
    total_collected: number;
    total_expenses: number;
    estimated_profit: number;
    pending_in_market: number;
}

interface ReportsProps {
    dailyCollection: DailyCollection;
    defaulters: Defaulter[];
    profitLoss: ProfitLoss;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Finance', href: '/finance' },
    { title: 'Reports', href: '/finance/reports' },
];

const paymentModeLabels: Record<PaymentMode, string> = {
    cash: 'Cash',
    esewa: 'eSewa',
    khalti: 'Khalti',
    bank: 'Bank Transfer',
    other: 'Other',
};

export default function ReportsPage({
    dailyCollection,
    defaulters,
    profitLoss,
}: ReportsProps) {
    const formatCurrency = (amount: number) => `रू${amount.toLocaleString()}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Finance Reports" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/finance">
                            <IconArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
                        <p className="text-muted-foreground">Financial overview & insights</p>
                    </div>
                </div>

                {/* Daily Collection (The "Galla") */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconCash className="h-5 w-5 text-green-500" />
                            Today's Collection (Galla)
                        </CardTitle>
                        <CardDescription>
                            Verify this matches the cash in your drawer
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-green-600 mb-6">
                            {formatCurrency(dailyCollection.total)}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-5">
                            {(['cash', 'esewa', 'khalti', 'bank', 'other'] as PaymentMode[]).map((mode) => {
                                const data = dailyCollection.by_mode[mode];
                                return (
                                    <div key={mode} className="rounded-lg border p-3 text-center">
                                        <div className="text-sm text-muted-foreground">
                                            {paymentModeLabels[mode]}
                                        </div>
                                        <div className="text-lg font-semibold">
                                            {formatCurrency(data?.total || 0)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {data?.count || 0} payments
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly P&L */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconTrendingUp className="h-5 w-5 text-blue-500" />
                            Monthly Profit & Loss - {profitLoss.period}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            <div className="rounded-lg border p-4">
                                <div className="text-sm text-muted-foreground">Total Billed</div>
                                <div className="text-2xl font-bold">{formatCurrency(profitLoss.total_billed)}</div>
                            </div>
                            <div className="rounded-lg border p-4">
                                <div className="text-sm text-muted-foreground">Collected</div>
                                <div className="text-2xl font-bold text-green-600">{formatCurrency(profitLoss.total_collected)}</div>
                            </div>
                            <div className="rounded-lg border p-4">
                                <div className="text-sm text-muted-foreground">Expenses</div>
                                <div className="text-2xl font-bold text-orange-600">{formatCurrency(profitLoss.total_expenses)}</div>
                            </div>
                            <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950">
                                <div className="text-sm text-muted-foreground">Est. Profit</div>
                                <div className={`text-2xl font-bold ${profitLoss.estimated_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(profitLoss.estimated_profit)}
                                </div>
                            </div>
                            <div className="rounded-lg border p-4">
                                <div className="text-sm text-muted-foreground">Pending in Market</div>
                                <div className="text-2xl font-bold text-yellow-600">{formatCurrency(profitLoss.pending_in_market)}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Defaulter List (Red List) */}
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <IconAlertTriangle className="h-5 w-5" />
                            Defaulter List (Red List)
                        </CardTitle>
                        <CardDescription>
                            Tenants owing more than Rs. 5,000 for over 45 days
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {defaulters.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                🎉 No defaulters! All dues are within limits.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b text-left text-sm text-muted-foreground">
                                            <th className="pb-3 font-medium">Tenant</th>
                                            <th className="pb-3 font-medium">Phone</th>
                                            <th className="pb-3 font-medium">Period</th>
                                            <th className="pb-3 font-medium">Balance</th>
                                            <th className="pb-3 font-medium">Days Overdue</th>
                                            <th className="pb-3 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {defaulters.map((defaulter) => (
                                            <tr key={defaulter.id} className="border-b">
                                                <td className="py-3 font-medium">{defaulter.tenant_name}</td>
                                                <td className="py-3">
                                                    {defaulter.tenant_phone ? (
                                                        <a href={`tel:${defaulter.tenant_phone}`} className="text-blue-600 hover:underline">
                                                            {defaulter.tenant_phone}
                                                        </a>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="py-3">{defaulter.period}</td>
                                                <td className="py-3 font-bold text-red-600">
                                                    {formatCurrency(defaulter.balance)}
                                                </td>
                                                <td className="py-3">
                                                    <Badge variant="destructive">
                                                        {defaulter.days_overdue} days
                                                    </Badge>
                                                </td>
                                                <td className="py-3">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => alert(`SMS reminder would be sent to ${defaulter.tenant_phone}`)}
                                                    >
                                                        Send Warning
                                                    </Button>
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
        </AppLayout>
    );
}
