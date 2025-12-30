<?php

use App\Http\Controllers\BedGridController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Bed Grid (Visual Room/Bed Management)
    Route::get('bed-grid', [BedGridController::class, 'index'])->name('bed-grid');
    Route::post('bed-grid/{bed}/assign', [BedGridController::class, 'assignTenant'])->name('bed-grid.assign');

    // Tenants
    Route::get('tenants', [TenantController::class, 'index'])->name('tenants.index');
    Route::post('tenants', [TenantController::class, 'store'])->name('tenants.store');
    Route::get('tenants/{tenant}', [TenantController::class, 'show'])->name('tenants.show');
    Route::put('tenants/{tenant}', [TenantController::class, 'update'])->name('tenants.update');
    Route::post('tenants/{tenant}/checkout', [TenantController::class, 'checkout'])->name('tenants.checkout');

    // Finance
    Route::get('finance', [FinanceController::class, 'index'])->name('finance.index');
    Route::get('finance/reports', [FinanceController::class, 'reports'])->name('finance.reports');
    Route::post('finance/invoices/{invoice}/mark-paid', [FinanceController::class, 'markPaid'])->name('finance.mark-paid');
    Route::post('finance/invoices/{invoice}/payment', [FinanceController::class, 'addPayment'])->name('finance.add-payment');
    Route::post('finance/invoices/{invoice}/void', [FinanceController::class, 'voidInvoice'])->name('finance.void-invoice');
    Route::post('finance/invoices/{invoice}/publish', [FinanceController::class, 'publishInvoice'])->name('finance.publish-invoice');
    Route::post('finance/invoices/publish-all', [FinanceController::class, 'publishAllDrafts'])->name('finance.publish-all');
    Route::post('finance/expenses', [FinanceController::class, 'storeExpense'])->name('finance.store-expense');

    // Settings (Owner only)
    Route::get('settings/hostel', [SettingsController::class, 'index'])->name('settings.hostel');
    Route::post('settings/floors', [SettingsController::class, 'storeFloor'])->name('settings.floors.store');
    Route::delete('settings/floors/{floor}', [SettingsController::class, 'destroyFloor'])->name('settings.floors.destroy');
    Route::post('settings/rooms', [SettingsController::class, 'storeRoom'])->name('settings.rooms.store');
    Route::delete('settings/rooms/{room}', [SettingsController::class, 'destroyRoom'])->name('settings.rooms.destroy');
    Route::post('settings/staff', [SettingsController::class, 'storeStaff'])->name('settings.staff.store');
    Route::delete('settings/staff/{user}', [SettingsController::class, 'destroyStaff'])->name('settings.staff.destroy');
});

require __DIR__.'/settings.php';
