'use client';

import React, { useState } from 'react';
import {
  Transaction,
  CategoryLabels,
  TransactionType,
} from '@/core/transactions';
import { moneyFromHalalas, formatMoney } from '@/core/money';
import {
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Trash2,
  Receipt,
  Building2,
  Banknote,
  Fingerprint,
} from 'lucide-react';

interface TransactionLedgerProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  lang: 'en' | 'ar';
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  onDeleteTransaction,
  lang,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(search.toLowerCase()) ||
      tx.category.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'all') return true;
    if (filterType === 'expense') return tx.type === 'expense' && !tx.isTransfer;
    if (filterType === 'income') return tx.type === 'income' && !tx.isTransfer;
    if (filterType === 'transfer') return tx.isTransfer || tx.type === 'transfer';
    return true;
  });

  const getSourceIcon = (source: Transaction['source']) => {
    switch (source) {
      case 'receipt_ocr':
        return <Receipt className="w-3.5 h-3.5 text-purple-400" />;
      case 'bank_sync':
        return <Building2 className="w-3.5 h-3.5 text-cyan-400" />;
      case 'cash_manual':
      default:
        return <Banknote className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4">
      {/* Title & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>{lang === 'ar' ? 'سجل المعاملات والقيود' : 'Transaction Ledger'}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
              {filtered.length} {lang === 'ar' ? 'معاملة' : 'entries'}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            {lang === 'ar' ? 'مطابقة تلقائية بالبصمة ومنع التكرار' : 'SHA-256 deduplication and audit trail'}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          {[
            { id: 'all', en: 'All', ar: 'الكل' },
            { id: 'expense', en: 'Expenses', ar: 'المصروفات' },
            { id: 'income', en: 'Income', ar: 'الدخل' },
            { id: 'transfer', en: 'Transfers', ar: 'التحويلات' },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterType(pill.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                filterType === pill.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lang === 'ar' ? pill.ar : pill.en}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          placeholder={lang === 'ar' ? 'بحث بالوصف، المتجر أو التصنيف...' : 'Search by description, merchant, or category...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
        />
      </div>

      {/* Transaction List */}
      <div className="divide-y divide-slate-800/80">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            {lang === 'ar' ? 'لا توجد معاملات مطابقة للبحث' : 'No transactions found matching your criteria'}
          </div>
        ) : (
          filtered.map((tx) => {
            const money = moneyFromHalalas(tx.amountHalalas, 'SAR');
            const categoryInfo = CategoryLabels[tx.category] || CategoryLabels.other;
            const isIncome = tx.type === 'income' && !tx.isTransfer;
            const isTransfer = tx.isTransfer || tx.type === 'transfer';

            return (
              <div
                key={tx.id}
                className="py-3.5 px-2 flex items-center justify-between gap-3 hover:bg-slate-800/30 rounded-xl transition group"
              >
                {/* Left: Icon & Description */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isTransfer
                        ? 'bg-amber-500/10 text-amber-400'
                        : isIncome
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {isTransfer ? (
                      <ArrowLeftRight className="w-4 h-4" />
                    ) : isIncome ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">
                        {tx.description}
                      </span>
                      {isTransfer && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {lang === 'ar' ? 'تحويل مستبعد' : 'Transfer (Neutral)'}
                        </span>
                      )}
                      {tx.isRefund && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-500/10 text-teal-300 border border-teal-500/20">
                          {lang === 'ar' ? 'استرجاع مصروف' : 'Refund'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span>{lang === 'ar' ? categoryInfo.ar : categoryInfo.en}</span>
                      <span>•</span>
                      <span>{new Date(tx.date).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                        {getSourceIcon(tx.source)}
                        {tx.source.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div
                      className={`text-sm font-bold font-mono ${
                        isTransfer
                          ? 'text-amber-400'
                          : isIncome
                          ? 'text-emerald-400'
                          : 'text-white'
                      }`}
                    >
                      {isIncome ? '+' : isTransfer ? '' : '-'}
                      {formatMoney(money, { locale: lang, useSymbol: true })}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {tx.amountHalalas.toString()} Halalas
                    </div>
                  </div>

                  {/* Fingerprint indicator & Delete Action */}
                  <div className="flex items-center gap-1">
                    <span
                      title={`SHA-256 Fingerprint: ${tx.fingerprint}`}
                      className="p-1.5 text-slate-500 hover:text-slate-300 cursor-help"
                    >
                      <Fingerprint className="w-3.5 h-3.5" />
                    </span>
                    <button
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition rounded-lg hover:bg-rose-500/10 cursor-pointer"
                      title={lang === 'ar' ? 'حذف المعاملة' : 'Delete transaction'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
