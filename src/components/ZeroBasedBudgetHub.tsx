'use client';

import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  ShieldCheck,
  TrendingDown,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Home,
  ShoppingBasket,
  Zap,
  Utensils,
  Shield,
  HelpCircle,
  Calendar,
  Calculator,
} from 'lucide-react';
import {
  Envelope,
  DebtItem,
  INITIAL_ENVELOPES,
  INITIAL_DEBTS,
  calculateReadyToAssign,
  moveMoneyBetweenEnvelopes,
  calculateDebtPayoff,
} from '@/core/budgets/zeroBasedEngine';
import { formatMoney, moneyFromHalalas } from '@/core/money';

interface ZeroBasedBudgetHubProps {
  totalIncomeHalalas?: bigint;
  lang: 'en' | 'ar';
}

export const ZeroBasedBudgetHub: React.FC<ZeroBasedBudgetHubProps> = ({
  totalIncomeHalalas = 2450000n, // 24,500.00 SAR default
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'envelopes' | 'debt'>('envelopes');
  const [envelopes, setEnvelopes] = useState<Envelope[]>(INITIAL_ENVELOPES);
  const [debts, setDebts] = useState<DebtItem[]>(INITIAL_DEBTS);
  const [extraDebtPayoff, setExtraDebtPayoff] = useState<number>(500); // 500 SAR extra/month
  const [transferModal, setTransferModal] = useState<{
    targetEnvelopeId: string;
    overspentHalalas: bigint;
  } | null>(null);
  const [selectedDonorId, setSelectedDonorId] = useState<string>('env_groceries');
  const [notification, setNotification] = useState<string | null>(null);

  const readyToAssign = calculateReadyToAssign(totalIncomeHalalas, envelopes);

  const getEnvelopeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home':
        return <Home className="w-4 h-4 text-sky-400" />;
      case 'ShoppingBasket':
        return <ShoppingBasket className="w-4 h-4 text-emerald-400" />;
      case 'Zap':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'Utensils':
        return <Utensils className="w-4 h-4 text-orange-400" />;
      case 'Shield':
        return <Shield className="w-4 h-4 text-purple-400" />;
      case 'TrendingDown':
        return <TrendingDown className="w-4 h-4 text-rose-400" />;
      default:
        return <Layers className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleAdjustAllocation = (id: string, deltaHalalas: bigint) => {
    setEnvelopes((prev) =>
      prev.map((env) => {
        if (env.id === id) {
          const next = env.allocatedHalalas + deltaHalalas;
          return {
            ...env,
            allocatedHalalas: next < 0n ? 0n : next,
          };
        }
        return env;
      })
    );
  };

  const handleAutoFillTargets = () => {
    setEnvelopes((prev) =>
      prev.map((env) => ({
        ...env,
        allocatedHalalas: env.targetHalalas,
      }))
    );
    setNotification(
      lang === 'ar'
        ? '✓ تم تمويل جميع المظاريف وفق الأهداف المحددة'
        : '✓ All envelopes funded to target amounts'
    );
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExecuteTransfer = () => {
    if (!transferModal) return;
    const { targetEnvelopeId, overspentHalalas } = transferModal;

    const updated = moveMoneyBetweenEnvelopes(
      selectedDonorId,
      targetEnvelopeId,
      overspentHalalas,
      envelopes
    );

    setEnvelopes(updated);
    setTransferModal(null);
    setNotification(
      lang === 'ar'
        ? `✓ تم تغطية العجز بنجاح من المظروف المانح`
        : `✓ Overspending covered successfully from selected envelope`
    );
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Beyond Budget Header Banner */}
      <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'نمط Beyond Budget' : 'Beyond Budget Philosophy'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              {lang === 'ar' ? 'الميزانية الصفرية: خصص كل ريال لمهمة' : 'Zero-Based: Give Every Riyal A Job'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {lang === 'ar'
              ? 'مظاريف الميزانية الصفرية ومسرّع سداد الديون'
              : 'Zero-Based Envelope Envelopes & Debt Snowball Hub'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {lang === 'ar'
              ? 'توزيع دخل الشهر بالكامل حتى يصبح المتبقي صفر ر.س، مع نقل الأموال بين المظاريف وحساب تسريع سداد القروض.'
              : 'Allocate every earned Halala into purpose-built envelopes with overspending coverage and debt payoff modeling.'}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('envelopes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'envelopes'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'المظاريف الرقمية' : 'Digital Envelopes'}
          </button>
          <button
            onClick={() => setActiveTab('debt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'debt'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'مسرّع سداد القروض' : 'Debt Snowball'}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          {notification}
        </div>
      )}

      {/* Tab 1: Envelopes Engine */}
      {activeTab === 'envelopes' && (
        <div className="p-6 space-y-6">
          {/* Ready to Assign Status Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400">
                {lang === 'ar' ? 'المبلغ المتاح للتعيين في المظاريف' : 'Ready to Assign to Envelopes'}
              </span>
              <div className="flex items-baseline gap-3">
                <span
                  className={`text-2xl font-extrabold font-mono ${
                    readyToAssign === 0n
                      ? 'text-emerald-400'
                      : readyToAssign > 0n
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {formatMoney(moneyFromHalalas(readyToAssign))}
                </span>
                <span className="text-xs text-slate-400 font-sans">
                  {readyToAssign === 0n
                    ? lang === 'ar'
                      ? '✓ الميزانية مثالية (كل ريال له مهمة)'
                      : '✓ All funds assigned (Zero-Based Mastered)'
                    : readyToAssign > 0n
                    ? lang === 'ar'
                      ? 'قم بتوزيع الفائض على الادخار أو سداد الديون'
                      : 'Assign surplus to savings or debt snowball'
                    : lang === 'ar'
                    ? 'تجاوز في التخصيص، يرجى تقليص المبالغ'
                    : 'Over-allocated! Reduce envelope budgets'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoFillTargets}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                {lang === 'ar' ? 'ملء الأهداف تلقائياً' : 'Auto-Fill Targets'}
              </button>
            </div>
          </div>

          {/* Envelopes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {envelopes.map((env) => {
              const remainingHalalas = env.allocatedHalalas - env.spentHalalas;
              const isOverspent = remainingHalalas < 0n;
              const percentSpent =
                env.allocatedHalalas > 0n
                  ? Math.min(
                      100,
                      Math.round(
                        (Number(env.spentHalalas) / Number(env.allocatedHalalas)) *
                          100
                      )
                    )
                  : 100;

              return (
                <div
                  key={env.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isOverspent
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        {getEnvelopeIcon(env.iconName)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          {lang === 'ar' ? env.nameAr : env.name}
                        </h4>
                        <span className="text-[11px] text-slate-400">
                          {lang === 'ar' ? 'الهدف: ' : 'Target: '}
                          {formatMoney(moneyFromHalalas(env.targetHalalas))}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">
                        {lang === 'ar' ? 'المتبقي' : 'Available'}
                      </span>
                      <span
                        className={`text-sm font-bold font-mono ${
                          isOverspent ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {formatMoney(moneyFromHalalas(remainingHalalas))}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 my-3">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>
                        {lang === 'ar' ? 'المصروف: ' : 'Spent: '}
                        {formatMoney(moneyFromHalalas(env.spentHalalas))}
                      </span>
                      <span>
                        {lang === 'ar' ? 'المخصص: ' : 'Allocated: '}
                        {formatMoney(moneyFromHalalas(env.allocatedHalalas))}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isOverspent
                            ? 'bg-rose-500'
                            : percentSpent > 85
                            ? 'bg-amber-400'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percentSpent}%` }}
                      />
                    </div>
                  </div>

                  {/* Envelope Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    {isOverspent ? (
                      <button
                        onClick={() =>
                          setTransferModal({
                            targetEnvelopeId: env.id,
                            overspentHalalas: -remainingHalalas,
                          })
                        }
                        className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 underline underline-offset-2"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        {lang === 'ar' ? 'تغطية العجز من مظروف آخر' : 'Cover Overspending'}
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        {percentSpent}% {lang === 'ar' ? 'مستهلك' : 'used'}
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleAdjustAllocation(env.id, -10000n)} // -100 SAR
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="-100 SAR"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleAdjustAllocation(env.id, 10000n)} // +100 SAR
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="+100 SAR"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cover Overspending Modal */}
          {transferModal && (
            <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/40 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <ArrowRightLeft className="w-4 h-4" />
                {lang === 'ar'
                  ? 'تغطية العجز المالي (Beyond Budget Rule 3)'
                  : 'Cover Overspending From Another Envelope'}
              </div>
              <p className="text-xs text-slate-300">
                {lang === 'ar'
                  ? `العجز المطلوب تغطيته: ${formatMoney(
                      moneyFromHalalas(transferModal.overspentHalalas)
                    )}. اختر المظروف الذي تريد نقل الفائض منه:`
                  : `Amount needed: ${formatMoney(
                      moneyFromHalalas(transferModal.overspentHalalas)
                    )}. Select an envelope with available funds to cover it:`}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedDonorId}
                  onChange={(e) => setSelectedDonorId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  {envelopes
                    .filter(
                      (e) =>
                        e.id !== transferModal.targetEnvelopeId &&
                        e.allocatedHalalas - e.spentHalalas > 0n
                    )
                    .map((donor) => (
                      <option key={donor.id} value={donor.id}>
                        {lang === 'ar' ? donor.nameAr : donor.name} (
                        {formatMoney(
                          moneyFromHalalas(
                            donor.allocatedHalalas - donor.spentHalalas
                          )
                        )}{' '}
                        available)
                      </option>
                    ))}
                </select>

                <button
                  onClick={handleExecuteTransfer}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
                >
                  {lang === 'ar' ? 'تأكيد النقل' : 'Confirm Reallocation'}
                </button>
                <button
                  onClick={() => setTransferModal(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Debt Snowball & Accelerated Payoff Calculator */}
      {activeTab === 'debt' && (
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                {lang === 'ar' ? 'مسرّع سداد الديون والتمويل (Debt Snowball)' : 'Debt Snowball & Murabaha Payoff Engine'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'ar'
                  ? 'محاكاة تأثير الدفعات الإضافية الشهرية على تقليص أشهر السداد وتوفير هوامش الربح والفوائد'
                  : 'Simulate how extra monthly payments shorten loan payoff months and reduce interest.'}
              </p>
            </div>

            {/* Extra Payment Slider */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 min-w-[240px]">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">{lang === 'ar' ? 'دفعة شهرية إضافية' : 'Extra Monthly Payoff'}</span>
                <span className="font-bold text-emerald-400 font-mono">+{extraDebtPayoff} SAR</span>
              </div>
              <input
                type="range"
                min="0"
                max="3000"
                step="100"
                value={extraDebtPayoff}
                onChange={(e) => setExtraDebtPayoff(parseInt(e.target.value, 10))}
                className="w-full accent-purple-500"
              />
            </div>
          </div>

          {/* Debt Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debts.map((debt) => {
              const baseline = calculateDebtPayoff(
                debt.principalHalalas,
                debt.monthlyMinimumHalalas,
                debt.interestApr
              );

              const accelerated = calculateDebtPayoff(
                debt.principalHalalas,
                debt.monthlyMinimumHalalas + BigInt(extraDebtPayoff * 100),
                debt.interestApr
              );

              const monthsSaved = Math.max(
                0,
                baseline.monthsToPayoff - accelerated.monthsToPayoff
              );
              const moneySavedHalalas =
                baseline.estimatedCostHalalas - accelerated.estimatedCostHalalas;

              return (
                <div
                  key={debt.id}
                  className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">
                          {lang === 'ar' ? debt.nameAr : debt.name}
                        </h4>
                        {debt.isIslamicFinancing && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            {lang === 'ar' ? 'تمويل مرابحة إسلامي' : 'Islamic Murabaha'}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        {debt.creditor} • {debt.interestApr}% APR / Profit Rate
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">{lang === 'ar' ? 'أصل التمويل' : 'Principal'}</span>
                      <span className="text-base font-bold text-white font-mono">
                        {formatMoney(moneyFromHalalas(debt.principalHalalas))}
                      </span>
                    </div>
                  </div>

                  {/* Payoff Simulation Metrics */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">
                        {lang === 'ar' ? 'مدة السداد المتوقعة' : 'Months to Debt-Free'}
                      </span>
                      <span className="text-lg font-extrabold text-emerald-400 font-mono">
                        {accelerated.monthsToPayoff} {lang === 'ar' ? 'شهر' : 'mos'}
                      </span>
                      {monthsSaved > 0 && (
                        <span className="text-[10px] text-emerald-300 block">
                          ✓ {lang === 'ar' ? `وفرت ${monthsSaved} شهراً` : `${monthsSaved} months faster!`}
                        </span>
                      )}
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">
                        {lang === 'ar' ? 'الأقساط الشهرية' : 'Total Monthly Payment'}
                      </span>
                      <span className="text-lg font-extrabold text-white font-mono">
                        {formatMoney(
                          moneyFromHalalas(
                            debt.monthlyMinimumHalalas + BigInt(extraDebtPayoff * 100)
                          )
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Min: {formatMoney(moneyFromHalalas(debt.monthlyMinimumHalalas))}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
