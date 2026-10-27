'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Layers,
  Target,
  MessageSquareCode,
  Flame,
  ShoppingBag,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CreditCard,
  QrCode,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Receipt,
  Search,
  Settings,
  Bell,
  PiggyBank,
  ChevronDown,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import {
  Transaction,
  SpendVsIncomeAnalysis,
} from '@/core/transactions';
import { formatMoney, moneyFromHalalas } from '@/core/money';
import {
  parseSaudiBankSmsAlert,
  createTransactionFromParsedSms,
  SAMPLE_SAUDI_BANK_SMS,
} from '@/core/banking/smsAlertParser';
import { ZeroBasedBudgetHub } from './ZeroBasedBudgetHub';
import { FinArtExpenseTracker } from './FinArtExpenseTracker';
import { SmartShoppingOptimizer } from './SmartShoppingOptimizer';
import { BudgetAndPrivacyControls } from './BudgetAndPrivacyControls';
import { ReceiptUploader } from './ReceiptUploader';
import { BankStatementImporter } from './BankStatementImporter';

export type MobileNavTab = 'home' | 'envelopes' | 'targets' | 'alerts' | 'streaks' | 'shopping' | 'more';

interface MobileAppShellProps {
  transactions: Transaction[];
  analysis: SpendVsIncomeAnalysis;
  onAddTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onImportTransactions: (txs: Transaction[]) => void;
  onOpenAddModal: () => void;
  lang: 'en' | 'ar';
  onToggleLang: () => void;
}

