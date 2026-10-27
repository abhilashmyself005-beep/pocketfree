'use client';

import React, { useState } from 'react';
import {
  PieChart,
  ShieldCheck,
  TrendingUp,
  Download,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Lock,
  Sparkles,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Transaction, CategoryLabels } from '@/core/transactions';
import { evaluateBudgets, CategoryBudget } from '@/core/budgets';
import {
  SAUDI_REGULATED_INVESTMENTS,
  REGULATORY_COMPLIANCE_DISCLOSURE,
} from '@/core/investments';
import { formatMoney, moneyFromHalalas } from '@/core/money';

interface BudgetAndPrivacyControlsProps {
  transactions: Transaction[];
  lang: 'en' | 'ar';
}

export const BudgetAndPrivacyControls: React.FC<BudgetAndPrivacyControlsProps> = ({
  transactions,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'budgets' | 'investments' | 'privacy'>('budgets');
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const budgetEvaluation = evaluateBudgets(transactions);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/privacy/export');
      if (!res.ok) throw new Error('Failed to generate export archive');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pocketfree_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error downloading data export.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleteError(null);
    try {
      const res = await fetch('/api/privacy/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmPhrase: deletePhrase.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deletion failed');
      setDeleteSuccess(data.message);
      setShowDeleteModal(false);
      setDeletePhrase('');
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Error executing deletion');
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-5">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('budgets')}
            type="button"
            className={`px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'budgets'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'الميزانيات والتوصيات' : 'Budgets & Insights'}</span>
          </button>
          <button
            onClick={() => setActiveTab('investments')}
            type="button"
            className={`px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'investments'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'فرص الادخار والاستثمار (صح)' : 'Regulated Sukuk & Savings'}</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            type="button"
            className={`px-3.5 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'الخصوصية وتصدير البيانات' : 'PDPL Privacy & Export'}</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Saudi PDPL Compliant</span>
        </div>
      </div>

      {deleteSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{deleteSuccess}</span>
        </div>
      )}

      {/* Tab 1: Budgets & Recommendations */}
      {activeTab === 'budgets' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {budgetEvaluation.categoryBudgets.slice(0, 6).map((b) => {
              const categoryInfo = CategoryLabels[b.category] || CategoryLabels.other;
              const isWarning = b.status === 'warning';
              const isExceeded = b.status === 'exceeded';

              return (
                <div
                  key={b.category}
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    isExceeded
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : isWarning
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">
                      {lang === 'ar' ? categoryInfo.ar : categoryInfo.en}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isExceeded
                          ? 'bg-rose-500/20 text-rose-300'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {b.spentPercentage}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExceeded
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(b.spentPercentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {lang === 'ar' ? 'المصروف: ' : 'Spent: '}
                      {formatMoney(moneyFromHalalas(b.spentHalalas), { locale: lang, useSymbol: true })}
                    </span>
                    <span>
                      {lang === 'ar' ? 'المتبقي: ' : 'Left: '}
                      {formatMoney(moneyFromHalalas(b.remainingHalalas), { locale: lang, useSymbol: true })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actionable Recommendations */}
          {budgetEvaluation.recommendations.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{lang === 'ar' ? 'توصيات ترشيد الميزانية الذكية' : 'Smart Budget Recommendations'}</span>
              </h4>
              <div className="space-y-2">
                {budgetEvaluation.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 text-xs text-slate-300 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-white">{lang === 'ar' ? rec.title.ar : rec.title.en}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{lang === 'ar' ? rec.message.ar : rec.message.en}</p>
                    </div>
                    <span className="shrink-0 font-mono font-bold text-emerald-400 text-right">
                      +{formatMoney(moneyFromHalalas(rec.potentialMonthlySavingsHalalas), { locale: lang, useSymbol: true })}
                      <div className="text-[9px] text-slate-500 font-sans">
                        {lang === 'ar' ? 'وفر شهري متوقع' : '/month'}
                      </div>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Regulated Investments Discovery */}
      {activeTab === 'investments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {SAUDI_REGULATED_INVESTMENTS.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {inv.regulator} Regulated
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {inv.indicativeAnnualYield}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{lang === 'ar' ? inv.name.ar : inv.name.en}</h4>
                  <p className="text-xs text-slate-400">{lang === 'ar' ? inv.description.ar : inv.description.en}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{lang === 'ar' ? inv.liquidity.ar : inv.liquidity.en}</span>
                  <a
                    href={inv.officialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                  >
                    <span>{lang === 'ar' ? 'الجهة الرسمية' : 'Official Portal'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Compliance Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            {lang === 'ar' ? REGULATORY_COMPLIANCE_DISCLOSURE.ar : REGULATORY_COMPLIANCE_DISCLOSURE.en}
          </div>
        </div>
      )}

      {/* Tab 3: PDPL Privacy Controls, Export & Account Deletion */}
      {activeTab === 'privacy' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Card */}
            <div className="p-4 sm:p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">
                  {lang === 'ar' ? 'تصدير البيانات الشخصية (JSON)' : 'Complete Data Export (JSON)'}
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === 'ar'
                  ? 'حق نقل البيانات وفق نظام حماية البيانات الشخصية السعودي (PDPL). يمكنك تحميل نسختك الكاملة بنقرة واحدة.'
                  : 'Download 100% of your transactions, accounts, and receipt references in a standardized, machine-readable JSON format.'}
              </p>
              <button
                onClick={handleExportData}
                disabled={isExporting}
                type="button"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Generating JSON...' : 'Export All Records (JSON)'}</span>
              </button>
            </div>

            {/* Deletion Card */}
            <div className="p-4 sm:p-5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-3">
              <div className="flex items-center gap-2 text-rose-400">
                <Trash2 className="w-5 h-5" />
                <h4 className="text-sm font-bold text-white">
                  {lang === 'ar' ? 'حذف الحساب والبيانات نهائياً' : 'Permanent Account & Data Erasure'}
                </h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {lang === 'ar'
                  ? 'الحق في المسح والإتلاف. يتم حذف كافة السجلات المالية، الفواتير المشفرة في R2، وبصمات المعاملات بصورة نهائية لا رجعة فيها.'
                  : 'Permanently destroy all financial records, encrypted R2 receipts, and tenant sessions. This action cannot be reversed.'}
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                type="button"
                className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-semibold border border-rose-500/40 transition flex items-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'طلب الحذف الكامل' : 'Initiate Permanent Erasure'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/40 p-6 space-y-4 text-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span>Confirm Permanent Data Erasure</span>
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {deleteError && (
              <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/30">
                {deleteError}
              </p>
            )}

            <p className="text-xs text-slate-400 leading-relaxed">
              To permanently erase your tenant account, transaction history, and encrypted receipt objects in compliance with Saudi PDPL, type <strong className="text-white font-mono">DELETE MY DATA</strong> below:
            </p>

            <input
              type="text"
              placeholder="DELETE MY DATA"
              value={deletePhrase}
              onChange={(e) => setDeletePhrase(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-rose-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                Permanently Delete All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
