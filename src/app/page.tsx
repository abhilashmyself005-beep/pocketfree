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
import {
  Transaction,
  calculateSpendVsIncome,
} from '@/core/transactions';
import { ShoppingBag, Sparkles, MapPin, ExternalLink, ShieldAlert } from 'lucide-react';

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
    isTransfer: true, // Internal transfer - excluded from spend to prevent double-counting!
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

  // Recalculate spend-vs-income analytics in Halala precision
  const analysis = useMemo(() => {
    return calculateSpendVsIncome(transactions);
  }, [transactions]);

  const handleAddTransaction = (newTx: Transaction) => {
    // Check for duplicate fingerprint
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
    <div className={`min-h-screen flex flex-col ${lang === 'ar' ? 'font-sans' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top Navigation */}
      <Navbar
        onOpenAddModal={() => setIsAddModalOpen(true)}
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ar' : 'en'))}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Module 1: Personal Finance Dashboard & Spend-vs-Earn Analysis */}
        <section className="space-y-4">
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

        {/* Ingestion Modules Grid: Bank Statement Ingestion & Private ZATCA Receipt OCR */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BankStatementImporter
            existingTransactions={transactions}
            onImportTransactions={handleImportTransactions}
            lang={lang}
          />
          <ReceiptUploader onAddTransaction={handleAddTransaction} lang={lang} />
        </div>

        {/* Middle Two-Column Grid: Visual Distribution & Verified Savings Tracker */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryBreakdown analysis={analysis} lang={lang} />
          <SavingsTracker lang={lang} />
        </div>

        {/* Module 5 & 6: Saudi Smart Shopping, Retailer Price Matching & Delivery Optimizer */}
        <section>
          <SmartShoppingOptimizer lang={lang} />
        </section>

        {/* Transaction Ledger Table with Search, Filter & Halala Display */}
        <section>
          <TransactionLedger
            transactions={transactions}
            onDeleteTransaction={handleDeleteTransaction}
            lang={lang}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400 space-y-2">
        <p>
          Pocketfree • Saudi Personal Finance & Smart Shopping Platform • Built for precision in SAR & Halalas.
        </p>
        <p className="text-slate-400">
          Complies with Saudi Personal Data Protection Law (PDPL) & ZATCA e-Invoicing standards.
        </p>
      </footer>

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
