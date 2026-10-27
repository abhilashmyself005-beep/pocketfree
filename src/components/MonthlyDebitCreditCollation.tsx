'use client';

import React, { useState } from 'react';
import {
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Smartphone,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { Transaction } from '@/core/transactions';
import { formatMoney, moneyFromHalalas } from '@/core/money';
import {
  isNativeAndroidDevice,
  fetchDeviceHistoricSms,
  parseHistoricSmsToTransactions,
  collateMonthlyDebitsAndCredits,
  MonthlyCollationRecord,
  PhoneSmsMessage,
} from '@/core/banking/phoneSmsBridge';

interface MonthlyDebitCreditCollationProps {
  transactions: Transaction[];
  onSetTransactions: (txs: Transaction[]) => void;
  lang: 'en' | 'ar';
}

export const MonthlyDebitCreditCollation: React.FC<MonthlyDebitCreditCollationProps> = ({
  transactions,
  onSetTransactions,
  lang,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [showBulkPasteModal, setShowBulkPasteModal] = useState(false);
  const [bulkSmsText, setBulkSmsText] = useState('');

  const monthlyRecords = collateMonthlyDebitsAndCredits(transactions);

  // Sync with Native Android Phone SMS Inbox
  const handleSyncDeviceSms = async (clearExisting = true) => {
    setIsSyncing(true);
    setSyncStatus(
      lang === 'ar'
        ? 'جاري فحص صندوق الرسائل النصية بالهاتف وقراءة الإشعارات البنكية...'
        : 'Connecting to phone SMS inbox & scanning bank alerts...'
    );

    try {
      if (isNativeAndroidDevice()) {
        const rawSmsList = await fetchDeviceHistoricSms(1000);

        if (!rawSmsList || rawSmsList.length === 0) {
          setSyncStatus(
            lang === 'ar'
              ? 'تم فحص صندوق الرسائل ولكن لم يتم العثور على رسائل بنكية متطابقة.'
              : 'Inbox scanned, but no financial bank transactions found.'
          );
          setTimeout(() => setSyncStatus(null), 5000);
          return;
        }

        const parsedTransactions = await parseHistoricSmsToTransactions(rawSmsList);

        if (parsedTransactions.length === 0) {
          setSyncStatus(
            lang === 'ar'
              ? `تم فحص ${rawSmsList.length} رسالة ولكن لم تتطابق أي منها مع صيغ البنوك.`
              : `Scanned ${rawSmsList.length} SMS, but found no matching debit/credit alerts.`
          );
          setTimeout(() => setSyncStatus(null), 5000);
          return;
        }

        if (clearExisting) {
          onSetTransactions(parsedTransactions);
        } else {
          // Merge & deduplicate
          const existingFps = new Set(transactions.map((t) => t.fingerprint));
          const newOnly = parsedTransactions.filter((t) => !existingFps.has(t.fingerprint));
          onSetTransactions([...newOnly, ...transactions]);
        }

        const collation = collateMonthlyDebitsAndCredits(parsedTransactions);
        setSyncStatus(
          lang === 'ar'
            ? `✓ تم سحب ${parsedTransactions.length} معاملة بنكية بنجاح عبر ${collation.length} أشهر!`
            : `✓ Auto-Synced ${parsedTransactions.length} bank transactions across ${collation.length} months from phone SMS!`
        );
      } else {
        // Web fallback: Prompt user to bulk paste or load realistic historic simulation
        setShowBulkPasteModal(true);
        setSyncStatus(
          lang === 'ar'
            ? 'المتصفح لا يدعم الوصول المباشر لرسائل الهاتف. الصق الرسائل النصية أدناه للتحليل الفوري.'
            : 'Web browser cannot directly access phone hardware. Paste SMS text batch below or load simulation.'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncStatus(
        lang === 'ar'
          ? `تنبيه: تعذر قراءة الرسائل (${msg}). تأكد من منح إذن قراءة الرسائل.`
          : `Notice: SMS permission denied or unavailable (${msg}).`
      );
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 6000);
    }
  };

  // Remove all mock / test data
  const handleClearTestData = () => {
    if (confirm(lang === 'ar' ? 'هل تريد حذف جميع البيانات التجريبية الحالية وبدء سجل فارغ؟' : 'Remove all current test/mock transactions and start fresh?')) {
      onSetTransactions([]);
      setSyncStatus(
        lang === 'ar'
          ? '✓ تم حذف جميع البيانات التجريبية. السجل الآن فارغ وجاهز لمزامنة رسائل هاتفك.'
          : '✓ All test data removed. Ledger is clean and ready for your real phone SMS.'
      );
      setTimeout(() => setSyncStatus(null), 4000);
    }
  };

  // Bulk Paste / Multi-SMS processing (for Web or Manual batch)
  const handleProcessBulkSms = async () => {
    if (!bulkSmsText.trim()) return;

    // Split messages by blank lines or standard SMS delimiters
    const rawLines = bulkSmsText
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    const now = Date.now();
    const mockMessages: PhoneSmsMessage[] = rawLines.map((line, idx) => ({
      address: 'BankSMS',
      body: line,
      date: now - idx * 86400000 * 2, // stagger by 2 days each
    }));

    const parsed = await parseHistoricSmsToTransactions(mockMessages);

    if (parsed.length > 0) {
      onSetTransactions([...parsed, ...transactions]);
      setBulkSmsText('');
      setShowBulkPasteModal(false);
      setSyncStatus(
        lang === 'ar'
          ? `✓ تم تحليل وقيد ${parsed.length} معاملة من النصوص الملصقة!`
          : `✓ Parsed & logged ${parsed.length} transactions from pasted text batch!`
      );
      setTimeout(() => setSyncStatus(null), 5000);
    } else {
      alert(lang === 'ar' ? 'لم يتم العثور على مبالغ صالحة في النصوص المدخلة.' : 'No valid bank debit/credit amounts found in text.');
    }
  };

  // Load sample multi-month historic dataset
  const handleLoadMultiMonthSample = async () => {
    const sampleBatch: PhoneSmsMessage[] = [
      // October 2026
      {
        address: 'AlRajhiBank',
        body: 'مصرف الراجحي: شراء عبر نقاط البيع بمبلغ 184.50 ر.س لدى بنده ببطاقة مدى **8821 في 2026-10-24',
        date: new Date('2026-10-24T14:30:00Z').getTime(),
      },
      {
        address: 'SNB-AlAhli',
        body: 'البنك الأهلي SNB: تم تحويل مبلغ 4,500.00 ريال عبر نظام سريع لصالح إيجار شقة الرياض في 2026-10-01',
        date: new Date('2026-10-01T09:00:00Z').getTime(),
      },
      {
        address: 'STC-Pay',
        body: 'STC Pay: تم سداد فاتورة بنجاح بقيمة 287.50 SAR لصالح STC Fiber',
        date: new Date('2026-10-18T16:00:00Z').getTime(),
      },
      {
        address: 'AlRajhiBank',
        body: 'مصرف الراجحي: تم إيداع راتب شهري بمبلغ 22,500.00 ر.س في حسابك الجاري **3920',
        date: new Date('2026-10-27T08:00:00Z').getTime(),
      },
      // September 2026
      {
        address: 'AlRajhiBank',
        body: 'مصرف الراجحي: تم إيداع راتب شهري بمبلغ 22,500.00 ر.س في حسابك الجاري **3920',
        date: new Date('2026-09-27T08:00:00Z').getTime(),
      },
      {
        address: 'SNB-AlAhli',
        body: 'Your account ending in 4920 was debited by SAR 1,240.00 at Carrefour on 15-SEP-2026',
        date: new Date('2026-09-15T12:00:00Z').getTime(),
      },
      {
        address: 'RiyadBank',
        body: 'بنك الرياض: تمت عملية شراء بمبلغ 320.00 ر.س لدى ساكو بواسطة البطاقة الائتمانية **4012',
        date: new Date('2026-09-08T18:00:00Z').getTime(),
      },
      // August 2026
      {
        address: 'AlRajhiBank',
        body: 'مصرف الراجحي: تم إيداع راتب شهري بمبلغ 22,500.00 ر.س في حسابك الجاري **3920',
        date: new Date('2026-08-27T08:00:00Z').getTime(),
      },
      {
        address: 'AlinmaBank',
        body: 'مصرف الإنماء: تم خصم مبلغ 850.00 ر.س لدى طيران ناس فرع الرياض',
        date: new Date('2026-08-12T11:00:00Z').getTime(),
      },
    ];

    const parsed = await parseHistoricSmsToTransactions(sampleBatch);
    onSetTransactions(parsed);
    setSyncStatus(
      lang === 'ar'
        ? '✓ تم تحميل سجل رسائل تاريخي لـ 3 أشهر وحساب التدفق المالي تلقائياً!'
        : '✓ Loaded 3-month historic SMS record with automatic monthly debit & credit calculation!'
    );
    setTimeout(() => setSyncStatus(null), 5000);
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden space-y-4 p-5 sm:p-6">
      {/* Header and Sync Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Smartphone className="w-3.5 h-3.5" />
              {lang === 'ar' ? 'مزامنة رسائل الهاتف SMS' : 'Phone SMS Auto-Sync'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              {lang === 'ar' ? 'معالجة محلية 100% بالهاتف' : '100% On-Device Local Processing'}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {lang === 'ar'
              ? 'التقرير الشهري التلقائي للوارد والمصروف (من رسائل SMS)'
              : 'Automatic Monthly Debit & Credit Collation (from SMS)'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {lang === 'ar'
              ? 'قراءة سجل الرسائل النصية بالهاتف، واستخراج المبالغ والتاريخ، واحتساب إجمالي المصروف والوارد لكل شهر آلياً.'
              : 'Reads phone SMS inbox, extracts dates & amounts, and automatically calculates monthly debits vs. credits.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Sync Button */}
          <button
            type="button"
            onClick={() => handleSyncDeviceSms(true)}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {isSyncing
                ? (lang === 'ar' ? 'جاري القراءة...' : 'Scanning SMS...')
                : (lang === 'ar' ? 'مزامنة رسائل هاتفي الآن 🔄' : 'Auto-Sync Phone SMS 🔄')}
            </span>
          </button>

          {/* Remove Test Data Button */}
          {transactions.length > 0 && (
            <button
              type="button"
              onClick={handleClearTestData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 transition cursor-pointer"
              title="Remove existing mock data"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'حذف البيانات التجريبية' : 'Clear Test Data'}</span>
            </button>
          )}

          {/* Web / Batch Paste Button */}
          <button
            type="button"
            onClick={() => setShowBulkPasteModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>{lang === 'ar' ? 'لصق دفعة رسائل' : 'Batch Paste'}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Feedback Toast */}
      {syncStatus && (
        <div className="p-3.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-200 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Empty State when no transactions exist */}
      {transactions.length === 0 && (
        <div className="text-center py-10 px-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <Smartphone className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">
            {lang === 'ar' ? 'لا توجد معاملات مسجلة حالياً' : 'No Transactions in Ledger'}
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {lang === 'ar'
              ? 'تم تفريغ السجل. اضغط على زر "مزامنة رسائل هاتفي الآن" لسحب رسائل البنك، أو جرب نموذج الـ 3 أشهر.'
              : 'Ledger is clean. Tap "Auto-Sync Phone SMS" to import your real bank texts, or load a multi-month demo.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => handleSyncDeviceSms(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-md cursor-pointer"
            >
              {lang === 'ar' ? 'مزامنة رسائل الهاتف SMS' : 'Sync Phone SMS'}
            </button>
            <button
              onClick={handleLoadMultiMonthSample}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:text-white cursor-pointer"
            >
              {lang === 'ar' ? 'تجربة عينة 3 أشهر' : 'Load 3-Month Sample'}
            </button>
          </div>
        </div>
      )}

      {/* Monthly Collation Cards List */}
      {monthlyRecords.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold uppercase tracking-wider">
              {lang === 'ar' ? 'الشهور المحتسبة تلقائياً من الرسائل:' : 'Calculated Monthly Records:'}
            </span>
            <span>{monthlyRecords.length} {lang === 'ar' ? 'شهور' : 'Months Active'}</span>
          </div>

          <div className="space-y-3">
            {monthlyRecords.map((month) => {
              const isExpanded = expandedMonth === month.monthKey;
              const isNetPositive = month.netHalalas >= 0n;

              return (
                <div
                  key={month.monthKey}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden transition-all hover:border-slate-750"
                >
                  {/* Month Summary Bar */}
                  <div
                    onClick={() => setExpandedMonth(isExpanded ? null : month.monthKey)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-900/50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 font-bold text-xs flex-shrink-0">
                        <Calendar className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {month.monthLabel}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                            {month.transactionsCount} {lang === 'ar' ? 'معاملة' : 'txns'}
                          </span>
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          <span>
                            {lang === 'ar' ? 'المصروف:' : 'Debit:'}{' '}
                            <strong className="text-rose-400">
                              -{formatMoney(moneyFromHalalas(month.totalDebitHalalas))}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            {lang === 'ar' ? 'الوارد:' : 'Credit:'}{' '}
                            <strong className="text-emerald-400">
                              +{formatMoney(moneyFromHalalas(month.totalCreditHalalas))}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">
                          {lang === 'ar' ? 'صافي الشهر' : 'Net Cashflow'}
                        </span>
                        <span
                          className={`text-sm font-black ${
                            isNetPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isNetPositive ? '+' : ''}
                          {formatMoney(moneyFromHalalas(month.netHalalas))}
                        </span>
                      </div>

                      <div className="p-1 rounded-lg bg-slate-800 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Monthly Transaction List */}
                  {isExpanded && (
                    <div className="border-t border-slate-800/80 bg-slate-900/40 p-4 space-y-2 animate-in fade-in">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        {lang === 'ar' ? 'تفاصيل سجل الرسائل لهذا الشهر:' : 'SMS Transactions for this Month:'}
                      </div>

                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                        {month.transactions.map((tx) => {
                          const isIncome = tx.type === 'income';

                          return (
                            <div
                              key={tx.id}
                              className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition"
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                                    isIncome
                                      ? 'bg-emerald-500/10 text-emerald-400'
                                      : 'bg-rose-500/10 text-rose-400'
                                  }`}
                                >
                                  {isIncome ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                </div>
                                <div>
                                  <p className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                                    {tx.description}
                                  </p>
                                  <span className="text-[10px] text-slate-400 capitalize">
                                    {tx.category} • {new Date(tx.date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span
                                  className={`font-mono font-bold ${
                                    isIncome ? 'text-emerald-400' : 'text-rose-400'
                                  }`}
                                >
                                  {isIncome ? '+' : '-'}
                                  {formatMoney(moneyFromHalalas(tx.amountHalalas))}
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  {tx.notes || 'SMS Synced'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Batch Paste SMS Modal (Web / Manual Fallback) */}
      {showBulkPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                {lang === 'ar' ? 'لصق دفعة رسائل نصية متعددة' : 'Batch Paste Historic SMS Messages'}
              </h4>
              <button
                onClick={() => setShowBulkPasteModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {lang === 'ar'
                ? 'الصق عدة رسائل بنكية معاً (افصل بين كل رسالة بسطر فارغ). سيقوم النظام باستخراج المبالغ والتصنيفات وتوزيعها على الشهور تلقائياً.'
                : 'Paste multiple bank SMS messages (separated by blank lines). Pocketfree will extract amounts and calculate monthly records.'}
            </p>

            <textarea
              value={bulkSmsText}
              onChange={(e) => setBulkSmsText(e.target.value)}
              rows={6}
              placeholder={`مصرف الراجحي: شراء عبر نقاط البيع بمبلغ 184.50 ر.س لدى بنده ببطاقة مدى **8821\n\nالبنك الأهلي SNB: تم تحويل مبلغ 4,500.00 ريال عبر نظام سريع لصالح إيجار شقة\n\nSTC Pay: تم سداد فاتورة بنجاح بقيمة 287.50 SAR لصالح STC Fiber`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkPasteModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleProcessBulkSms}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer"
              >
                {lang === 'ar' ? 'تحليل وقيد الدفعة' : 'Parse & Collate Batch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
