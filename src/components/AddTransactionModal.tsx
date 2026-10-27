'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Coins,
  Calendar,
  Tag,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import {
  Transaction,
  TransactionType,
  TransactionCategory,
  CategoryLabels,
  computeTransactionFingerprint,
} from '@/core/transactions';
import { moneyFromSarString, multiplyMoneyByBasisPoints, formatMoney } from '@/core/money';
import { parseSaudiBankSmsAlert } from '@/core/banking/smsAlertParser';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: Transaction) => void;
  lang: 'en' | 'ar';
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  lang,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<TransactionCategory>('groceries');
  const [amountStr, setAmountStr] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('2026-10-27');
  const [notes, setNotes] = useState<string>('');
  const [isTransfer, setIsTransfer] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [autofillSuccess, setAutofillSuccess] = useState<string | null>(null);

  const handlePasteSmsAutofill = async () => {
    setError(null);
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        setError(lang === 'ar' ? 'الحافظة فارغة حالياً. انسخ رسالة بنكية أولاً.' : 'Clipboard is empty. Copy a bank SMS first.');
        return;
      }
      const parsed = parseSaudiBankSmsAlert(text);
      if (parsed) {
        if (parsed.isOtp) {
          setError(lang === 'ar' ? 'النص المنسوخ هو رمز تحقق (OTP) وليس معاملة مالية.' : 'Copied text is an OTP code, not a transaction alert.');
          return;
        }
        setAmountStr((Number(parsed.amountHalalas) / 100).toFixed(2));
        setDescription(parsed.merchant);
        setCategory(parsed.category);
        setType(parsed.type);
        setNotes(`Autofilled from ${parsed.bankName} SMS`);
        setAutofillSuccess(
          lang === 'ar'
            ? `✓ تم استخراج البيانات تلقائياً: ${parsed.merchant} (${parsed.bankName})`
            : `✓ Autofilled from ${parsed.bankName}: ${parsed.merchant}`
        );
        setTimeout(() => setAutofillSuccess(null), 4000);
      } else {
        setError(lang === 'ar' ? 'تعذر استخراج المبلغ من الرسالة. أدخل التفاصيل يدوياً.' : 'Could not detect an amount from clipboard text. Please type details manually.');
      }
    } catch {
      setError(lang === 'ar' ? 'تم حظر الوصول للحافظة من المتصفح.' : 'Clipboard permission was blocked by your browser.');
    }
  };

  React.useEffect(() => {
    try {
      setDateStr(new Date().toISOString().split('T')[0]);
    } catch {
      // fallback
    }
  }, []);

  if (!isOpen) return null;

  // Real-time Halala calculation preview
  let parsedMoney = null;
  let vatEstimate = null;
  let validationError = null;

  if (amountStr.trim()) {
    try {
      parsedMoney = moneyFromSarString(amountStr.trim());
      if (parsedMoney.amountHalalas <= 0n) {
        validationError = lang === 'ar' ? 'يجب أن يكون المبلغ أكبر من صفر' : 'Amount must be greater than zero';
      } else {
        // Calculate estimated 15% VAT component for expenses
        if (type === 'expense') {
          vatEstimate = multiplyMoneyByBasisPoints(parsedMoney, 1500n);
        }
      }
    } catch {
      validationError = lang === 'ar' ? 'صيغة المبلغ غير صالحة (مثال: 125.50)' : 'Invalid SAR amount (e.g. 125.50)';
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amountStr.trim()) {
      setError(lang === 'ar' ? 'يرجى إدخال المبلغ' : 'Please enter an amount');
      return;
    }

    if (!description.trim()) {
      setError(lang === 'ar' ? 'يرجى إدخال وصف المعاملة' : 'Please enter a description');
      return;
    }

    try {
      const money = moneyFromSarString(amountStr.trim());
      if (money.amountHalalas <= 0n) {
        setError(lang === 'ar' ? 'يجب أن يكون المبلغ موجباً' : 'Amount must be positive');
        return;
      }

      const txDate = new Date(dateStr);
      const userId = 'user_dev_saudi_pilot_01';
      const fingerprint = await computeTransactionFingerprint({
        userId,
        date: txDate,
        amountHalalas: money.amountHalalas,
        description: description.trim(),
      });

      const newTx: Transaction = {
        id: crypto.randomUUID(),
        userId,
        accountId: 'acc_cash_wallet_sa',
        type: isTransfer ? 'transfer' : type,
        category,
        amountHalalas: money.amountHalalas,
        currency: 'SAR',
        date: txDate,
        description: description.trim(),
        source: 'cash_manual',
        fingerprint,
        isTransfer,
        isRefund: false,
        notes: notes.trim() || null,
        createdAt: new Date(),
      };

      onAddTransaction(newTx);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl glass-card bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-7 overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {lang === 'ar' ? 'إضافة معاملة نقدية يدوية' : 'Add Manual Cash Entry'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'ar' ? 'دقة تامة بالهللات وتصنيف فوري' : 'Exact Halala precision & instant categorization'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Autofill via SMS Banner */}
        <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{lang === 'ar' ? 'هل نسخت إشعاراً بنكياً؟' : 'Have a copied bank alert SMS?'}</span>
          </div>
          <button
            type="button"
            onClick={handlePasteSmsAutofill}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition cursor-pointer shadow-sm active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{lang === 'ar' ? 'لصق وتعبئة تلقائية' : 'Paste SMS Autofill'}</span>
          </button>
        </div>

        {/* Autofill Success Banner */}
        {autofillSuccess && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{autofillSuccess}</span>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Type Selector (Expense vs Income vs Transfer) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {lang === 'ar' ? 'نوع المعاملة' : 'Transaction Type'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setIsTransfer(false);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  type === 'expense' && !isTransfer
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'ar' ? 'مصروف (Expense)' : 'Expense'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setIsTransfer(false);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  type === 'income' && !isTransfer
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'ar' ? 'دخل (Income)' : 'Income'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('transfer');
                  setIsTransfer(true);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                  isTransfer
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang === 'ar' ? 'تحويل (Transfer)' : 'Transfer'}
              </button>
            </div>
          </div>

          {/* Amount input & Halala Conversion Display */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              {lang === 'ar' ? 'المبلغ بالريال السعودي (SAR)' : 'Amount (SAR)'}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-mono text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
              <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400">
                SAR
              </span>
            </div>

            {/* Halala Precision Preview */}
            {parsedMoney && !validationError && (
              <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs flex items-center justify-between text-emerald-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'ar' ? 'القيمة المخزنة بالهللات: ' : 'Stored Halalas: '}
                    <strong className="font-mono text-white">
                      {parsedMoney.amountHalalas.toString()} Halalas
                    </strong>
                  </span>
                </div>
                {vatEstimate && (
                  <span className="text-slate-400">
                    {lang === 'ar' ? 'ض.ق.م 15%: ' : '15% VAT: '}
                    {formatMoney(vatEstimate, { locale: lang, useSymbol: true })}
                  </span>
                )}
              </div>
            )}
            {validationError && (
              <p className="mt-1 text-xs text-rose-400">{validationError}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>{lang === 'ar' ? 'التصنيف' : 'Category'}</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition"
            >
              {(Object.keys(CategoryLabels) as TransactionCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {lang === 'ar' ? CategoryLabels[cat].ar : CategoryLabels[cat].en}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{lang === 'ar' ? 'الوصف / المتجر' : 'Description / Merchant'}</span>
            </label>
            <input
              type="text"
              placeholder={lang === 'ar' ? 'مثال: أسواق التميمي - مقاضي الأسبوع' : 'e.g. Tamimi Markets - Weekly Groceries'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{lang === 'ar' ? 'التاريخ' : 'Date'}</span>
            </label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'ar' ? 'حفظ المعاملة' : 'Record Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
