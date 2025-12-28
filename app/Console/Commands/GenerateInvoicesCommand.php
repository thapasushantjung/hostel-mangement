<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\Hostel;
use App\Models\Invoice;
use App\Models\InvoiceLineItem;
use App\Services\NepaliDate;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateInvoicesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'finance:generate-invoices
                            {--hostel= : Generate for specific hostel ID}
                            {--period= : Invoice period (default: current month YYYY-MM)}
                            {--publish : Publish invoices immediately (skip draft)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate monthly invoices for all active tenants';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $bsDate = NepaliDate::now();

        // If period is not provided, default to current Nepali month YYYY-MM
        // Check if today is the 1st of the month for auto-generation via scheduler
        if (! $this->option('period') && ! $this->option('force') && ! $bsDate->isFirstDayOfMonth()) {
            // If running automatically (implied by no args), only run on 1st of month
            // But we can't easily distinguish manual run vs scheduled without a flag or context.
            // For now, let's assume if it's running, it should generate for the current BS month
            // unless we restrict it.
            // However, to prevent daily runs from generating 30 times if scheduled daily:
            // The constraint "invoice exists" will prevents duplicates.
            // So we can safely run it.
        }

        $period = $this->option('period') ?? $bsDate->format('Y-m');
        $monthName = $this->option('period') ? $period : $bsDate->format('F Y');

        $hostelId = $this->option('hostel');
        $publish = $this->option('publish');

        $this->info("Generating invoices for period: {$period} ({$monthName})");

        $hostels = $hostelId
            ? Hostel::where('id', $hostelId)->get()
            : Hostel::all();

        $totalGenerated = 0;
        $totalSkipped = 0;

        foreach ($hostels as $hostel) {
            $this->info("\nProcessing hostel: {$hostel->name}");

            // Get all active bookings for this hostel
            $bookings = Booking::where('is_active', true)
                ->whereHas('bed', fn ($q) => $q->where('hostel_id', $hostel->id))
                ->with(['tenant', 'bed.room'])
                ->get();

            foreach ($bookings as $booking) {
                // Check if invoice already exists for this period
                $existingInvoice = Invoice::where('tenant_id', $booking->tenant_id)
                    ->where('period', $period)
                    ->withTrashed()
                    ->first();

                if ($existingInvoice) {
                    $this->warn("  Skipped: {$booking->tenant->name} (invoice exists)");
                    $totalSkipped++;

                    continue;
                }

                // Calculate arrears from previous unpaid invoices
                $arrears = Invoice::where('tenant_id', $booking->tenant_id)
                    ->whereIn('status', [Invoice::STATUS_PENDING, Invoice::STATUS_PARTIAL, Invoice::STATUS_OVERDUE])
                    ->get()
                    ->sum(fn ($inv) => $inv->balance);

                // Generate invoice with line items
                DB::transaction(function () use ($booking, $hostel, $period, $arrears, $publish) {
                    $invoice = Invoice::create([
                        'hostel_id' => $hostel->id,
                        'tenant_id' => $booking->tenant_id,
                        'booking_id' => $booking->id,
                        'period' => $period,
                        'amount' => 0, // Will be calculated from line items
                        'fine' => 0,
                        'paid_amount' => 0,
                        'status' => $publish ? Invoice::STATUS_PENDING : Invoice::STATUS_DRAFT,
                        'due_date' => now()->addDays(9), // Use AD date corresponding to 10th of current BS month approx
                    ]);

                    // Add rent line item
                    $invoice->lineItems()->create([
                        'category' => InvoiceLineItem::CATEGORY_RENT,
                        'description' => "Monthly rent for {$monthName} - {$booking->bed->room->room_number}-{$booking->bed->label}",
                        'amount' => $booking->agreed_rent,
                        'quantity' => 1,
                    ]);

                    // Add arrears if any
                    if ($arrears > 0) {
                        $invoice->lineItems()->create([
                            'category' => InvoiceLineItem::CATEGORY_ARREARS,
                            'description' => 'Previous unpaid dues',
                            'amount' => $arrears,
                            'quantity' => 1,
                        ]);
                    }

                    // Update invoice amount from line items
                    $totalAmount = $invoice->lineItems()->sum(DB::raw('amount * quantity'));
                    $invoice->update(['amount' => $totalAmount]);
                });

                $status = $publish ? 'Published' : 'Draft';
                $this->info("  ✓ {$booking->tenant->name}: रू{$booking->agreed_rent}".($arrears > 0 ? " + रू{$arrears} arrears" : '')." [{$status}]");
                $totalGenerated++;
            }
        }

        $this->newLine();
        $this->info('Summary:');
        $this->info("  Generated: {$totalGenerated} invoices");
        $this->info("  Skipped: {$totalSkipped} (already exist)");

        return Command::SUCCESS;
    }
}