export const MobileAppShell: React.FC<MobileAppShellProps> = ({
  transactions,
  analysis,
  onAddTransaction,
  onDeleteTransaction,
  onImportTransactions,
  onOpenAddModal,
  lang,
  onToggleLang,
}) => {
  const [activeTab, setActiveTab] = useState<MobileNavTab>('home');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [smsToast, setSmsToast] = useState<string | null>(null);

  const handleHomePasteSms = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const parsed = parseSaudiBankSmsAlert(text);
        if (parsed && !parsed.isOtp) {
          const tx = createTransactionFromParsedSms(parsed);
          onAddTransaction(tx);
          setSmsToast(
            lang === 'ar'
              ? `⚡ تم استخراج المعاملة وقيدها تلقائياً: ${formatMoney(moneyFromHalalas(parsed.amountHalalas))} لدى ${parsed.merchant}`
              : `⚡ Auto-Logged from SMS: ${formatMoney(moneyFromHalalas(parsed.amountHalalas))} at ${parsed.merchant}`
          );
          setTimeout(() => setSmsToast(null), 4000);
          return;
        }
      }
      setActiveTab('alerts');
    } catch {
      setActiveTab('alerts');
    }
  };

  const handleHomeTestSms = (sampleIndex = 0) => {
    const sample = SAMPLE_SAUDI_BANK_SMS[sampleIndex % SAMPLE_SAUDI_BANK_SMS.length];
    const parsed = parseSaudiBankSmsAlert(sample.smsText);
    if (parsed) {
      const tx = createTransactionFromParsedSms(parsed);
      onAddTransaction(tx);
      setSmsToast(
        lang === 'ar'
          ? `⚡ تم قيد إشعار بنكي تجريبي: ${formatMoney(moneyFromHalalas(parsed.amountHalalas))} لدى ${parsed.merchant}`
          : `⚡ Sample Alert Logged: ${formatMoney(moneyFromHalalas(parsed.amountHalalas))} at ${parsed.merchant}`
      );
      setTimeout(() => setSmsToast(null), 4000);
    }
  };

  const isPositiveCashflow = analysis.netCashflow.amountHalalas >= 0n;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24 max-w-md mx-auto relative shadow-2xl border-x border-slate-800/80">
      {/* 1. Mobile Status & App Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-xs shadow-md shadow-emerald-500/20">
            PF
          </div>
          <div>
            <div className="flex items-center gap-1 cursor-pointer">
              <span className="text-sm font-black tracking-tight text-white">October 2026</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Household • Riyadh, KSA</p>
          </div>
        </div>

        {/* Quick Header Actions */}
        <div className="flex items-center gap-2">
          {/* Streak Flame Badge */}
          <button
            onClick={() => setActiveTab('streaks')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25 transition cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" />
            <span className="text-xs font-bold">12</span>
          </button>

          {/* Lang Toggle */}
          <button
            onClick={onToggleLang}
            className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300"
          >
            {lang === 'en' ? 'AR' : 'EN'}
          </button>

          {/* Alerts Bell */}
          <button
            onClick={() => setActiveTab('alerts')}
            className="p-1.5 rounded-lg bg-slate-850 text-slate-300 hover:text-white transition relative"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </button>
        </div>
      </header>

      {/* 2. Main Mobile Screen Viewport */}
      <main className="flex-1 p-4 space-y-4">
        {/* ========================================================= */}
        {/* TAB: HOME (Mobile Executive Dashboard)                   */}
        {/* ========================================================= */}
        {activeTab === 'home' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Primary Net Worth / Cashflow Card */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-white/10 p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>{lang === 'ar' ? 'صافي التدفق المالي للشهر' : 'Net Monthly Cashflow'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Halala-Exact
                </span>
              </div>

              <div className="text-3xl font-black text-white tracking-tight my-1">
                {formatMoney(analysis.netCashflow, { locale: lang, useSymbol: true })}
              </div>

              {/* Income vs Expenses Mini-Row */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Income</span>
                    <strong className="text-white font-mono">
                      {formatMoney(analysis.totalIncome)}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Spend</span>
                    <strong className="text-white font-mono">
                      {formatMoney(analysis.totalExpenses)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Beyond Budget Spent Progress & Financial Health Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Spent / Allocated Card */}
              <div
                onClick={() => setActiveTab('envelopes')}
                className="rounded-xl bg-white/[0.03] border border-white/10 p-3.5 space-y-2 cursor-pointer hover:bg-white/[0.05] transition"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold uppercase tracking-wider">Spent / Allocated</span>
                  <span className="text-blue-400 font-bold">60%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-sky-400 w-[60%]" />
                </div>
                <p className="text-[11px] text-slate-300 font-medium truncate">
                  View Beyond Budget Envelopes →
                </p>
              </div>

              {/* Health Score Circle 75 */}
              <div
                onClick={() => setActiveTab('envelopes')}
                className="rounded-xl bg-white/[0.03] border border-white/10 p-3.5 flex items-center gap-3 cursor-pointer hover:bg-white/[0.05] transition"
              >
                <div className="w-11 h-11 rounded-full bg-blue-500/15 border-2 border-blue-400 flex items-center justify-center flex-shrink-0 text-blue-400 font-extrabold text-base shadow-sm">
                  75
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Health Score</span>
                  <strong className="text-xs text-white">Optimal 📌</strong>
                  <span className="text-[10px] text-slate-400 block truncate">On target</span>
                </div>
              </div>
            </div>

            {/* Quick Mobile Action Bar */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={onOpenAddModal}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white transition group"
              >
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold mt-1">Add Cash</span>
              </button>

              <button
                onClick={() => setShowReceiptModal(true)}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 text-slate-300 hover:text-white transition group"
              >
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold mt-1">Scan Receipt</span>
              </button>

              <button
                onClick={() => setActiveTab('alerts')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-white transition group"
              >
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition">
                  <MessageSquareCode className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold mt-1">Bank SMS</span>
              </button>

              <button
                onClick={() => setActiveTab('envelopes')}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-slate-300 hover:text-white transition group"
              >
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold mt-1">Envelopes</span>
              </button>
            </div>

            {/* Global SMS Toast Banner */}
            {smsToast && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in shadow-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{smsToast}</span>
              </div>
            )}

            {/* Quick Bank SMS Auto-Tracker Card */}
            <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/25 p-3.5 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <MessageSquareCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {lang === 'ar' ? 'المتتبع الآلي للإشعارات البنكية' : 'Bank SMS Alert Auto-Tracker'}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {lang === 'ar' ? 'انسخ أي إشعار بنكي من هاتفك واضغط للصق الفوري' : 'Copy any bank SMS alert and 1-tap paste to log'}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  FinArt Engine
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleHomePasteSms}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 transition cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{lang === 'ar' ? '📋 لصق من الحافظة' : '📋 Paste from Clipboard'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleHomeTestSms(0)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition cursor-pointer active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'ar' ? '⚡ تجربة إشعار فوري' : '⚡ Test 1-Tap Sample'}</span>
                </button>
              </div>
            </div>

            {/* Sinking Funds / Targets Quick Teaser */}
            <div
              onClick={() => setActiveTab('targets')}
              className="rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/20 p-4 flex items-center justify-between cursor-pointer hover:bg-slate-850 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {lang === 'ar' ? 'الأهداف المالية وصناديق التوفير' : 'Targets & Sinking Funds'}
                  </h4>
                  <p className="text-[11px] text-slate-400">401(k) Boost reached • Yellowstone in progress</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Recent Transactions Mobile List */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider">
                  {lang === 'ar' ? 'آخر المعاملات' : 'Recent Activity'}
                </span>
                <span className="text-slate-400">{transactions.length} records</span>
              </div>

              <div className="space-y-2">
                {transactions.slice(0, 5).map((tx) => {
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';

                  return (
                    <div
                      key={tx.id}
                      className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 flex items-center justify-between hover:bg-slate-850 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : isTransfer
                              ? 'bg-purple-500/10 text-purple-400'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isIncome ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white truncate max-w-[180px]">
                            {tx.description}
                          </p>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {tx.category} • {new Date(tx.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-mono font-bold ${
                            isIncome
                              ? 'text-emerald-400'
                              : isTransfer
                              ? 'text-purple-400'
                              : 'text-slate-200'
                          }`}
                        >
                          {isIncome ? '+' : isTransfer ? '' : '-'}
                          {formatMoney(moneyFromHalalas(tx.amountHalalas))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: ENVELOPES (Beyond Budget Zero-Based Hub)             */}
        {/* ========================================================= */}
        {activeTab === 'envelopes' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <ZeroBasedBudgetHub
              totalIncomeHalalas={analysis.totalIncome.amountHalalas > 0n ? analysis.totalIncome.amountHalalas : 2450000n}
              lang={lang}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: ALERTS & BILLS (FinArt Automatic SMS Hub)            */}
        {/* ========================================================= */}
        {activeTab === 'alerts' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <FinArtExpenseTracker onAddTransaction={onAddTransaction} lang={lang} />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: TARGETS & SINKING FUNDS                              */}
        {/* ========================================================= */}
        {activeTab === 'targets' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <ZeroBasedBudgetHub
              totalIncomeHalalas={analysis.totalIncome.amountHalalas > 0n ? analysis.totalIncome.amountHalalas : 2450000n}
              lang={lang}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: STREAKS & HABIT (Beyond Budget Gamification)         */}
        {/* ========================================================= */}
        {activeTab === 'streaks' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <ZeroBasedBudgetHub
              totalIncomeHalalas={analysis.totalIncome.amountHalalas > 0n ? analysis.totalIncome.amountHalalas : 2450000n}
              lang={lang}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: SHOPPING & DEALS                                     */}
        {/* ========================================================= */}
        {activeTab === 'shopping' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <SmartShoppingOptimizer lang={lang} />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: MORE & PRIVACY CONTROLS                              */}
        {/* ========================================================= */}
        {activeTab === 'more' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-1 hover:border-slate-700 transition"
              >
                <CreditCard className="w-5 h-5 text-sky-400" />
                <h5 className="text-xs font-bold text-white">Import Statement</h5>
                <p className="text-[10px] text-slate-400">CSV/QIF bank export</p>
              </button>

              <button
                onClick={() => setShowReceiptModal(true)}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-1 hover:border-slate-700 transition"
              >
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h5 className="text-xs font-bold text-white">Scan ZATCA</h5>
                <p className="text-[10px] text-slate-400">OCR Receipt Parser</p>
              </button>
            </div>

            <BudgetAndPrivacyControls transactions={transactions} lang={lang} />
          </div>
        )}
      </main>

      {/* 3. Native Mobile Docked Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 shadow-2xl max-w-md mx-auto"
      >
        <div className="flex items-center justify-around">
          {/* Tab: Home */}
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
              activeTab === 'home' ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] mt-0.5">{lang === 'ar' ? 'الرئيسية' : 'Home'}</span>
          </button>

          {/* Tab: Envelopes (Beyond Budget) */}
          <button
            onClick={() => setActiveTab('envelopes')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
              activeTab === 'envelopes' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[9px] mt-0.5">{lang === 'ar' ? 'الظروف' : 'Envelopes'}</span>
          </button>

          {/* Center Floating Action Button: Add Entry */}
          <button
            onClick={onOpenAddModal}
            className="flex flex-col items-center justify-center -mt-6 p-3.5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-500/40 active:scale-90 transition-all border-4 border-slate-950 cursor-pointer"
            title="Add Cash or Transaction"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Tab: Alerts (FinArt) */}
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
              activeTab === 'alerts' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquareCode className="w-5 h-5" />
            <span className="text-[9px] mt-0.5">{lang === 'ar' ? 'الإشعارات' : 'Alerts'}</span>
          </button>

          {/* Tab: Shopping */}
          <button
            onClick={() => setActiveTab('shopping')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
              activeTab === 'shopping' ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[9px] mt-0.5">{lang === 'ar' ? 'التسوق' : 'Deals'}</span>
          </button>

          {/* Tab: More */}
          <button
            onClick={() => setActiveTab('more')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition ${
              activeTab === 'more' ? 'text-purple-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[9px] mt-0.5">{lang === 'ar' ? 'المزيد' : 'More'}</span>
          </button>
        </div>
      </nav>

      {/* OCR Receipt Upload Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4">
            <ReceiptUploader onAddTransaction={onAddTransaction} lang={lang} />
            <button
              onClick={() => setShowReceiptModal(false)}
              className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Bank Statement Importer Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl space-y-4">
            <BankStatementImporter
              existingTransactions={transactions}
              onImportTransactions={onImportTransactions}
              lang={lang}
            />
            <button
              onClick={() => setShowImportModal(false)}
              className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
