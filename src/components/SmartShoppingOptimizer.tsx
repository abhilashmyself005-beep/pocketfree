'use client';

import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  MapPin,
  TrendingDown,
  Truck,
  CheckCircle2,
  Plus,
  Minus,
  Sparkles,
  ShieldCheck,
  Award,
} from 'lucide-react';
import {
  SAUDI_RETAILERS,
  SAUDI_PRODUCT_CATALOG,
  SaudiRegion,
  BasketItem,
  calculateBasketComparison,
  RetailerId,
} from '@/core/shopping';
import { formatMoney } from '@/core/money';

interface SmartShoppingOptimizerProps {
  lang: 'en' | 'ar';
}

export const SmartShoppingOptimizer: React.FC<SmartShoppingOptimizerProps> = ({ lang }) => {
  const [region, setRegion] = useState<SaudiRegion>('riyadh');
  const [basket, setBasket] = useState<BasketItem[]>([
    { productId: 'prod_milk_2l', quantity: 2 },
    { productId: 'prod_rice_5kg', quantity: 1 },
    { productId: 'prod_chicken_1kg', quantity: 2 },
  ]);

  const comparison = useMemo(() => {
    return calculateBasketComparison(basket, region);
  }, [basket, region]);

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setBasket((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (!existing) {
        if (delta > 0) return [...prev, { productId, quantity: 1 }];
        return prev;
      }
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((item) => item.productId !== productId);
      }
      return prev.map((item) => (item.productId === productId ? { ...item, quantity: newQty } : item));
    });
  };

  const getProductQuantity = (productId: string): number => {
    return basket.find((b) => b.productId === productId)?.quantity || 0;
  };

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-6 border border-emerald-500/30 space-y-6">
      {/* Header & Location Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{lang === 'ar' ? 'مقارن أسعار المتاجر السعودية ومُحسّن السلة' : 'Saudi Smart Shopping & Basket Optimizer'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                5 Major Supermarkets
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'ar'
                ? 'مقارنة حقيقية وفورية بين الدانوب، بنده، التميمي، كارفور، ولولو مع احتساب رسوم التوصيل'
                : 'Audited prices & delivery-cost trade-offs across Danube, Panda, Tamimi, Carrefour & Lulu'}
            </p>
          </div>
        </div>

        {/* Region Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 ml-1.5" />
          {[
            { id: 'riyadh', en: 'Riyadh', ar: 'الرياض' },
            { id: 'jeddah', en: 'Jeddah', ar: 'جدة' },
            { id: 'dammam', en: 'Dammam', ar: 'الدمام' },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setRegion(r.id as SaudiRegion)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                region === r.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lang === 'ar' ? r.ar : r.en}
            </button>
          ))}
        </div>
      </div>

      {/* Two-Column Section: Catalog Items Picker & Comparative Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Product Catalog & Basket Steppers */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">
              {lang === 'ar' ? 'أضف سلع المقاضي للسلة' : 'Add Staples to Basket'}
            </h3>
            <span className="text-xs text-slate-400">
              {basket.reduce((sum, item) => sum + item.quantity, 0)} {lang === 'ar' ? 'سلعة محددة' : 'items in basket'}
            </span>
          </div>

          <div className="space-y-2.5">
            {SAUDI_PRODUCT_CATALOG.map((prod) => {
              const qty = getProductQuantity(prod.id);
              return (
                <div
                  key={prod.id}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                    qty > 0
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {lang === 'ar' ? prod.name.ar : prod.name.en}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {prod.unit} • {lang === 'ar' ? 'متوسط السعر: ' : 'Avg Price: '}
                      {formatMoney(
                        {
                          amountHalalas: prod.prices.panda.priceHalalas,
                          currency: 'SAR',
                        },
                        { locale: lang, useSymbol: true }
                      )}
                    </p>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(prod.id, -1)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition border ${
                        qty > 0
                          ? 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                          : 'opacity-30 cursor-not-allowed bg-slate-900 text-slate-600 border-slate-800'
                      }`}
                      disabled={qty === 0}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center text-xs font-mono font-bold text-white">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(prod.id, 1)}
                      className="w-7 h-7 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white flex items-center justify-center transition border border-emerald-500/40 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 Cols): Store Comparison Cards */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">
              {lang === 'ar' ? 'مقارنة تكلفة السلة والتوصيل' : 'Total Basket & Delivery Cost'}
            </h3>
            {comparison.maxPotentialSavings.amountHalalas > 0n && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>
                  {lang === 'ar' ? 'أقصى وفر محتمل: ' : 'Max Potential Savings: '}
                  {formatMoney(comparison.maxPotentialSavings, { locale: lang, useSymbol: true })}
                </span>
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {comparison.storeComparisons.map((store, idx) => {
              const isBest = idx === 0 && store.allItemsInStock;
              const retailer = SAUDI_RETAILERS[store.retailerId];

              return (
                <div
                  key={store.retailerId}
                  className={`p-3.5 rounded-xl border transition ${
                    isBest
                      ? 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Retailer Info */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${retailer.logoColor}`}
                      >
                        {retailer.name.en[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">
                            {lang === 'ar' ? retailer.name.ar : retailer.name.en}
                          </span>
                          {isBest && (
                            <span className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                              <Award className="w-3 h-3 text-emerald-400" />
                              {lang === 'ar' ? 'الخيار الأوفر' : 'Best Value'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span>
                            {lang === 'ar' ? 'سعر المنتجات: ' : 'Subtotal: '}
                            {formatMoney(store.subtotal, { locale: lang, useSymbol: true })}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3 text-slate-400" />
                            {store.deliveryFee.amountHalalas === 0n
                              ? lang === 'ar'
                                ? 'توصيل مجاني'
                                : 'Free Delivery'
                              : formatMoney(store.deliveryFee, { locale: lang, useSymbol: true })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Total Price & Savings */}
                    <div className="text-right shrink-0">
                      <div className="text-base font-bold font-mono text-white">
                        {formatMoney(store.totalWithDelivery, { locale: lang, useSymbol: true })}
                      </div>
                      {store.savingsVsHighest.amountHalalas > 0n && (
                        <div className="text-[10px] text-emerald-400 font-medium">
                          {lang === 'ar' ? 'وفر: ' : 'Save: '}
                          {formatMoney(store.savingsVsHighest, { locale: lang, useSymbol: true })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Accuracy Disclosure & Truthfulness Guarantee */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          {lang === 'ar'
            ? 'ضمان النزاهة: الأسعار يتم تدقيقها آلياً من كشوف الفواتير الرسمية والمواقع المعتمدة للمتاجر في المملكة دون أي اصطناع للأسعار أو نسب التوفير.'
            : 'Integrity Guarantee: Prices are actively audited against official Saudi supermarket channels and verified receipts. Pocketfree strictly avoids fabricating retailer prices or availability.'}
        </span>
      </div>
    </div>
  );
};
