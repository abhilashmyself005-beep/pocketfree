'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  RefreshCw,
  Wallet,
  Zap,
  Check,
} from 'lucide-react';
import { Transaction } from '@/core/transactions';
import { formatMoney, moneyFromHalalas } from '@/core/money';
import {
  parseSaudiBankSmsAlert,
  createTransactionFromParsedSms,
  SAMPLE_SAUDI_BANK_SMS,
  ParsedSmsResult,
} from '@/core/banking/smsAlertParser';

interface BillReminder {
  id: string;
  title: string;
  titleAr: string;
  category: string;
  amountHalalas: bigint;
  dueDate: string; // YYYY-MM-DD
  frequency: 'monthly' | 'yearly';
  isPaid: boolean;
}

const INITIAL_BILLS: BillReminder[] = [
  {
    id: 'bill_stc_01',
    title: 'STC Fiber & Postpaid',
    titleAr: 'إس تي سي الألياف والمفوتر',
    category: 'utilities',
    amountHalalas: 28750n, // 287.50 SAR
    dueDate: '2026-10-28',
    frequency: 'monthly',
    isPaid: false,
  },
  {
    id: 'bill_sec_01',
    title: 'SEC Electricity Bill (فاتورة الكهرباء)',
    titleAr: 'الشركة السعودية للكهرباء',
    category: 'utilities',
    amountHalalas: 42000n, // 420.00 SAR
    dueDate: '2026-10-30',
    frequency: 'monthly',
    isPaid: false,
  },
  {
    id: 'bill_netflix_01',
    title: 'Netflix Premium 4K',
    titleAr: 'اشتراك نتفليكس بريميوم',
    category: 'entertainment',
    amountHalalas: 6500n, // 65.00 SAR
    dueDate: '2026-11-05',
    frequency: 'monthly',
    isPaid: true,
  },
  {
    id: 'bill_rent_01',
    title: 'Quarterly Apartment Lease - Riyadh',
    titleAr: 'إيجار شقة ربع سنوي - الرياض',
    category: 'housing',
    amountHalalas: 650000n, // 6,500.00 SAR
    dueDate: '2026-11-15',
    frequency: 'monthly',
    isPaid: false,
  },
];

interface FinArtExpenseTrackerProps {
  onAddTransaction: (tx: Transaction) => void;
  lang: 'en' | 'ar';
}

