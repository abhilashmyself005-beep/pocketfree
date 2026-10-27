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
} from 'lucide-react';

interface NavbarProps {
  onOpenAddModal: () => void;
  lang: 'en' | 'ar';
  onToggleLang: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAddModal, lang, onToggleLang }) => {
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
        <div className="flex items-center gap-3">
          {/* Android APK Download Badge */}
          <a
            href="/downloads/pocketfree.apk"
            download="pocketfree.apk"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 transition shadow-sm"
            title="Download Android APK"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Android APK</span>
            <span className="sm:hidden">APK</span>
          </a>

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
    </header>
  );
};
