'use client';

import React from 'react';
import {
  LayoutDashboard,
  MessageSquareCode,
  Layers,
  ShoppingBag,
  CalendarClock,
  Plus,
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenAddModal: () => void;
  lang: 'en' | 'ar';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onOpenAddModal,
  lang,
}) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 shadow-2xl"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl text-slate-400 hover:text-emerald-400 active:scale-95 transition-all"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </span>
        </button>

        {/* Tab 2: SMS Alerts */}
        <button
          onClick={() => scrollToSection('section-finart-alerts')}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl text-slate-400 hover:text-emerald-400 active:scale-95 transition-all"
        >
          <MessageSquareCode className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">
            {lang === 'ar' ? 'الإشعارات' : 'Alerts'}
          </span>
        </button>

        {/* Center Floating Action Button: Quick Add */}
        <button
          onClick={onOpenAddModal}
          className="flex flex-col items-center justify-center -mt-5 p-3 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/40 active:scale-90 transition-all border-4 border-slate-950 cursor-pointer"
          title="Add Transaction"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Tab 3: Envelopes */}
        <button
          onClick={() => scrollToSection('section-zero-based-envelopes')}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl text-slate-400 hover:text-purple-400 active:scale-95 transition-all"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">
            {lang === 'ar' ? 'المظاريف' : 'Envelopes'}
          </span>
        </button>

        {/* Tab 4: Shopping */}
        <button
          onClick={() => scrollToSection('section-shopping-optimizer')}
          className="flex flex-col items-center justify-center p-1.5 rounded-xl text-slate-400 hover:text-amber-400 active:scale-95 transition-all"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-0.5">
            {lang === 'ar' ? 'التسوق' : 'Deals'}
          </span>
        </button>
      </div>
    </nav>
  );
};
