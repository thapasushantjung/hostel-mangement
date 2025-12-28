<?php

namespace App\Http\Controllers;

use App\Http\Resources\InvoiceResource;
use App\Models\Bed;
use App\Models\Invoice;
use App\Models\Tenant;
use App\Services\NepaliDate;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard with stats.
     */
    public function index(): Response
    {
        // Occupancy stats
        $totalBeds = Bed::count();
        $occupiedBeds = Bed::where('status', 'occupied')->count();
        $occupancyRate = $totalBeds > 0 ? round(($occupiedBeds / $totalBeds) * 100) : 0;

        // Revenue stats for current month
        $bsDate = NepaliDate::now();
        $currentMonth = $bsDate->format('Y-m');
        $monthlyInvoices = Invoice::where('period', $currentMonth)->get();
        $dueThisMonth = $monthlyInvoices->sum(fn ($inv) => $inv->amount + $inv->fine);
        $collectedThisMonth = $monthlyInvoices->sum('paid_amount');
        $collectionRate = $dueThisMonth > 0 ? round(($collectedThisMonth / $dueThisMonth) * 100) : 0;

        // Overdue invoices (action items)
        $overdueInvoices = Invoice::with('tenant')
            ->where('status', 'overdue')
            ->orWhere(function ($query) {
                $query->where('status', 'pending')
                    ->where('due_date', '<', now());
            })
            ->orderBy('due_date')
            ->limit(10)
            ->get();

        // Update overdue statuses
        Invoice::where('status', 'pending')
            ->where('due_date', '<', now())
            ->update(['status' => 'overdue']);

        // Recent revenue (last 6 months) - database-agnostic approach
        $revenueByMonth = Invoice::query()
            ->where('status', 'paid')
            ->where('paid_at', '>=', now()->subMonths(6))
            ->get()
            ->groupBy(fn ($invoice) => $invoice->paid_at->format('Y-m'))
            ->map(fn ($invoices) => $invoices->sum('paid_amount'))
            ->toArray();

        // Active tenants leaving soon
        $leavingTenants = Tenant::where('status', 'leaving')->count();

        return Inertia::render('Dashboard', [
            'stats' => [
                'occupancy' => [
                    'total' => $totalBeds,
                    'occupied' => $occupiedBeds,
                    'rate' => $occupancyRate,
                ],
                'revenue' => [
                    'dueThisMonth' => $dueThisMonth,
                    'collectedThisMonth' => $collectedThisMonth,
                    'collectionRate' => $collectionRate,
                ],
                'leavingTenants' => $leavingTenants,
            ],
            'overdueInvoices' => InvoiceResource::collection($overdueInvoices),
            'revenueByMonth' => $revenueByMonth,
        ]);
    }
}
