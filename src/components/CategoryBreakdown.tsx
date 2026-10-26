'use client';

import React from 'react';
import { SpendVsIncomeAnalysis, CategoryLabels } from '@/core/transactions';
import { formatMoney } from '@/core/money';
import { PieChart } from 'lucide-react';

interface CategoryBreakdownProps {
  analysis: SpendVsIncomeAnalysis;
  lang: 'en' | 'ar';
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ analysis, lang }) => {
  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-400" />
          <span>{lang === 'ar' ? 'توزيع المصروفات حسب التصنيف' : 'Spend by Category'}</span>
        </h3>
        <span className="text-xs text-slate-400">
          {analysis.categoryBreakdown.length} {lang === 'ar' ? 'تصنيفات نشطة' : 'active categories'}
        </span>
      </div>

      {analysis.categoryBreakdown.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          {lang === 'ar' ? 'لا توجد مصروفات مسجلة بعد' : 'No expenses recorded yet'}
        </div>
      ) : (
        <div className="space-y-3.5">
          {analysis.categoryBreakdown.map((item) => {
            const categoryInfo = CategoryLabels[item.category] || CategoryLabels.other;
            return (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">
                    {lang === 'ar' ? categoryInfo.ar : categoryInfo.en}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-300 font-semibold">
                      {formatMoney(item.total, { locale: lang, useSymbol: true })}
                    </span>
                    <span className="text-[11px] text-slate-500">({item.percentage}%)</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
