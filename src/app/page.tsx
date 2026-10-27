'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { FinanceOverview } from '@/components/FinanceOverview';
import { AddTransactionModal } from '@/components/AddTransactionModal';
import { TransactionLedger } from '@/components/TransactionLedger';
import { CategoryBreakdown } from '@/components/CategoryBreakdown';
import { SavingsTracker } from '@/components/SavingsTracker';
import { ReceiptUploader } from '@/components/ReceiptUploader';
import { BankStatementImporter } from '@/components/BankStatementImporter';
import { SmartShoppingOptimizer } from '@/components/SmartShoppingOptimizer';
import { BudgetAndPrivacyControls } from '@/components/BudgetAndPrivacyControls';
import { FinArtExpenseTracker } from '@/components/FinArtExpenseTracker';
import { ZeroBasedBudgetHub } from '@/components/ZeroBasedBudgetHub';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { MobileAppShell } from '@/components/MobileAppShell';
import {
  Transaction,
  calculateSpendVsIncome,
} from '@/core/transactions';
import { ShoppingBag, Sparkles, MapPin, ExternalLink, ShieldAlert, Smartphone, Monitor } from 'lucide-react';

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_demo_01',
    userId: 'user_dev_saudi_pilot_01',
    accountId: 'acc_bank_riyad',
    type: 'income',
    category: 'salary',
    amountHalalas: 2450000n, // 24,500.00 SAR
    currency: 'SAR',
    date: new Date('2026-10-25T08:00:00Z'),
    description: 'Monthly Salary - Engineering & Tech Corp',
    source: 'bank_sync',
    fingerprint: 'fp_a1b2c3d4e5f601',
    isTransfer: false,
    isRefund: false,
    createdAt: new Date('2026-10-25T08:00:00Z'),
  },
  {
    id: 'tx_demo_02',
    userId: 'user_dev_saudi_pilot_01',
    accountId: 'acc_bank_riyad',
    type: 'expense',
    category: 'housing',
    amountHalalas: 650000n, // 6,500.00 SAR
    currency: 'SAR',
    date: new Date('2026-10-25T11:00:00Z'),
    description: 'Apartment Lease - Al-Malqa, Riyadh',
    source: 'bank_sync',
    fingerprint: 'fp_a1b2c3d4e5f602',
    isTransfer: false,
    isRefund: false,
    createdAt: new Date('2026-10-25T11:00:00Z'),
  },
  {
    id: 'tx_demo_03',
    userId: 'user_dev_saudi_pilot_01',
    accountId: 'acc_cash_wallet_sa',
    type: 'expense',
    category: 'groceries',
    amountHalalas: 84525n, // 845.25 SAR
    currency: 'SAR',
    date: new Date('2026-10-26T15:30:00Z'),
    description: 'Danube Supermarket - Fresh Produce & Staples',
    source: 'receipt_ocr',
    fingerprint: 'fp_a1b2c3d4e5f603',
    isTransfer: false,
    isRefund: false,
    notes: 'ZATCA QR Scanned • 15% VAT Included',
    createdAt: new Date('2026-10-26T15:30:00Z'),
  },
  {
    id: 'tx_demo_04',
    userId: 'user_dev_saudi_pilot_01',
    accountId: 'acc_cash_wallet_sa',
    type: 'expense',
    category: 'dining',
    amountHalalas: 21550n, // 215.50 SAR
    currency: 'SAR',
    date: new Date('2026-10-26T19:45:00Z'),
    description: 'Al-Romansiah Restaurant - Family Dinner',
    source: 'cash_manual',
    fingerprint: 'fp_a1b2c3d4e5f604',
    isTransfer: false,
    isRefund: false,
    createdAt: new Date('2026-10-26T19:45:00Z'),
  },
  {
    id: 'tx_demo_05',
    userId: 'user_dev_saudi_pilot_01',
    accountId: 'acc_bank_riyad',
    type: 'transfer',
    category: 'investments',
    amountHalalas: 400000n, // 4,000.00 SAR
    currency: 'SAR',
    date: new Date('2026-10-26T21:00:00Z'),
    description: 'Internal Transfer: Checking to Savings Vault',
    source: 'bank_sync',
    fingerprint: 'fp_a1b2c3d4e5f605',
    isTransfer: true,
    isRefund: false,
    createdAt: new Date('2026-10-26T21:00:00Z'),
  },
  {
    id: 'tx_demo_06',
    userId: 'user_dev_saudi_pilot_01',
    accountId: 'acc_cash_wallet_sa',
    type: 'expense',
    category: 'transport',
    amountHalalas: 13500n, // 135.00 SAR
    currency: 'SAR',
    date: new Date('2026-10-27T08:15:00Z'),
    description: 'SASCO Station - 95 Fuel',
    source: 'cash_manual',
    fingerprint: 'fp_a1b2c3d4e5f606',
    isTransfer: false,
    isRefund: false,
    createdAt: new Date('2026-10-27T08:15:00Z'),
  },
];

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

  // Recalculate spend-vs-income analytics in Halala precision
  const analysis = useMemo(() => {
    return calculateSpendVsIncome(transactions);
  }, [transactions]);

  const handleAddTransaction = (newTx: Transaction) => {
    const isDuplicate = transactions.some((t) => t.fingerprint === newTx.fingerprint);
    if (isDuplicate) {
      alert(
        lang === 'ar'
          ? 'تنبيه: تم رصد معاملة سابقة مطابقة تماماً لنفس اليوم والمبلغ والوصف. تم منع تكرار القيد.'
          : 'Warning: A transaction with the exact same fingerprint already exists for this date and amount. Deduplication triggered.'
      );
      return;
    }
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleImportTransactions = (newTxs: Transaction[]) => {
    setTransactions((prev) => [...newTxs, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className={`min-h-screen flex flex-col bg-slate-950 ${lang === 'ar' ? 'font-sans' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Navbar */}
      <Navbar
        onOpenAddModal={() => setIsAddModalOpen(true)}
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ar' : 'en'))}
      />

      {/* View Switcher Control (Prominent in Header on Desktop) */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">Display View:</span>
          <div className="flex items-center rounded-xl bg-slate-850 p-1 border border-slate-750">
            <button
              onClick={() => setViewMode('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'mobile'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile App UI</span>
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'desktop'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop Suite</span>
            </button>
          </div>
        </div>

        <span className="text-[11px] text-emerald-400 font-medium">
          {viewMode === 'mobile' ? '⚡ Native Mobile App Active' : '💻 Multi-Module View Active'}
        </span>
      </div>

      {/* VIEW MODE 1: MOBILE APP UI */}
      {viewMode === 'mobile' ? (
        <div className="flex-1 flex flex-col items-center justify-center sm:py-6 px-0 sm:px-4">
          {/* Authentic Smartphone Chassis Frame on Desktop */}
          <div className="w-full sm:max-w-md bg-slate-950 sm:rounded-[42px] sm:border-[8px] sm:border-slate-800 sm:shadow-2xl sm:shadow-emerald-500/10 overflow-hidden relative sm:ring-1 sm:ring-white/10">
            {/* Speaker & Sensor Notch Bar (Desktop Only) */}
            <div className="hidden sm:flex items-center justify-center pt-2 pb-1 bg-slate-950">
              <div className="w-24 h-4 bg-slate-900 rounded-full flex items-center justify-center gap-2 border border-slate-800">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-700" />
                <div className="w-8 h-1 bg-slate-800 rounded-full" />
              </div>
            </div>

            {/* Mobile App Shell */}
            <MobileAppShell
              transactions={transactions}
              analysis={analysis}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onImportTransactions={handleImportTransactions}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              lang={lang}
              onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ar' : 'en'))}
            />
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: DESKTOP SUITE */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8 space-y-8">
          <section id="section-overview" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {lang === 'ar' ? 'لوحة التحكم المالي الشخصي' : 'Personal Finance Dashboard'}
                </h1>
                <p className="text-sm text-slate-400">
                  {lang === 'ar'
                    ? 'تحليل دقيق للتدفقات النقدية والمصروفات بالريال السعودي والهللات'
                    : 'Halala-exact spend vs. income ledger with automated double-counting prevention'}
                </p>
              </div>
            </div>

            <FinanceOverview analysis={analysis} lang={lang} />
          </section>

          {/* FinArt Replica: Automatic Alert & Scheduled Bills Hub */}
          <section id="section-finart-alerts">
            <FinArtExpenseTracker onAddTransaction={handleAddTransaction} lang={lang} />
          </section>

          {/* Ingestion Modules Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BankStatementImporter
              existingTransactions={transactions}
              onImportTransactions={handleImportTransactions}
              lang={lang}
            />
            <ReceiptUploader onAddTransaction={handleAddTransaction} lang={lang} />
          </div>

          {/* Middle Two-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryBreakdown analysis={analysis} lang={lang} />
            <SavingsTracker lang={lang} />
          </div>

          {/* Smart Shopping Optimizer */}
          <section id="section-shopping-optimizer">
            <SmartShoppingOptimizer lang={lang} />
          </section>

          {/* Beyond Budget Replica */}
          <section id="section-zero-based-envelopes">
            <ZeroBasedBudgetHub
              totalIncomeHalalas={analysis.totalIncome.amountHalalas > 0n ? analysis.totalIncome.amountHalalas : 2450000n}
              lang={lang}
            />
          </section>

          {/* Budget & Privacy Controls */}
          <section id="section-budget-controls">
            <BudgetAndPrivacyControls transactions={transactions} lang={lang} />
          </section>

          {/* Transaction Ledger Table */}
          <section id="section-transactions">
            <TransactionLedger
              transactions={transactions}
              onDeleteTransaction={handleDeleteTransaction}
              lang={lang}
            />
          </section>

          {/* Mobile Bottom Navigation for fallback */}
          <MobileBottomNav
            onOpenAddModal={() => setIsAddModalOpen(true)}
            lang={lang}
          />
        </main>
      )}

      {/* Manual Cash Income/Expense Entry Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTransaction={handleAddTransaction}
        lang={lang}
      />
    </div>
  );
}
