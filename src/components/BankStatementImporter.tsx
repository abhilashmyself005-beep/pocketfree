'use client';

import React, { useState } from 'react';
import {
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ArrowLeftRight,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Transaction } from '@/core/transactions';
import { formatMoney, moneyFromHalalas } from '@/core/money';

interface BankStatementImporterProps {
  existingTransactions: Transaction[];
  onImportTransactions: (newTxs: Transaction[]) => void;
  lang: 'en' | 'ar';
}

export const BankStatementImporter: React.FC<BankStatementImporterProps> = ({
  existingTransactions,
  onImportTransactions,
  lang,
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    totalProcessed: number;
    importedCount: number;
    duplicateCount: number;
    transfersNeutralCount: number;
    refundsCount: number;
    transactions: Transaction[];
    duplicates: Array<{ description: string; amountHalalas: bigint }>;
  } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleBankStatements = {
    alrajhi: `Date,Narration,Debit,Credit
2026-10-27,"Panda Supermarket - Al Malqa",145.50,
2026-10-27,"STC Telecom Sadad Bill",287.50,
2026-10-27,"SARIE Transfer to Alinma Vault",1500.00,
2026-10-27,"Albaik Olaya Lunch",36.50,
2026-10-27,"Monthly Engineering Salary",,22500.00`,
    snb: `Date,Description,Amount
2026-10-27,"SASCO Fuel Station 95",-135.00
2026-10-27,"Apartment Rent Riyadh",-4500.00
2026-10-27,"Noon Shopping E-Commerce",-340.00
2026-10-27,"Internal Transfer between accounts",-2000.00`,
    riyad: `Date,Description,Amount
2026-10-27,"Danube Fresh Market",-210.00
2026-10-27,"POS Return Noon Refund",120.00
2026-10-27,"Starbucks Coffee Olaya",-28.00`,
  };

  const handleProcessBankCsv = async (csvData: string) => {
    setIsImporting(true);
    setError(null);
    setNotification(null);

    try {
      const existingFingerprints = existingTransactions.map((t) => t.fingerprint);

      const res = await fetch('/api/banking/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent: csvData,
          existingFingerprints,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse bank statement');

      setImportSummary({
        totalProcessed: data.totalProcessed,
        importedCount: data.importedCount,
        duplicateCount: data.duplicateCount,
        transfersNeutralCount: data.transfersNeutralCount,
        refundsCount: data.refundsCount,
        transactions: data.transactions.map((tx: any) => ({
          ...tx,
          amountHalalas: BigInt(tx.amountHalalas),
          date: new Date(tx.date),
          createdAt: new Date(),
        })),
        duplicates: data.duplicates.map((d: any) => ({
          description: d.description,
          amountHalalas: BigInt(d.amountHalalas),
        })),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error importing bank statement');
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = () => {
    if (!importSummary || importSummary.transactions.length === 0) return;
    onImportTransactions(importSummary.transactions);
    setNotification(
      lang === 'ar'
        ? `تم استيراد ${importSummary.importedCount} معاملة بنكية بنجاح، وتجاهل ${importSummary.duplicateCount} مكرر!`
        : `Successfully imported ${importSummary.importedCount} bank transactions and dropped ${importSummary.duplicateCount} duplicates!`
    );
    setImportSummary(null);
  };

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{lang === 'ar' ? 'استيراد كشوف الحسابات البنكية' : 'Bank Feed & Statement Ingestion'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Saudi Open Banking Standard
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'ar'
                ? 'مطابقة آلية للبصمة الرقمية، استبعاد التحويلات الداخلية، ومعادلة المبالغ المستردة'
                : 'SHA-256 deduplication, neutral internal transfer exclusion & refund netting'}
            </p>
          </div>
        </div>

        {/* Quick Bank Presets */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            {lang === 'ar' ? 'كشوف جاهزة:' : 'Sample Feeds:'}
          </span>
          <button
            onClick={() => handleProcessBankCsv(sampleBankStatements.alrajhi)}
            type="button"
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-xs"
          >
            Al Rajhi Feed
          </button>
          <button
            onClick={() => handleProcessBankCsv(sampleBankStatements.snb)}
            type="button"
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-xs"
          >
            SNB AlAhli
          </button>
          <button
            onClick={() => handleProcessBankCsv(sampleBankStatements.riyad)}
            type="button"
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-xs"
          >
            Riyad Bank
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="relative border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-2xl p-6 text-center transition bg-slate-900/40 group cursor-pointer">
        <input
          type="file"
          accept=".csv,text/csv,application/vnd.ms-excel"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
              const text = event.target?.result as string;
              if (text) handleProcessBankCsv(text);
            };
            reader.readAsText(file);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 rounded-2xl bg-slate-800/80 text-cyan-400 group-hover:scale-105 transition">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {isImporting
                ? lang === 'ar'
                  ? 'جاري مطابقة وتدقيق الكشف البنكي بالهللات...'
                  : 'Auditing transactions & matching SHA-256 fingerprints...'
                : lang === 'ar'
                ? 'اسحب وأفلت كشف الحساب البنكي (CSV) أو اختر ملفاً'
                : 'Upload or drop bank export statement (.CSV)'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports Al Rajhi, SNB, Riyad Bank, Alinma, SAB, and generic CSV bank exports
            </p>
          </div>
        </div>
      </div>

      {/* Reconciliation Summary Card */}
      {importSummary && (
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              <div>
                <h4 className="text-sm font-bold text-white">
                  {lang === 'ar' ? 'تقرير تدقيق ومطابقة الكشف البنكي' : 'Bank Feed Reconciliation Audit'}
                </h4>
                <p className="text-xs text-slate-400">
                  {importSummary.totalProcessed} {lang === 'ar' ? 'معاملة مقروءة' : 'total records evaluated'}
                </p>
              </div>
            </div>

            {/* Reconciliation Metric Badges */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                {importSummary.importedCount} {lang === 'ar' ? 'جديدة' : 'New'}
              </span>
              {importSummary.duplicateCount > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                  {importSummary.duplicateCount} {lang === 'ar' ? 'مكررة مهملة' : 'Duplicates Dropped'}
                </span>
              )}
              {importSummary.transfersNeutralCount > 0 && (
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
                  {importSummary.transfersNeutralCount} {lang === 'ar' ? 'تحويل حيادي' : 'Neutral Transfers'}
                </span>
              )}
            </div>
          </div>

          {/* Transaction items preview */}
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-800 text-xs">
            {importSummary.transactions.map((tx) => (
              <div key={tx.id} className="py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-slate-200 truncate">{tx.description}</span>
                  {tx.isTransfer && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Transfer
                    </span>
                  )}
                  {tx.isRefund && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/20">
                      Refund
                    </span>
                  )}
                </div>
                <span className="font-mono font-bold text-white shrink-0">
                  {formatMoney(moneyFromHalalas(tx.amountHalalas), { locale: lang, useSymbol: true })}
                </span>
              </div>
            ))}
          </div>

          {/* Action to Push to Ledger */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              onClick={() => setImportSummary(null)}
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              {lang === 'ar' ? 'إلغاء' : 'Dismiss'}
            </button>
            <button
              onClick={handleConfirmImport}
              type="button"
              disabled={importSummary.importedCount === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition cursor-pointer"
            >
              <span>
                {lang === 'ar'
                  ? `تأكيد وإدراج ${importSummary.importedCount} معاملة في السجل`
                  : `Confirm & Import ${importSummary.importedCount} Transactions`}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
