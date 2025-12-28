import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Invoice } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    IconBed,
    IconCash,
    IconAlertTriangle,
    IconUsers,
    IconArrowRight,
    IconCloudOff,
} from '@tabler/icons-react';
import { useDashboardStats, syncPageData } from '@/lib/use-offline-data';
import { useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { formatBS } from '@/lib/nepali-date';

interface DashboardStats {
    occupancy: {
        total: number;
        occupied: number;
        rate: number;
    };
    revenue: {
        dueThisMonth: number;
        collectedThisMonth: number;
        collectionRate: number;
    };
    leavingTenants: number;
}

interface DashboardProps {
    stats: DashboardStats;
    overdueInvoices: { data: Invoice[] } | Invoice[];
    revenueByMonth: Record<string, number>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({ stats: serverStats, overdueInvoices: overdueData }: DashboardProps) {
    const overdueInvoicesArray = Array.isArray(overdueData) ? overdueData : (overdueData?.data ?? []);

    // Use offline-first data hook
    const { data: offlineStats, isFromCache } = useDashboardStats({
        ...serverStats,
        overdueInvoices: overdueInvoicesArray,
    });

    const stats = offlineStats.occupancy ? offlineStats : serverStats;
    const overdueInvoices = isFromCache ? (offlineStats.overdueInvoices || []) : overdueInvoicesArray;

    // Sync to local DB when online
    useEffect(() => {
        syncPageData('dashboard', { stats: serverStats, overdueInvoices: overdueData });
    }, [serverStats, overdueData]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground">Welcome to your hostel management cockpit</p>
                    </div>
                    {isFromCache && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <IconCloudOff className="h-3 w-3" />
                            Offline Data
                        </Badge>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Occupancy Rate */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription>Occupancy Rate</CardDescription>
                            <IconBed className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.occupancy.rate}%</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.occupancy.occupied} of {stats.occupancy.total} beds filled
                            </p>
                            {/* Visual progress bar */}
                            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full bg-green-500 transition-all"
                                    style={{ width: `${stats.occupancy.rate}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Due This Month */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription>Due This Month</CardDescription>
                            <IconCash className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{formatCurrency(stats.revenue.dueThisMonth)}</div>
                            <p className="text-xs text-muted-foreground">
                                From all active tenants
                            </p>
                        </CardContent>
                    </Card>

                    {/* Collected This Month */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription>Collected</CardDescription>
                            <IconCash className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-600">
                                {formatCurrency(stats.revenue.collectedThisMonth)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats.revenue.collectionRate}% collection rate
                            </p>
                            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full bg-green-500 transition-all"
                                    style={{ width: `${stats.revenue.collectionRate}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tenants Leaving */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardDescription>Leaving Soon</CardDescription>
                            <IconUsers className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-yellow-600">{stats.leavingTenants}</div>
                            <p className="text-xs text-muted-foreground">
                                Tenants planning to leave
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Overdue Invoices */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <IconAlertTriangle className="h-5 w-5 text-red-500" />
                                    Action Required
                                </CardTitle>
                                <CardDescription>Overdue payments that need attention</CardDescription>
                            </div>
                            <Link
                                href="/finance"
                                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                            >
                                View all <IconArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {overdueInvoices.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                🎉 No overdue payments! All tenants are up to date.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {overdueInvoices.map((invoice) => (
                                    <div
                                        key={invoice.id}
                                        className="flex items-center justify-between rounded-lg border bg-red-50 p-3 dark:bg-red-950/20"
                                    >
                                        <div>
                                            <div className="font-medium">{invoice.tenant?.name ?? 'Unknown'}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {invoice.period} • Due: {formatBS(invoice.due_date)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-red-600">
                                                {formatCurrency(invoice.balance)}
                                            </div>
                                            <Badge variant="destructive" className="text-xs">
                                                Overdue
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