export const FinArtExpenseTracker: React.FC<FinArtExpenseTrackerProps> = ({
  onAddTransaction,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'sms' | 'bills' | 'accounts'>('sms');
  const [rawSmsInput, setRawSmsInput] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedSmsResult | null>(null);
  const [bills, setBills] = useState<BillReminder[]>(INITIAL_BILLS);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [newBillTitle, setNewBillTitle] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillDate, setNewBillDate] = useState('');
  const [showAddBillModal, setShowAddBillModal] = useState(false);

  const [fallbackAmount, setFallbackAmount] = useState('');
  const [fallbackMerchant, setFallbackMerchant] = useState('');
  const [autoLogToLedger, setAutoLogToLedger] = useState(true);
  const [incomingSimAlert, setIncomingSimAlert] = useState<{ bank: string; text: string; amount: string; merchant: string } | null>(null);

  const handleParseSms = (text: string, isQuickAction = false) => {
    setRawSmsInput(text);
    const result = parseSaudiBankSmsAlert(text);
    setParsedResult(result);

    // If autoLog is enabled and user pressed a preset or pasted clipboard, log directly
    if (isQuickAction && autoLogToLedger && result && !result.isOtp) {
      const tx = createTransactionFromParsedSms(result);
      onAddTransaction(tx);
      setSuccessToast(
        lang === 'ar'
          ? `⚡ تم القيد التلقائي الفوري: ${formatMoney(moneyFromHalalas(result.amountHalalas))} لدى ${result.merchant} (${result.category})`
          : `⚡ Auto-Logged: ${formatMoney(moneyFromHalalas(result.amountHalalas))} at ${result.merchant} (${result.category})`
      );
      setTimeout(() => setSuccessToast(null), 4000);
      setRawSmsInput('');
      setParsedResult(null);
    }
  };

  const handleSimulateIncomingSms = () => {
    const randomPreset = SAMPLE_SAUDI_BANK_SMS[Math.floor(Math.random() * SAMPLE_SAUDI_BANK_SMS.length)];
    const parsed = parseSaudiBankSmsAlert(randomPreset.smsText);

    if (parsed) {
      setIncomingSimAlert({
        bank: parsed.bankName,
        text: randomPreset.smsText,
        amount: formatMoney(moneyFromHalalas(parsed.amountHalalas)),
        merchant: parsed.merchant,
      });

      // Automatically add to ledger
      const tx = createTransactionFromParsedSms(parsed);
      onAddTransaction(tx);

      setTimeout(() => {
        setIncomingSimAlert(null);
      }, 5000);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        handleParseSms(text, true);
        if (!autoLogToLedger) {
          setSuccessToast(
            lang === 'ar'
              ? '✓ تم استخراج بيانات المعاملة من الحافظة! راجع التفاصيل أدناه واضغط تأكيد.'
              : '✓ SMS alert extracted from clipboard! Review details and confirm below.'
          );
          setTimeout(() => setSuccessToast(null), 4000);
        }
      } else {
        alert(lang === 'ar' ? 'الحافظة فارغة حالياً. انسخ رسالة بنكية أولاً.' : 'Clipboard is empty. Copy a bank SMS first.');
      }
    } catch {
      alert(
        lang === 'ar'
          ? 'تعذر الوصول للحافظة تلقائياً. يرجى لصق النص يدوياً في المربع أدناه.'
          : 'Clipboard access was blocked by browser. Please paste the SMS text into the box directly.'
      );
    }
  };

  const handleAddParsedToLedger = () => {
    if (!parsedResult) return;
    const tx = createTransactionFromParsedSms(parsedResult);
    onAddTransaction(tx);
    setSuccessToast(
      lang === 'ar'
        ? `✓ تم قيد المعاملة تلقائياً: ${formatMoney(moneyFromHalalas(parsedResult.amountHalalas))} لدى ${parsedResult.merchant}`
        : `✓ Added to ledger: ${formatMoney(moneyFromHalalas(parsedResult.amountHalalas))} at ${parsedResult.merchant}`
    );
    setTimeout(() => setSuccessToast(null), 4000);
    setRawSmsInput('');
    setParsedResult(null);
  };

  const handleAddManualFallback = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(fallbackAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const parsed: ParsedSmsResult = {
      amountHalalas: BigInt(Math.round(amountNum * 100)),
      type: 'expense',
      merchant: fallbackMerchant.trim() || 'Custom Bank SMS',
      category: 'other',
      accountLabel: 'Mada / Credit Card',
      bankName: 'Saudi Bank',
      currency: 'SAR',
      confidence: 'medium',
      date: new Date(),
      rawText: rawSmsInput,
      notes: 'Manually verified bank SMS alert',
    };

    const tx = createTransactionFromParsedSms(parsed);
    onAddTransaction(tx);
    setSuccessToast(
      lang === 'ar'
        ? `✓ تم قيد المعاملة بنجاح: ${formatMoney(moneyFromHalalas(parsed.amountHalalas))}`
        : `✓ Logged to ledger: ${formatMoney(moneyFromHalalas(parsed.amountHalalas))}`
    );
    setTimeout(() => setSuccessToast(null), 4000);
    setRawSmsInput('');
    setParsedResult(null);
    setFallbackAmount('');
    setFallbackMerchant('');
  };

  const handleToggleBillPaid = (billId: string) => {
    setBills((prev) =>
      prev.map((b) => {
        if (b.id === billId) {
          const nextState = !b.isPaid;
          if (nextState) {
            // Auto log as transaction
            const billTx: Transaction = {
              id: `tx_bill_${Date.now()}`,
              userId: 'user_dev_saudi_pilot_01',
              accountId: 'acc_bank_riyad',
              type: 'expense',
              category: b.category as any,
              amountHalalas: b.amountHalalas,
              currency: 'SAR',
              date: new Date(),
              description: lang === 'ar' ? b.titleAr : b.title,
              source: 'cash_manual',
              fingerprint: `fp_bill_${b.id}_${Date.now()}`,
              isTransfer: false,
              isRefund: false,
              notes: 'Recurring Bill Settlement via FinArt Reminder Hub',
              createdAt: new Date(),
            };
            onAddTransaction(billTx);
            setSuccessToast(
              lang === 'ar'
                ? `✓ تم سداد الفاتورة وقيدها في السجل: ${formatMoney(moneyFromHalalas(b.amountHalalas))}`
                : `✓ Bill marked as paid and logged to ledger: ${formatMoney(moneyFromHalalas(b.amountHalalas))}`
            );
            setTimeout(() => setSuccessToast(null), 4000);
          }
          return { ...b, isPaid: nextState };
        }
        return b;
      })
    );
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillTitle || !newBillAmount || !newBillDate) return;
    const amountVal = parseFloat(newBillAmount);
    if (isNaN(amountVal) || amountVal <= 0) return;

    const newBill: BillReminder = {
      id: `bill_${Date.now()}`,
      title: newBillTitle,
      titleAr: newBillTitle,
      category: 'utilities',
      amountHalalas: BigInt(Math.round(amountVal * 100)),
      dueDate: newBillDate,
      frequency: 'monthly',
      isPaid: false,
    };

    setBills((prev) => [newBill, ...prev]);
    setNewBillTitle('');
    setNewBillAmount('');
    setNewBillDate('');
    setShowAddBillModal(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header Banner: FinArt Core Value Proposition */}
      <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'نمط FinArt الذكي' : 'FinArt Engine Parity'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-3 h-3" />
              {lang === 'ar' ? '100% معالجة آمنة بلا تسجيل بنكي' : 'Zero Bank Login Required (Local Privacy)'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {lang === 'ar'
              ? 'المتتبع الآلي للإشعارات والفواتير المجدولة'
              : 'Automatic Alert Parser & Scheduled Bills Hub'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {lang === 'ar'
              ? 'تحويل فوري لرسائل البنوك النصية إلى قيود مالية مع التنبيه المسبق لمواعيد الفواتير والاشتراكات'
              : 'Auto-parse incoming bank SMS alerts into categorized transactions and track recurring due dates.'}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('sms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sms'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'الرسائل النصية' : 'SMS Alerts'}
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'bills'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'الفواتير والاشتراكات' : 'Bill Reminders'}
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'accounts'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            {lang === 'ar' ? 'البطاقات والمحافظ' : 'Accounts'}
          </button>
        </div>
      </div>

      {/* Real-time Simulated Incoming SMS Alert Banner */}
      {incomingSimAlert && (
        <div className="mx-6 mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-2xl border border-white/20 flex items-start justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25">
                  Incoming Bank SMS Alert
                </span>
                <span className="text-xs font-bold text-emerald-100">{incomingSimAlert.bank}</span>
              </div>
              <p className="text-sm font-black mt-0.5">
                {incomingSimAlert.amount} at {incomingSimAlert.merchant}
              </p>
              <p className="text-xs text-emerald-100/80 line-clamp-1 mt-0.5 font-mono">
                {incomingSimAlert.text}
              </p>
              <span className="text-[10px] font-semibold text-emerald-200 mt-1 inline-block">
                ⚡ Parsed & logged to your budget ledger automatically!
              </span>
            </div>
          </div>
          <button
            onClick={() => setIncomingSimAlert(null)}
            className="text-white/70 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Notification Banner */}
      {successToast && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center justify-between animate-in fade-in">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {successToast}
          </span>
        </div>
      )}

      {/* Tab 1: SMS Alert Parser */}
      {activeTab === 'sms' && (
        <div className="p-6 space-y-6">
          {/* Controls Bar: Auto-Log Switch + Simulate Alert */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAutoLogToLedger(!autoLogToLedger)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  autoLogToLedger
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${autoLogToLedger ? 'text-amber-400 fill-amber-400' : ''}`} />
                <span>
                  {autoLogToLedger
                    ? (lang === 'ar' ? 'القيد التلقائي الفوري: مفعل ⚡' : 'Auto-Log to Ledger: ON ⚡')
                    : (lang === 'ar' ? 'القيد التلقائي الفوري: معطل' : 'Auto-Log to Ledger: OFF')}
                </span>
              </button>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {lang === 'ar' ? 'يقيد المعاملات مباشرة دون الحاجة لضغط زر التأكيد' : 'Directly logs parsed alerts into transactions'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSimulateIncomingSms}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-900/30 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{lang === 'ar' ? 'محاكاة وصول إشعار بنكي 📲' : 'Simulate Incoming SMS 📲'}</span>
            </button>
          </div>

          {/* Quick Preset Samples */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {lang === 'ar'
                  ? 'تجربة فورية لنماذج إشعارات البنوك السعودية (اضغط للتجربة الفورية):'
                  : '1-Tap Real Bank Alert Samples (Tap to auto-parse & log):'}
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_SAUDI_BANK_SMS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleParseSms(sample.smsText, true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-emerald-500/40 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  {lang === 'ar' ? sample.labelAr : sample.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Parser Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-400">
                {lang === 'ar'
                  ? 'أو الصق نص الإشعار البنكي الوارد هنا (الراجحي، الأهلي، الرياض، الإنماء، STC Pay):'
                  : 'Or Paste Incoming Bank SMS Text (Al Rajhi, SNB, Riyad, STC Pay, Apple Pay):'}
              </label>
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition cursor-pointer shadow-sm active:scale-95"
                title="Read from Clipboard"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'ar' ? '📋 لصق من الحافظة وتحليل فوري' : '📋 Paste from Clipboard & Auto-Parse'}</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                value={rawSmsInput}
                onChange={(e) => handleParseSms(e.target.value, false)}
                placeholder={
                  lang === 'ar'
                    ? 'مثال: مصرف الراجحي: شراء عبر نقاط البيع بمبلغ 145.50 ر.س لدى بنده ببطاقة مدى **8821...'
                    : 'e.g. Al Rajhi Bank: Purchase of SAR 184.50 at Panda Supermarket with Mada card **8821... or Account debited by SAR 120.00'
                }
                rows={3}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              {rawSmsInput && (
                <button
                  onClick={() => {
                    setRawSmsInput('');
                    setParsedResult(null);
                  }}
                  className="absolute top-2.5 right-2.5 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 cursor-pointer"
                >
                  {lang === 'ar' ? 'مسح' : 'Clear'}
                </button>
              )}
            </div>
          </div>

          {/* OTP Warning Card */}
          {parsedResult?.isOtp && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-amber-200">
                  {lang === 'ar' ? 'تم رصد رمز تحقق أمني (OTP)' : 'Security OTP / Verification Code Detected'}
                </strong>
                <p className="mt-1 text-slate-300">
                  {lang === 'ar'
                    ? 'هذه الرسالة تحتوي على رمز دخول أو تأكيد أمني وليست معاملة سحب مالي. يتجاهل النظام رموز التحقق لحماية خصوصيتك وأمان حسابك.'
                    : 'This message is a login or payment verification OTP. Pocketfree ignores OTPs for security and only extracts financial transaction alerts.'}
                </p>
              </div>
            </div>
          )}

          {/* Live Extracted Card */}
          {parsedResult && !parsedResult.isOtp && (
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4" />
                  {lang === 'ar' ? 'تم استخراج تفاصيل المعاملة بنجاح' : 'FinArt AI Extraction Successful'}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  Confidence: {parsedResult.confidence.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">{lang === 'ar' ? 'المبلغ المستقطع' : 'Amount'}</span>
                  <span
                    className={`text-base font-extrabold ${
                      parsedResult.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {parsedResult.type === 'income' ? '+' : '-'}
                    {formatMoney(moneyFromHalalas(parsedResult.amountHalalas))}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">{lang === 'ar' ? 'المتجر / الجهة' : 'Merchant / Payee'}</span>
                  <span className="text-sm font-semibold text-white truncate block">
                    {parsedResult.merchant}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">{lang === 'ar' ? 'التصنيف التلقائي' : 'Category'}</span>
                  <span className="text-sm font-medium text-amber-300 capitalize">
                    {parsedResult.category}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">{lang === 'ar' ? 'البنك / الحساب' : 'Account/Card'}</span>
                  <span className="text-sm font-medium text-slate-200 truncate block">
                    {parsedResult.accountLabel}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleAddParsedToLedger}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {lang === 'ar' ? 'تأكيد وإضافة لسجل المعاملات' : 'Confirm & Log to Ledger'}
                </button>
              </div>
            </div>
          )}

          {/* Fallback Entry Card for Unrecognized Format */}
          {rawSmsInput.trim().length > 10 && !parsedResult && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-700 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {lang === 'ar'
                    ? 'لم يتم التعرف على المبلغ تلقائياً من نص الرسالة. يمكنك إدخال المبلغ لقيدها مباشرة:'
                    : 'Could not auto-detect amount from this text. Enter details below to log transaction:'}
                </span>
              </div>

              <form onSubmit={handleAddManualFallback} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Amount (e.g. 150.00)"
                    value={fallbackAmount}
                    onChange={(e) => setFallbackAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Merchant name (optional)"
                    value={fallbackMerchant}
                    onChange={(e) => setFallbackMerchant(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md cursor-pointer"
                  >
                    Log to Ledger
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Bill & Subscription Reminders */}
      {activeTab === 'bills' && (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                {lang === 'ar' ? 'الفواتير والالتزامات القادمة' : 'Upcoming Bills & Active Subscriptions'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'ar'
                  ? 'تنبيهات استباقية لتجنب غرامات التأخير، مع إمكانية السداد السريع'
                  : 'Track payment schedules with one-click ledger settlement.'}
              </p>
            </div>
            <button
              onClick={() => setShowAddBillModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              {lang === 'ar' ? 'إضافة فاتورة' : 'Add Bill'}
            </button>
          </div>

          {/* Bills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className={`p-4 rounded-xl border transition-all ${
                  bill.isPaid
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {lang === 'ar' ? bill.titleAr : bill.title}
                    </h4>
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {lang === 'ar' ? 'موعد الاستحقاق: ' : 'Due: '}
                      {bill.dueDate}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-white font-mono">
                    {formatMoney(moneyFromHalalas(bill.amountHalalas))}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-3">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                      bill.isPaid
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {bill.isPaid
                      ? lang === 'ar'
                        ? 'تم السداد'
                        : 'Paid'
                      : lang === 'ar'
                      ? 'مستحقة قريباً'
                      : 'Upcoming'}
                  </span>

                  <button
                    onClick={() => handleToggleBillPaid(bill.id)}
                    className={`text-xs px-2.5 py-1 rounded font-semibold transition-all ${
                      bill.isPaid
                        ? 'text-slate-400 hover:text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {bill.isPaid
                      ? lang === 'ar'
                        ? 'إعادة كغير مدفوع'
                        : 'Undo'
                      : lang === 'ar'
                      ? 'تم السداد (تسجيل)'
                      : 'Mark Paid'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Modal to Add Bill */}
          {showAddBillModal && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-700 space-y-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {lang === 'ar' ? 'إضافة فاتورة دورية جديدة' : 'Add New Recurring Bill'}
              </h4>
              <form onSubmit={handleCreateBill} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'اسم الفاتورة (مثال: جيم، إنترنت)' : 'Bill Name (e.g. Gym, Fiber)'}
                  value={newBillTitle}
                  onChange={(e) => setNewBillTitle(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  required
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder={lang === 'ar' ? 'المبلغ بالريال (SAR)' : 'Amount (SAR)'}
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  required
                />
                <input
                  type="date"
                  value={newBillDate}
                  onChange={(e) => setNewBillDate(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  required
                />
                <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddBillModal(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {lang === 'ar' ? 'حفظ الفاتورة' : 'Save Bill'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Multi-Account & Card Overview */}
      {activeTab === 'accounts' && (
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Al Rajhi Mada (**8821)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                  Active
                </span>
              </div>
              <div className="text-lg font-bold text-white font-mono">14,250.00 SAR</div>
              <p className="text-[11px] text-slate-400">Debit / Payroll Primary Account</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">SNB Mastercard (**4012)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">
                  Credit
                </span>
              </div>
              <div className="text-lg font-bold text-white font-mono">8,500.00 SAR</div>
              <p className="text-[11px] text-slate-400">Available Limit (Due 25th)</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">STC Pay Digital Wallet</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">
                  Digital
                </span>
              </div>
              <div className="text-lg font-bold text-white font-mono">1,820.00 SAR</div>
              <p className="text-[11px] text-slate-400">Instant Daily Bills & Micro-transfers</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
