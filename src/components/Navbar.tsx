'use client';

import React from 'react';
import {
  Wallet,
  ShieldCheck,
  Globe,
  PlusCircle,
  TrendingUp,
  Smartphone,
  Download,
  QrCode,
  X,
} from 'lucide-react';

interface NavbarProps {
  onOpenAddModal: () => void;
  lang: 'en' | 'ar';
  onToggleLang: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAddModal, lang, onToggleLang }) => {
  const [showQrModal, setShowQrModal] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 glass-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold ring-1 ring-white/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Pocketfree
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                KSA • المملكة
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              {lang === 'ar' ? 'المالية الشخصية والتسوق الذكي في السعودية' : 'Saudi Personal Finance & Smart Shopping'}
            </p>
          </div>
        </div>

        {/* Center: Precision & Compliance Badges */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Halala-Exact Math</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-300">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>ZATCA 15% VAT Compliant</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Android APK Download Badge */}
          <div className="flex items-center rounded-lg border border-emerald-500/30 bg-emerald-950/60 p-0.5 shadow-sm">
            <a
              href="/downloads/pocketfree.apk"
              download="pocketfree.apk"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-emerald-300 hover:text-white hover:bg-emerald-800/40 transition"
              title="Download Android APK (Direct)"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Download APK</span>
              <span className="sm:hidden">APK</span>
            </a>
            <button
              onClick={() => setShowQrModal(true)}
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-emerald-300 hover:text-white hover:bg-emerald-800/40 border-l border-emerald-500/30 transition cursor-pointer"
              title="Scan QR Code to download on Mobile"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Scan QR</span>
            </button>
          </div>

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{lang === 'en' ? 'العربية' : 'English'}</span>
          </button>

          {/* New Transaction Button */}
          <button
            onClick={onOpenAddModal}
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition active:scale-95 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{lang === 'ar' ? 'إضافة معاملة نقدية' : 'Add Cash Entry'}</span>
          </button>
        </div>
      </div>

      {/* QR Code Modal for Mobile APK Sideload */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close QR Modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">
              {lang === 'ar' ? 'امسح الرمز لتحميل التطبيق' : 'Scan to Download APK'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {lang === 'ar'
                ? 'وجّه كاميرا هاتفك المحمول نحو الرمز لتحميل ملف APK مباشرة'
                : 'Point your mobile camera at the QR code to download the Android APK directly.'}
            </p>

            {/* QR Code Display Container */}
            <div className="p-4 bg-white rounded-xl shadow-inner inline-block mx-auto mb-4 ring-4 ring-emerald-500/20">
              <img
                src="/downloads/apk-qr.png"
                alt="Pocketfree APK Download QR Code"
                className="w-52 h-52 object-contain mx-auto"
              />
            </div>

            <div className="text-xs text-slate-400 space-y-1 mb-4">
              <p className="font-semibold text-emerald-400">Pocketfree v1.0.0 (4.12 MB)</p>
              <p className="text-[11px] text-slate-500">Android 8.0+ • Local-First PDPL Privacy</p>
            </div>

            <div className="flex gap-2">
              <a
                href="/downloads/pocketfree.apk"
                download="pocketfree.apk"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Direct Download</span>
              </a>
              <button
                onClick={() => setShowQrModal(false)}
                className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
