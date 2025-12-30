<?php

namespace App\Http\Controllers;

use App\Http\Resources\ExpenseResource;
use App\Http\Resources\InvoiceResource;
use App\Models\AuditLog;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\NepaliDate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    /**
     * Display the finance overview with invoices and expenses.
     */
    public function index(Request $request): Response
    {
        $tab = $request->input('tab', 'due');

        // Get invoices based on tab (with payments for displaying payment history)
        $invoicesQuery = Invoice::with(['tenant', 'booking.bed.room', 'payments.createdBy'])
            ->orderBy('due_date');

        if ($tab === 'due') {
            $invoicesQuery->whereIn('status', ['pending', 'partial', 'overdue']);
        } elseif ($tab === 'paid') {
            $invoicesQuery->where('status', 'paid');
        } elseif ($tab === 'draft') {
            $invoicesQuery->where('status', 'draft');
        }

        $invoices = $invoicesQuery->get();

        // Summary stats
        $bsDate = NepaliDate::now();
        $currentBsPeriod = $bsDate->format('Y-m');
        $startOfBsMonth = $bsDate->startOfMonthAsAD()->startOfDay();
        $endOfBsMonth = $bsDate->endOfMonthAsAD()->endOfDay();

        $allMonthlyInvoices = Invoice::where('period', $currentBsPeriod)->get();

        // Total payments this month (Nepali Month)
        $paymentsThisMonth = Payment::whereBetween('payment_date', [$startOfBsMonth, $endOfBsMonth])
            ->sum('amount');

        $stats = [
            'totalDue' => Invoice::whereIn('status', ['pending', 'partial', 'overdue'])
                ->get()
                ->sum(fn ($inv) => $inv->balance),
            'dueThisMonth' => $allMonthlyInvoices->sum(fn ($inv) => $inv->total_due),
            'collectedThisMonth' => $paymentsThisMonth,
            'overdueCount' => Invoice::where('status', 'overdue')->count(),
        ];

        // Recent expenses
        $expenses = Expense::orderByDesc('expense_date')
            ->limit(20)
            ->get();

        $monthlyExpenses = Expense::whereBetween('expense_date', [$startOfBsMonth, $endOfBsMonth])
            ->sum('amount');

        return Inertia::render('Finance/Index', [
            'invoices' => InvoiceResource::collection($invoices),
            'expenses' => ExpenseResource::collection($expenses),
            'stats' => $stats,
            'monthlyExpenses' => $monthlyExpenses,
            'activeTab' => $tab,
            'paymentModes' => Payment::MODES,
        ]);
    }

    /**
     * Display finance reports (Daily Collection, Defaulters, P&L).
     */
    public function reports(): Response
    {
        // Daily Collection Report (today's payments by mode)
        $todayPayments = Payment::whereDate('payment_date', today())
            ->selectRaw('mode, SUM(amount) as total, COUNT(*) as count')
            ->groupBy('mode')
            ->get()
            ->keyBy('mode');

        $dailyCollection = [
            'total' => Payment::whereDate('payment_date', today())->sum('amount'),
            'by_mode' => $todayPayments,
        ];

        // Defaulter List (balance > 5000, overdue > 45 days)
        $defaulters = Invoice::with('tenant')
            ->whereIn('status', [Invoice::STATUS_PENDING, Invoice::STATUS_PARTIAL, Invoice::STATUS_OVERDUE])
            ->whereDate('due_date', '<', now()->subDays(45))
            ->get()
            ->filter(fn ($inv) => $inv->balance >= 5000)
            ->map(fn ($inv) => [
                'id' => $inv->id,
                'tenant_id' => $inv->tenant_id,
                'tenant_name' => $inv->tenant?->name,
                'tenant_phone' => $inv->tenant?->phone,
                'period' => $inv->period,
                'balance' => $inv->balance,
                'due_date' => $inv->due_date->format('Y-m-d'),
                'days_overdue' => $inv->due_date->diffInDays(now()),
            ])
            ->values();

        // Monthly P&L
        $bsDate = NepaliDate::now();
        $currentBsPeriod = $bsDate->format('Y-m');
        $startOfBsMonth = $bsDate->startOfMonthAsAD()->startOfDay();
        $endOfBsMonth = $bsDate->endOfMonthAsAD()->endOfDay();

        $monthlyInvoices = Invoice::where('period', $currentBsPeriod)->get();

        $totalBilled = $monthlyInvoices->sum(fn ($inv) => $inv->total_due);
        $totalCollected = Payment::whereBetween('payment_date', [$startOfBsMonth, $endOfBsMonth])
            ->sum('amount');
        $totalExpenses = Expense::whereBetween('expense_date', [$startOfBsMonth, $endOfBsMonth])
            ->sum('amount');

        $profitLoss = [
            'period' => $bsDate->format('F Y'),
            'total_billed' => $totalBilled,
            'total_collected' => $totalCollected,
            'total_expenses' => $totalExpenses,
            'estimated_profit' => $totalCollected - $totalExpenses,
            'pending_in_market' => $totalBilled - $totalCollected,
        ];

        return Inertia::render('Finance/Reports', [
            'dailyCollection' => $dailyCollection,
            'defaulters' => $defaulters,
            'profitLoss' => $profitLoss,
        ]);
    }

    /**
     * Add a payment to an invoice.
     */
    public function addPayment(Request $request, Invoice $invoice): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:1', 'max:'.$invoice->balance],
            'mode' => ['required', 'in:'.implode(',', Payment::MODES)],
            'reference_no' => ['nullable', 'string', 'max:100'],
            'remarks' => ['nullable', 'string', 'max:500'],
            'payment_date' => ['nullable', 'date'],
        ]);

        $payment = $invoice->addPayment(
            amount: $validated['amount'],
            mode: $validated['mode'],
            referenceNo: $validated['reference_no'] ?? null,
            remarks: $validated['remarks'] ?? null,
        );



        return back()->with('success', 'Payment of रू'.number_format($validated['amount']).' recorded');
    }

    /**
     * Void/cancel an invoice.
     */
    public function voidInvoice(Request $request, Invoice $invoice): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $invoice->void($validated['reason']);

        return back()->with('success', 'Invoice cancelled');
    }

    /**
     * Mark an invoice as paid (legacy - full payment).
     */
    public function markPaid(Invoice $invoice): RedirectResponse
    {
        // Create a payment record for the remaining balance
        if ($invoice->balance > 0) {
            $invoice->addPayment(
                amount: $invoice->balance,
                mode: 'cash',
                remarks: 'Full payment'
            );
        }

        return back()->with('success', 'Invoice marked as paid');
    }

    /**
     * Store a new expense.
     */
    public function storeExpense(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category' => ['required', 'string', 'max:50'],
            'description' => ['nullable', 'string', 'max:255'],
            'vendor' => ['nullable', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0'],
            'expense_date' => ['required', 'date'],
        ]);

        Expense::create($validated);

        return back()->with('success', 'Expense added successfully');
    }

    /**
     * Publish a draft invoice (change status from draft to pending).
     */
    public function publishInvoice(Invoice $invoice): RedirectResponse
    {
        if ($invoice->status !== Invoice::STATUS_DRAFT) {
            return back()->with('error', 'Only draft invoices can be published');
        }

        $invoice->update(['status' => Invoice::STATUS_PENDING]);

        AuditLog::log($invoice, 'published', ['status' => Invoice::STATUS_DRAFT], ['status' => Invoice::STATUS_PENDING]);

        return back()->with('success', 'Invoice published');
    }

    /**
     * Publish all draft invoices.
     */
    public function publishAllDrafts(): RedirectResponse
    {
        $count = Invoice::where('status', Invoice::STATUS_DRAFT)->count();

        Invoice::where('status', Invoice::STATUS_DRAFT)
            ->update(['status' => Invoice::STATUS_PENDING]);

        return back()->with('success', "{$count} invoices published");
    }
}
