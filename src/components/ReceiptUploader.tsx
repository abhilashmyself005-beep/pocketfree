'use client';

import React, { useState } from 'react';
import {
  UploadCloud,
  FileCheck2,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Receipt,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Transaction } from '@/core/transactions';
import { moneyFromHalalas, formatMoney } from '@/core/money';
import { encodeZatcaTlv } from '@/core/receipts';

interface ReceiptUploaderProps {
  onAddTransaction: (tx: Transaction) => void;
  lang: 'en' | 'ar';
}

export const ReceiptUploader: React.FC<ReceiptUploaderProps> = ({ onAddTransaction, lang }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedReceipt, setExtractedReceipt] = useState<{
    merchantName: string;
    vatNumber?: string;
    totalHalalas: bigint;
    vatHalalas: bigint;
    verifiedSavingsHalalas: bigint;
    zatcaCompliant: boolean;
    candidateTx: Transaction;
  } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sample ZATCA receipts for instant demonstration
  const handleLoadSampleZatca = async (type: 'tamimi' | 'danube' | 'jarir') => {
    setIsProcessing(true);
    setErrorMessage(null);
    setNotification(null);

    try {
      let zatcaQr = '';
      let ocrText = '';

      if (type === 'tamimi') {
        zatcaQr = encodeZatcaTlv({
          sellerName: 'شركة أسواق التميمي المحدودة',
          vatNumber: '300055443322003',
          timestamp: '2026-10-27T11:20:00Z',
          totalAmount: '287.50',
          vatAmount: '37.50',
        });
      } else if (type === 'danube') {
        ocrText = `
          Danube Supermarket - Riyadh
          الرقم الضريبي: 300012345678903
          Almarai Milk 2L           11.00 SAR
          Sunbullah Bread            6.50 SAR
          Anchor Butter 200g        14.00 SAR
          DISCOUNT / خصم ترويجي:     5.50 SAR
          -----------------------------------
          TOTAL / الإجمالي:          26.00 SAR
        `;
      } else {
        ocrText = `
          مكتبة جرير - Jarir Bookstore
          الرقم الضريبي: 300099887766003
          Apple USB-C Power Adapter  99.00 SAR
          Logitech Wireless Mouse   120.00 SAR
          DISCOUNT / وفر خاص:       20.00 SAR
          -----------------------------------
          TOTAL / الإجمالي:         199.00 SAR
        `;
      }

      const res = await fetch('/api/receipts/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zatcaQrBase64: zatcaQr, ocrText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process receipt');

      setExtractedReceipt({
        merchantName: data.receipt.merchantName,
        vatNumber: data.receipt.vatNumber,
        totalHalalas: BigInt(data.receipt.totalHalalas),
        vatHalalas: BigInt(data.receipt.vatHalalas),
        verifiedSavingsHalalas: BigInt(data.receipt.verifiedSavingsHalalas),
        zatcaCompliant: data.receipt.zatcaCompliant,
        candidateTx: {
          ...data.candidateTransaction,
          amountHalalas: BigInt(data.candidateTransaction.amountHalalas),
          date: new Date(data.candidateTransaction.date),
          createdAt: new Date(),
        },
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error processing receipt');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAndAdd = () => {
    if (!extractedReceipt) return;
    onAddTransaction(extractedReceipt.candidateTx);
    setNotification(
      lang === 'ar'
        ? `تم إدراج فاتورة "${extractedReceipt.merchantName}" في سجل المعاملات بالهللات بنجاح!`
        : `Successfully added "${extractedReceipt.merchantName}" receipt to transaction ledger!`
    );
    setExtractedReceipt(null);
  };

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>{lang === 'ar' ? 'رفع الفواتير والمسح الضريبي الذكي' : 'Receipt OCR & ZATCA Scanner'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                Cloudflare R2 Private
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'ar'
                ? 'تخزين مشفر، فك تشفير باركود هيئة الزكاة والضريبة، واستخراج بنود الفاتورة'
                : 'Private presigned storage, ZATCA Phase 2 TLV decoding & line-item audit'}
            </p>
          </div>
        </div>

        {/* Quick Demo Previews */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            {lang === 'ar' ? 'نماذج جاهزة:' : 'Sample Receipts:'}
          </span>
          <button
            onClick={() => handleLoadSampleZatca('tamimi')}
            type="button"
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-xs"
          >
            Tamimi (ZATCA QR)
          </button>
          <button
            onClick={() => handleLoadSampleZatca('danube')}
            type="button"
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-xs"
          >
            Danube (OCR)
          </button>
          <button
            onClick={() => handleLoadSampleZatca('jarir')}
            type="button"
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-xs"
          >
            Jarir (Promo Discount)
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-400 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-6 text-center transition bg-slate-900/40 group cursor-pointer">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setIsProcessing(true);
            setErrorMessage(null);
            try {
              // Convert to Base64 for processing
              const reader = new FileReader();
              reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                const res = await fetch('/api/receipts/process', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ fileBase64: base64 }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to process receipt');
                setExtractedReceipt({
                  merchantName: data.receipt.merchantName,
                  vatNumber: data.receipt.vatNumber,
                  totalHalalas: BigInt(data.receipt.totalHalalas),
                  vatHalalas: BigInt(data.receipt.vatHalalas),
                  verifiedSavingsHalalas: BigInt(data.receipt.verifiedSavingsHalalas),
                  zatcaCompliant: data.receipt.zatcaCompliant,
                  candidateTx: {
                    ...data.candidateTransaction,
                    amountHalalas: BigInt(data.candidateTransaction.amountHalalas),
                    date: new Date(data.candidateTransaction.date),
                    createdAt: new Date(),
                  },
                });
                setIsProcessing(false);
              };
              reader.readAsDataURL(file);
            } catch (err: unknown) {
              setErrorMessage(err instanceof Error ? err.message : 'Upload failed');
              setIsProcessing(false);
            }
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="p-3 rounded-2xl bg-slate-800/80 text-emerald-400 group-hover:scale-105 transition">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {isProcessing
                ? lang === 'ar'
                  ? 'جاري فحص التوقيع الرقمي واستخراج البنود بالذكاء الاصطناعي...'
                  : 'Validating magic bytes & extracting ZATCA line items...'
                : lang === 'ar'
                ? 'اسحب وأفلت الفاتورة الضريبية أو انقر للاختيار'
                : 'Drag & drop private tax receipt or browse files'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports PNG, JPEG, WEBP, PDF (Up to 10MB) • Private R2 encrypted storage
            </p>
          </div>
        </div>
      </div>

      {/* Extracted Receipt Preview Card */}
      {extractedReceipt && (
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-white">{extractedReceipt.merchantName}</h4>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  {extractedReceipt.zatcaCompliant && (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      ZATCA QR Verified (VAT: {extractedReceipt.vatNumber})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold font-mono text-white">
                {formatMoney(moneyFromHalalas(extractedReceipt.totalHalalas), { locale: lang, useSymbol: true })}
              </div>
              <div className="text-[10px] text-slate-400">
                15% VAT: {formatMoney(moneyFromHalalas(extractedReceipt.vatHalalas), { locale: lang, useSymbol: true })}
              </div>
            </div>
          </div>

          {/* Savings Highlight */}
          {extractedReceipt.verifiedSavingsHalalas > 0n && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {lang === 'ar'
                  ? `تم رصد وفر ترويجي موثق بقيمة ${formatMoney(moneyFromHalalas(extractedReceipt.verifiedSavingsHalalas), { locale: lang, useSymbol: true })}!`
                  : `Detected verified promotional savings of ${formatMoney(moneyFromHalalas(extractedReceipt.verifiedSavingsHalalas), { locale: lang, useSymbol: true })}!`}
              </span>
            </div>
          )}

          {/* Action to Push to Ledger */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setExtractedReceipt(null)}
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
            >
              {lang === 'ar' ? 'تراجع' : 'Dismiss'}
            </button>
            <button
              onClick={handleConfirmAndAdd}
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition cursor-pointer"
            >
              <span>{lang === 'ar' ? 'إدراج في سجل المصروفات' : 'Confirm & Add to Ledger'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
