'use client';

import React from 'react';
import { SpendVsIncomeAnalysis } from '@/core/transactions';
import { formatMoney } from '@/core/money';
import { ArrowDownRight, ArrowUpRight, PiggyBank, Percent, Info, ShieldCheck } from 'lucide-react';

interface FinanceOverviewProps {
  analysis: SpendVsIncomeAnalysis;
  lang: 'en' | 'ar';
}

export const FinanceOverview: React.FC<FinanceOverviewProps> = ({ analysis, lang }) => {
  const isPositiveCashflow = analysis.netCashflow.amountHalalas >= 0n;

  return (
    <div className="space-y-4">
      {/* Top Banner: Tenant Isolation & Compliance Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            {lang === 'ar' ? 'جلسة العميل المعزولة: ' : 'Isolated Tenant Session: '}
            <strong className="text-slate-200 font-mono">Tariq Al-Mansoor (user_dev_saudi_pilot_01)</strong>
          </span>
        </div>
        {analysis.excludedTransfersCount > 0 && (
          <div className="flex items-center gap-1.5 text-amber-400/90 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
            <Info className="w-3.5 h-3.5" />
            <span>
              {lang === 'ar'
                ? `تم استبعاد ${analysis.excludedTransfersCount} تحويل داخلي لمنع الازدواج المالي`
                : `${analysis.excludedTransfersCount} internal transfer excluded from spend to prevent double-counting`}
            </span>
          </div>
        )}
      </div>

      {/* Grid of Key Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-sm font-medium mb-2">
            <span>{lang === 'ar' ? 'إجمالي الدخل' : 'Total Income'}</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white">
            {formatMoney(analysis.totalIncome, { locale: lang, useSymbol: true })}
          </div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
            <span>{lang === 'ar' ? 'رواتب واستثمارات ومصادر نقدية' : 'Salaries, freelance & cash deposits'}</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-sm font-medium mb-2">
            <span>{lang === 'ar' ? 'إجمالي المصروفات' : 'Total Spend'}</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white">
            {formatMoney(analysis.totalExpenses, { locale: lang, useSymbol: true })}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span>{lang === 'ar' ? 'سكن ومشتريات وفواتير' : 'Housing, dining & groceries'}</span>
          </div>
        </div>

        {/* Net Cashflow */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-sm font-medium mb-2">
            <span>{lang === 'ar' ? 'صافي التدفق المالي' : 'Net Cashflow'}</span>
            <div
              className={`p-2 rounded-xl ${
                isPositiveCashflow ? 'bg-teal-500/10 text-teal-400' : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-bold tracking-tight ${
              isPositiveCashflow ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {formatMoney(analysis.netCashflow, { locale: lang, useSymbol: true })}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {isPositiveCashflow
              ? lang === 'ar'
                ? 'فائض مالي متاح للادخار'
                : 'Surplus cash available for savings'
              : lang === 'ar'
              ? 'عجز مالي - يتطلب ترشيد'
              : 'Deficit spend - review budget'}
          </div>
        </div>

        {/* Savings Rate */}
        <div className="glass-card glass-card-hover p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-sm font-medium mb-2">
            <span>{lang === 'ar' ? 'معدل الادخار' : 'Savings Rate'}</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-white">
            {analysis.savingsRatePercentage}%
          </div>
          <div className="mt-2 text-xs text-indigo-300">
            {analysis.savingsRatePercentage >= 20
              ? lang === 'ar'
                ? 'ممتاز • أعلى من الهدف الوطني (20%)'
                : 'Excellent • Above national target (20%)'
              : lang === 'ar'
              ? 'أقل من الهدف الاسترشادي'
              : 'Below suggested benchmark'}
          </div>
        </div>
      </div>
    </div>
  );
};
