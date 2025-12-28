<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use Illuminate\Console\Command;

class CheckOverdueInvoicesCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'finance:check-overdue';

    /**
     * The console command description.
     */
    protected $description = 'Mark pending invoices as overdue if past due date';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $count = Invoice::where('status', Invoice::STATUS_PENDING)
            ->whereDate('due_date', '<', now())
            ->update(['status' => Invoice::STATUS_OVERDUE]);

        $this->info("Marked {$count} invoices as overdue.");

        return Command::SUCCESS;
    }
}
