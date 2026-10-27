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
  Flame,
  Bell,
  PiggyBank,
  MoreVertical,
  ChevronDown,
  Eye,
  Compass,
  Pin,
  Trophy,
  Car,
  Target,
  X,
  Clock,
  RefreshCw,
  Snowflake,
  Award,
  Check,
} from 'lucide-react';
import {
  Envelope,
  DebtItem,
  BudgetTarget,
  BillReminder,
  HabitStreakState,
  INITIAL_ENVELOPES,
  INITIAL_DEBTS,
  TOP_ALLOCATIONS,
  INITIAL_TARGETS,
  INITIAL_BILL_REMINDERS,
  INITIAL_HABIT_STREAK,
  calculateReadyToAssign,
  moveMoneyBetweenEnvelopes,
  calculateDebtPayoff,
} from '@/core/budgets/zeroBasedEngine';
import { formatMoney, moneyFromHalalas } from '@/core/money';

interface ZeroBasedBudgetHubProps {
  totalIncomeHalalas?: bigint;
  lang: 'en' | 'ar';
}

type BeyondBudgetTab = 'summary' | 'targets' | 'bills' | 'streaks' | 'debt';

export const ZeroBasedBudgetHub: React.FC<ZeroBasedBudgetHubProps> = ({
  totalIncomeHalalas = 2450000n, // 24,500.00 SAR default
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<BeyondBudgetTab>('summary');
  const [envelopes, setEnvelopes] = useState<Envelope[]>(INITIAL_ENVELOPES);
  const [debts, setDebts] = useState<DebtItem[]>(INITIAL_DEBTS);
  const [targets, setTargets] = useState<BudgetTarget[]>(INITIAL_TARGETS);
  const [bills, setBills] = useState<BillReminder[]>(INITIAL_BILL_REMINDERS);
  const [habitStreak, setHabitStreak] = useState<HabitStreakState>(INITIAL_HABIT_STREAK);
  const [extraDebtPayoff, setExtraDebtPayoff] = useState<number>(500); // 500 SAR extra/month
  const [showAllocationsDetail, setShowAllocationsDetail] = useState(true);

  // Transfer Modal
  const [transferModal, setTransferModal] = useState<{
    targetEnvelopeId: string;
    overspentHalalas: bigint;
  } | null>(null);
  const [selectedDonorId, setSelectedDonorId] = useState<string>('env_groceries');

  // New Target Modal
  const [showAddTargetModal, setShowAddTargetModal] = useState(false);
  const [newTargetName, setNewTargetName] = useState('');
  const [newTargetAmount, setNewTargetAmount] = useState('2000');

  // Notifications
  const [notification, setNotification] = useState<string | null>(null);

  const readyToAssign = calculateReadyToAssign(totalIncomeHalalas, envelopes);

  // Total allocated vs spent for Beyond Budget Progress Bar
  const totalAllocatedHalalas = envelopes.reduce((acc, env) => acc + env.allocatedHalalas, 0n);
  const totalSpentHalalas = envelopes.reduce((acc, env) => acc + env.spentHalalas, 0n);
  const budgetSpentPct = totalAllocatedHalalas > 0n
    ? Math.min(100, Math.round(Number(totalSpentHalalas * 100n / totalAllocatedHalalas)))
    : 0;

  const showNotificationMsg = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleExecuteTransfer = () => {
    if (!transferModal) return;
    const donorEnv = envelopes.find((e) => e.id === selectedDonorId);
    const targetEnv = envelopes.find((e) => e.id === transferModal.targetEnvelopeId);

    if (!donorEnv || !targetEnv) return;

    const donorAvailable = donorEnv.allocatedHalalas - donorEnv.spentHalalas;
    if (donorAvailable < transferModal.overspentHalalas) {
      showNotificationMsg(
        lang === 'ar'
          ? 'المبلغ المتوفر في هذا الظرف غير كافٍ لتغطية العجز'
          : 'Selected donor envelope does not have sufficient available funds.'
      );
      return;
    }

    const updated = moveMoneyBetweenEnvelopes(
      selectedDonorId,
      transferModal.targetEnvelopeId,
      transferModal.overspentHalalas,
      envelopes
    );

    setEnvelopes(updated);
    setTransferModal(null);
    showNotificationMsg(
      lang === 'ar'
        ? `تم تحويل ${formatMoney(moneyFromHalalas(transferModal.overspentHalalas))} بنجاح لتسوية العجز`
        : `Successfully covered ${formatMoney(moneyFromHalalas(transferModal.overspentHalalas))} from ${donorEnv.name}`
    );
  };

  const handlePayBill = (billId: string) => {
    setBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, isPaid: true } : b))
    );
    showNotificationMsg(
      lang === 'ar'
        ? 'تم تسجيل دفع الفاتورة بنجاح في الميزانية'
        : 'Bill marked as paid and synchronized with budget.'
    );
  };

  const handleAddTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetName.trim()) return;

    const amountHalalas = BigInt(Math.round(parseFloat(newTargetAmount || '0') * 100));
    const newTarget: BudgetTarget = {
      id: `target_${Date.now()}`,
      name: newTargetName,
      nameAr: newTargetName,
      category: 'custom',
      targetHalalas: amountHalalas,
      currentHalalas: 0n,
      status: 'in_progress',
      dueText: 'Open ended',
      iconName: 'Target',
    };

    setTargets((prev) => [newTarget, ...prev]);
    setShowAddTargetModal(false);
    setNewTargetName('');
    showNotificationMsg(
      lang === 'ar'
        ? `تمت إضافة الهدف الجديد "${newTargetName}" بنجاح`
        : `Target "${newTargetName}" added to tracker!`
    );
  };

  const handleToggleStreakFreeze = () => {
    if (habitStreak.freezesAvailable > 0) {
      setHabitStreak((prev) => ({
        ...prev,
        freezesAvailable: prev.freezesAvailable - 1,
        xp: prev.xp + 50,
      }));
      showNotificationMsg(
        lang === 'ar'
          ? 'تم تفعيل تجميد الاستمرارية وحماية سجلك لـ 24 ساعة (+50 XP)'
          : 'Streak freeze activated! Habit streak protected for 24h (+50 XP).'
      );
    } else {
      showNotificationMsg(
        lang === 'ar'
          ? 'لا يوجد تجميد متوفر حالياً. أكمل أسبوعاً كاملاً للحصول على تجميد إضافي'
          : 'No freezes available. Complete another perfect week to earn one!'
      );
    }
  };

  const handleCheckInToday = () => {
    setHabitStreak((prev) => ({
      ...prev,
      streakDays: prev.streakDays + 1,
      xp: prev.xp + 100,
      habitDayProgress: Math.min(66, prev.habitDayProgress + 1),
    }));
    showNotificationMsg(
      lang === 'ar'
        ? 'رائع! تم تسجيل نشاطك اليومي وزيادة الاستمرارية إلى 13 يوماً (+100 XP) 🔥'
        : "Awesome! Daily budget check-in logged: 13 days streak! (+100 XP) 🔥"
    );
  };

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

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/95 overflow-hidden shadow-2xl relative">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* 1. Beyond Budget Native Mobile-Style App Bar */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition">
              <span className="text-sm font-bold text-white tracking-tight">October 2026</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>Household</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium">Beyond Budget Planner</span>
            </p>
          </div>
        </div>

        {/* Top Header Actions (Piggy, Streak Flame, Bell, 3-Dots) */}
        <div className="flex items-center gap-2">
          {/* Streak Flame Counter */}
          <button
            onClick={() => setActiveTab('streaks')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25 transition cursor-pointer"
            title="Beyond Budget Streak Tracker"
          >
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" />
            <span className="text-xs font-bold">{habitStreak.streakDays}</span>
          </button>

          {/* Quick Targets Piggy */}
          <button
            onClick={() => setActiveTab('targets')}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            title="Targets & Goals"
          >
            <PiggyBank className="w-4 h-4 text-sky-400" />
          </button>

          {/* Bill Reminders Bell */}
          <button
            onClick={() => setActiveTab('bills')}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer relative"
            title="Bill Reminders"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs (Overview, Targets, Bills, Streaks, Debt) */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-2 border-b border-slate-800 overflow-x-auto scrollbar-none bg-slate-900/40">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'summary'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{lang === 'ar' ? 'ملخص الميزانية والظروف' : 'Budget Summary & Envelopes'}</span>
        </button>

        <button
          onClick={() => setActiveTab('targets')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'targets'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-sky-300" />
          <span>{lang === 'ar' ? 'الأهداف المالية' : 'Targets & Goals'}</span>
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'bills'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          <span>{lang === 'ar' ? 'تذكير الفواتير' : 'Bill Reminders'}</span>
        </button>

        <button
          onClick={() => setActiveTab('streaks')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'streaks'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span>{lang === 'ar' ? 'سلسلة العادات (12 يوم)' : 'Habit Streak (12 Days)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('debt')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTab === 'debt'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5 text-rose-300" />
          <span>{lang === 'ar' ? 'كرة الثلج للديون' : 'Debt Payoff'}</span>
        </button>
      </div>

      {/* 3. Tab Contents */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* ==================== TAB 1: SUMMARY & ENVELOPES (Screenshots 1 & 2) ==================== */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Top Beyond Budget Banner Card: Spent / Allocated */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-slate-800 text-slate-300">
                    <Calendar className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                    {lang === 'ar' ? 'ملخص الميزانية' : 'Budget Summary'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <button
                  onClick={() => setShowAllocationsDetail(!showAllocationsDetail)}
                  className="p-1 rounded text-slate-400 hover:text-white transition"
                  title="Toggle details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar with 60% Marker */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Spent / Allocated</span>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-blue-400">{budgetSpentPct}%</span>
                    <span className="text-white font-bold">
                      {formatMoney(moneyFromHalalas(totalSpentHalalas))} / {formatMoney(moneyFromHalalas(totalAllocatedHalalas))}
                    </span>
                  </div>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full transition-all duration-500"
                    style={{ width: `${budgetSpentPct}%` }}
                  />
                  {/* Subtle 60% notch marker */}
                  <div className="absolute top-0 bottom-0 left-[60%] w-0.5 bg-white/70 shadow-sm" />
                </div>
              </div>

              {/* Ready to Assign Notification Pill */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-xs">
                <span className="text-slate-400">
                  {lang === 'ar' ? 'المبلغ المتبقي للتعيين (صفرية الميزانية):' : 'Ready to Assign (Zero-Based Pool):'}
                </span>
                <span
                  className={`font-mono font-bold px-2.5 py-0.5 rounded-full text-xs ${
                    readyToAssign === 0n
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : readyToAssign > 0n
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {formatMoney(moneyFromHalalas(readyToAssign))}
                </span>
              </div>
            </div>

            {/* Top Allocations Donut Chart & Financial Health Score (Screenshots 1 & 2) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Donut Chart Card */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">
                      {lang === 'ar' ? 'أعلى التخصيصات' : 'Top Allocations'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">6 Envelopes</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 justify-center py-2">
                  {/* Interactive SVG Donut Chart */}
                  <div className="relative w-40 h-40 flex-shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {/* Donut Segments */}
                      {/* Rent 37% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#2563EB"
                        strokeWidth="18"
                        strokeDasharray="88.3 238.7"
                        strokeDashoffset="0"
                        className="hover:opacity-80 transition cursor-pointer"
                      />
                      {/* Groceries 15% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#16A34A"
                        strokeWidth="18"
                        strokeDasharray="35.8 238.7"
                        strokeDashoffset="-88.3"
                        className="hover:opacity-80 transition cursor-pointer"
                      />
                      {/* Emergency 11% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#0D9488"
                        strokeWidth="18"
                        strokeDasharray="26.2 238.7"
                        strokeDashoffset="-124.1"
                        className="hover:opacity-80 transition cursor-pointer"
                      />
                      {/* 401k Boost 10% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#38BDF8"
                        strokeWidth="18"
                        strokeDasharray="23.8 238.7"
                        strokeDashoffset="-150.3"
                        className="hover:opacity-80 transition cursor-pointer"
                      />
                      {/* Yellowstone 8% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#EA580C"
                        strokeWidth="18"
                        strokeDasharray="19.1 238.7"
                        strokeDashoffset="-174.1"
                        className="hover:opacity-80 transition cursor-pointer"
                      />
                      {/* Auto Loan 8% */}
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke="#6366F1"
                        strokeWidth="18"
                        strokeDasharray="19.1 238.7"
                        strokeDashoffset="-193.2"
                        className="hover:opacity-80 transition cursor-pointer"
                      />
                    </svg>
                    {/* Inner hole with summary icon */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                      <span className="text-sm font-extrabold text-white">100%</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-1.5 text-xs flex-1">
                    {TOP_ALLOCATIONS.map((alloc) => (
                      <div key={alloc.name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: alloc.color }}
                          />
                          <span className="text-slate-300 font-medium truncate">
                            {lang === 'ar' ? alloc.nameAr : alloc.name}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-slate-400">{alloc.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Financial Health Score & Budget Health Check (Screenshot 1 & 2) */}
              <div className="space-y-4">
                {/* Financial Health Score Card */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 flex items-center gap-4">
                  {/* Circle 75 Gauge */}
                  <div className="w-16 h-16 rounded-full bg-blue-500/15 border-2 border-blue-400 flex items-center justify-center flex-shrink-0 text-blue-400 font-extrabold text-2xl shadow-lg shadow-blue-500/20">
                    75
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                        Financial Health Score
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-white">Optimal</span>
                      <Pin className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {lang === 'ar'
                        ? 'استراتيجيتك المالية تسير بنجاح ممتاز. واصل خطتك بثقة.'
                        : 'Your strategies are working well. Continue your journey with confidence.'}
                    </p>
                  </div>
                </div>

                {/* Budget Health Check */}
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-300">
                      <span>Budget Health Check</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                    <Pin className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400 pt-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span>{lang === 'ar' ? 'جميع الحسابات والظروف متوازنة ومستقرة' : 'Everything is settled up'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Envelopes List with Soft Rounded Pills (Screenshot 2: Groceries $275.55 peach pill, 401k $2,250.00 blue pill) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {lang === 'ar' ? 'فئات الظروف الشهرية' : 'Budget Envelopes (Categories)'}
                </h4>
                <span className="text-xs text-slate-400">Available Balances</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {envelopes.map((env) => {
                  const availableHalalas = env.allocatedHalalas - env.spentHalalas;
                  const isOverspent = availableHalalas < 0n;
                  const isInvestmentOrSavings = env.category === 'savings';

                  return (
                    <div
                      key={env.id}
                      className="rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-850 p-4 flex items-center justify-between transition group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                          {getEnvelopeIcon(env.iconName)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-white">
                              {lang === 'ar' ? env.nameAr : env.name}
                            </span>
                            <Pin className="w-3 h-3 text-rose-400" />
                            {env.id === 'env_groceries' && <Flame className="w-3 h-3 text-orange-400 fill-orange-400" />}
                          </div>
                          <p className="text-xs text-slate-400">
                            {formatMoney(moneyFromHalalas(env.spentHalalas))} allocated of{' '}
                            {formatMoney(moneyFromHalalas(env.allocatedHalalas))}
                          </p>
                        </div>
                      </div>

                      {/* Right Pill Badge matching Screenshot 2 */}
                      <div className="flex items-center gap-2">
                        {isOverspent ? (
                          <button
                            onClick={() =>
                              setTransferModal({
                                targetEnvelopeId: env.id,
                                overspentHalalas: -availableHalalas,
                              })
                            }
                            className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 transition flex items-center gap-1 cursor-pointer"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Cover {formatMoney(moneyFromHalalas(-availableHalalas))}</span>
                          </button>
                        ) : (
                          <div
                            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-tight shadow-sm ${
                              isInvestmentOrSavings
                                ? 'bg-sky-500/15 text-sky-300 border border-sky-400/30' // Soft Blue pill (Screenshot 2: $2,250.00)
                                : 'bg-orange-500/15 text-orange-300 border border-orange-400/30' // Soft Peach pill (Screenshot 2: $275.55)
                            }`}
                          >
                            {formatMoney(moneyFromHalalas(availableHalalas))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: TARGETS & GOALS (Screenshot 3) ==================== */}
        {activeTab === 'targets' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Question Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/20 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {lang === 'ar' ? 'هل سيكفي المال لتغطية جميع المصاريف والأهداف؟' : 'Will I have enough money to cover all my expenses?'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Track long-term targets, open-ended funds, and sinking expenses.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTargetModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Target</span>
              </button>
            </div>

            {/* Target Summary Celebration Card (Screenshot 3) */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TARGET SUMMARY</span>
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-extrabold text-white">Awesome job — You&apos;ve hit your target</h5>
                    <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />
                  </div>
                </div>
              </div>

              {/* Progress 100% Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-emerald-400">100%</span>
                  <span className="text-slate-400">Open ended</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-full" />
                </div>
                <p className="text-xs text-slate-400 pt-0.5">
                  <strong className="text-white">{formatMoney(moneyFromHalalas(225000n))}</strong> / Reached
                </p>
              </div>
            </div>

            {/* Targets List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>DAY-TO-DAY EXPENSES & TARGETS</span>
                <span>REMAINING {formatMoney(moneyFromHalalas(2000n))}</span>
              </div>

              <div className="space-y-3">
                {targets.map((target) => {
                  const targetPct = target.targetHalalas > 0n
                    ? Math.min(100, Math.round(Number(target.currentHalalas * 100n / target.targetHalalas)))
                    : 0;
                  const isReached = targetPct >= 100;

                  return (
                    <div
                      key={target.id}
                      className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-2.5 hover:bg-slate-850 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              isReached ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'
                            }`}
                          >
                            {target.iconName === 'Car' ? (
                              <Car className="w-4 h-4" />
                            ) : target.iconName === 'Utensils' ? (
                              <Utensils className="w-4 h-4" />
                            ) : target.iconName === 'Shield' ? (
                              <Shield className="w-4 h-4" />
                            ) : (
                              <PiggyBank className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-white">
                              {lang === 'ar' ? target.nameAr : target.name}
                            </span>
                            <p className="text-xs text-slate-400">
                              {formatMoney(moneyFromHalalas(target.currentHalalas))} /{' '}
                              {isReached ? 'Reached' : `In progress (${targetPct}%)`}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              isReached
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {targetPct}%
                          </span>
                          <p className="text-[11px] text-slate-400 mt-0.5">{target.dueText}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isReached
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              : 'bg-gradient-to-r from-blue-600 to-sky-400'
                          }`}
                          style={{ width: `${targetPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: BILL REMINDERS (Screenshot 4) ==================== */}
        {activeTab === 'bills' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/20 p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {lang === 'ar' ? 'لا تفوّت أي فاتورة أو استحقاق' : 'Never miss a bill'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Schedule recurring payments and receive real-time alerts.
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-bold border border-amber-500/30">
                {bills.filter((b) => !b.isPaid).length} Pending
              </div>
            </div>

            {/* Timeline Sections (Screenshot 4: Tomorrow, Wed 4 Nov, Sun 15 Nov) */}
            <div className="space-y-4">
              {/* TOMORROW GROUP */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>TOMORROW</span>
                </div>

                {bills
                  .filter((b) => b.group === 'tomorrow')
                  .map((bill) => (
                    <div
                      key={bill.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex items-center justify-between hover:bg-slate-850 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                          {bill.iconName === 'Home' ? (
                            <Home className="w-5 h-5 text-sky-400" />
                          ) : (
                            <Zap className="w-5 h-5 text-amber-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {lang === 'ar' ? bill.titleAr : bill.title}
                            </span>
                            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {bill.recurrence}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{bill.timeStr} • {bill.payee}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-orange-500/15 text-orange-300 border border-orange-400/30">
                          {formatMoney(moneyFromHalalas(bill.amountHalalas))}
                        </div>
                        {bill.isPaid ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                            <Check className="w-4 h-4" /> Paid
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePayBill(bill.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* UPCOMING GROUP */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-400 uppercase">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>UPCOMING DUE DATES</span>
                </div>

                {bills
                  .filter((b) => b.group === 'upcoming')
                  .map((bill) => (
                    <div
                      key={bill.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex items-center justify-between hover:bg-slate-850 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                          <Car className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {lang === 'ar' ? bill.titleAr : bill.title}
                            </span>
                            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {bill.recurrence}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{bill.timeStr} • {bill.payee}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-indigo-500/15 text-indigo-300 border border-indigo-400/30">
                          {formatMoney(moneyFromHalalas(bill.amountHalalas))}
                        </div>
                        {bill.isPaid ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                            <Check className="w-4 h-4" /> Paid
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePayBill(bill.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: HABIT STREAKS & ACHIEVEMENTS (Screenshot 5) ==================== */}
        {activeTab === 'streaks' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Hero Flame Streak Section (Screenshot 5) */}
            <div className="rounded-3xl bg-gradient-to-b from-orange-950/40 via-slate-900 to-slate-950 border border-orange-500/30 p-8 text-center relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Fire Flame with Streak Number */}
              <div className="relative inline-block mb-3">
                <div className="w-28 h-28 mx-auto relative flex items-center justify-center">
                  <Flame className="w-28 h-28 text-orange-500 fill-orange-500 drop-shadow-[0_0_25px_rgba(249,115,22,0.6)] animate-pulse" />
                  <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white tracking-tighter drop-shadow-md">
                    {habitStreak.streakDays}
                  </span>
                </div>
              </div>

              <h3 className="text-2xl font-black text-white tracking-tight">
                {habitStreak.streakDays} days streak!
              </h3>
              <p className="text-xs text-orange-200/80 mt-1">
                {lang === 'ar'
                  ? 'بناء عادة مالية يومية ذكية تستمر وتنمو معك'
                  : 'Build the habit. Daily tracking builds lifelong financial freedom.'}
              </p>

              {/* Check-in CTA Button */}
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  onClick={handleCheckInToday}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-orange-500/30 transition active:scale-95 cursor-pointer"
                >
                  ⚡ Log Today&apos;s Spending (+100 XP)
                </button>
                <button
                  onClick={handleToggleStreakFreeze}
                  className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-sky-300 font-semibold text-xs border border-sky-500/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Snowflake className="w-4 h-4 text-sky-400" />
                  <span>Use Freeze ({habitStreak.freezesAvailable})</span>
                </button>
              </div>
            </div>

            {/* Weekly Summary & 2 Perfect Weeks (Screenshot 5) */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  WEEKLY SUMMARY ({habitStreak.perfectWeeks} PERFECT WEEKS)
                </span>
                <span className="text-xs text-emerald-400 font-bold">On track for a perfect week</span>
              </div>

              {/* Days Check Circles */}
              <div className="flex items-center justify-between gap-2 py-2">
                {habitStreak.weekDays.map((day) => (
                  <div key={day.name} className="flex flex-col items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">{day.name}</span>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                        day.checked
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-md'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {day.checked ? <Check className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-slate-600" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* XP & Level Status Row (Screenshot 5: 2460 XP, Level 6) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">EXPERIENCE</span>
                  <p className="text-base font-extrabold text-white">{habitStreak.xp} XP</p>
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">TIER</span>
                  <p className="text-base font-extrabold text-white">Level {habitStreak.level}</p>
                </div>
              </div>
            </div>

            {/* Achievement Badges (Screenshot 5: Streak Star, Weekend Warrior) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {lang === 'ar' ? 'الأوسمة والإنجازات المكتسبة' : 'Earned Achievements'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {habitStreak.achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center space-y-2 hover:scale-[1.02] transition shadow-md"
                  >
                    <div
                      className={`w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr ${ach.badgeStyle} flex items-center justify-center text-white shadow-lg`}
                    >
                      {ach.icon === 'Stars' ? (
                        <Sparkles className="w-6 h-6" />
                      ) : ach.icon === 'Trophy' ? (
                        <Trophy className="w-6 h-6" />
                      ) : (
                        <Award className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h5 className="text-xs font-extrabold text-white">
                        {lang === 'ar' ? ach.titleAr : ach.title}
                      </h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">{ach.earnedDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 5: DEBT SNOWBALL (Payoff Engine) ==================== */}
        {activeTab === 'debt' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Payoff Acceleration Control */}
            <div className="rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {lang === 'ar' ? 'محاكي تسريع سداد الديون والتمويل' : 'Accelerated Debt Payoff Simulator'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Apply the Snowball method: roll paid off minimums into next loan balance.
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 text-xs font-bold border border-rose-500/30">
                  Snowball Engine
                </div>
              </div>

              {/* Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Extra Monthly Allocation:</span>
                  <span className="font-extrabold text-rose-400 text-sm">+{extraDebtPayoff} SAR / mo</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3000"
                  step="100"
                  value={extraDebtPayoff}
                  onChange={(e) => setExtraDebtPayoff(Number(e.target.value))}
                  className="w-full accent-rose-500 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Debt Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {debts.map((debt) => {
                const standardPayoff = calculateDebtPayoff(
                  debt.principalHalalas,
                  debt.monthlyMinimumHalalas,
                  debt.interestApr
                );

                const acceleratedPaymentHalalas =
                  debt.monthlyMinimumHalalas + BigInt(extraDebtPayoff * 100);

                const acceleratedPayoff = calculateDebtPayoff(
                  debt.principalHalalas,
                  acceleratedPaymentHalalas,
                  debt.interestApr
                );

                const monthsSaved = Math.max(0, standardPayoff.monthsToPayoff - acceleratedPayoff.monthsToPayoff);

                return (
                  <div
                    key={debt.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-sm font-bold text-white">
                          {lang === 'ar' ? debt.nameAr : debt.name}
                        </h5>
                        <p className="text-xs text-slate-400">{debt.creditor}</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-rose-400">
                        {debt.interestApr}% APR
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800">
                      <div>
                        <span className="text-slate-400">Principal Balance:</span>
                        <p className="font-bold text-white font-mono">
                          {formatMoney(moneyFromHalalas(debt.principalHalalas))}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Payoff Timeline:</span>
                        <p className="font-bold text-emerald-400">
                          {acceleratedPayoff.monthsToPayoff} months{' '}
                          {monthsSaved > 0 && <span className="text-xs">(-{monthsSaved} mo)</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Cover Overspending Modal */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">
                  {lang === 'ar' ? 'تغطية عجز الظرف المالي' : 'Cover Overspending'}
                </h3>
              </div>
              <button
                onClick={() => setTransferModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              {lang === 'ar'
                ? `هذا الظرف تجاوز الميزانية بمقدار ${formatMoney(
                    moneyFromHalalas(transferModal.overspentHalalas)
                  )}. اختر ظرفاً يتوفر فيه فائض لتغطية العجز:`
                : `This envelope is overspent by ${formatMoney(
                    moneyFromHalalas(transferModal.overspentHalalas)
                  )}. Select a donor envelope with surplus funds:`}
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Donor Envelope:</label>
              <select
                value={selectedDonorId}
                onChange={(e) => setSelectedDonorId(e.target.value)}
                className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {envelopes
                  .filter((e) => e.id !== transferModal.targetEnvelopeId)
                  .map((e) => {
                    const avail = e.allocatedHalalas - e.spentHalalas;
                    return (
                      <option key={e.id} value={e.id}>
                        {e.name} (Available: {formatMoney(moneyFromHalalas(avail))})
                      </option>
                    );
                  })}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleExecuteTransfer}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                Confirm Reallocation
              </button>
              <button
                onClick={() => setTransferModal(null)}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add Target Modal */}
      {showAddTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <form
            onSubmit={handleAddTarget}
            className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Add Budget Target</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTargetModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Target Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vacation to Abha, New Laptop"
                  value={newTargetName}
                  onChange={(e) => setNewTargetName(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Target Goal Amount (SAR)</label>
                <input
                  type="number"
                  required
                  min="50"
                  step="50"
                  value={newTargetAmount}
                  onChange={(e) => setNewTargetAmount(e.target.value)}
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg cursor-pointer"
              >
                Create Target
              </button>
              <button
                type="button"
                onClick={() => setShowAddTargetModal(false)}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
