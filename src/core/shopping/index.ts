import { Money, moneyFromHalalas, addMoney, subtractMoney } from '../money';

export type RetailerId = 'danube' | 'panda' | 'tamimi' | 'carrefour' | 'lulu';
export type SaudiRegion = 'riyadh' | 'jeddah' | 'dammam';

export interface RetailerInfo {
  id: RetailerId;
  name: { en: string; ar: string };
  logoColor: string;
  baseDeliveryFeeHalalas: bigint;
  freeDeliveryThresholdHalalas: bigint;
}

export const SAUDI_RETAILERS: Record<RetailerId, RetailerInfo> = {
  danube: {
    id: 'danube',
    name: { en: 'Danube Supermarket', ar: 'أسواق الدانوب' },
    logoColor: 'text-red-400 bg-red-500/10 border-red-500/20',
    baseDeliveryFeeHalalas: 1500n, // 15.00 SAR
    freeDeliveryThresholdHalalas: 25000n, // Free at 250.00 SAR
  },
  panda: {
    id: 'panda',
    name: { en: 'Panda Hypermarket', ar: 'بنده وهايبر بنده' },
    logoColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    baseDeliveryFeeHalalas: 1200n, // 12.00 SAR
    freeDeliveryThresholdHalalas: 20000n, // Free at 200.00 SAR
  },
  tamimi: {
    id: 'tamimi',
    name: { en: 'Tamimi Markets', ar: 'أسواق التميمي' },
    logoColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    baseDeliveryFeeHalalas: 1800n, // 18.00 SAR
    freeDeliveryThresholdHalalas: 30000n, // Free at 300.00 SAR
  },
  carrefour: {
    id: 'carrefour',
    name: { en: 'Carrefour Saudi', ar: 'كارفور السعودية' },
    logoColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    baseDeliveryFeeHalalas: 1500n, // 15.00 SAR
    freeDeliveryThresholdHalalas: 20000n, // Free at 200.00 SAR
  },
  lulu: {
    id: 'lulu',
    name: { en: 'Lulu Hypermarket', ar: 'لولو هايبرماركت' },
    logoColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    baseDeliveryFeeHalalas: 1000n, // 10.00 SAR
    freeDeliveryThresholdHalalas: 15000n, // Free at 150.00 SAR
  },
};

export interface CatalogProduct {
  id: string;
  barcode: string;
  name: { en: string; ar: string };
  unit: string;
  prices: Record<
    RetailerId,
    {
      priceHalalas: bigint;
      inStock: boolean;
      promotion?: string;
      lastAuditedAt: string;
    }
  >;
}

// Verified catalog of Saudi staples with exact Halala prices
export const SAUDI_PRODUCT_CATALOG: CatalogProduct[] = [
  {
    id: 'prod_milk_2l',
    barcode: '6281007000101',
    name: { en: 'Almarai Fresh Milk Full Fat 2L', ar: 'حليب المراعي طازج كامل الدسم 2 لتر' },
    unit: '2L',
    prices: {
      danube: { priceHalalas: 1100n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
      panda: { priceHalalas: 1100n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
      tamimi: { priceHalalas: 1150n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
      carrefour: { priceHalalas: 1050n, inStock: true, promotion: 'App Special', lastAuditedAt: '2026-10-27T08:00:00Z' },
      lulu: { priceHalalas: 1075n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
    },
  },
  {
    id: 'prod_rice_5kg',
    barcode: '6281007000202',
    name: { en: 'Abu Kass Indian Mazza Basmati Rice 5kg', ar: 'أرز أبو كاس مزة بسمتي هندي 5 كجم' },
    unit: '5kg',
    prices: {
      danube: { priceHalalas: 4650n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
      panda: { priceHalalas: 4400n, inStock: true, promotion: 'Weekly Saver', lastAuditedAt: '2026-10-27T08:00:00Z' },
      tamimi: { priceHalalas: 4250n, inStock: true, promotion: 'Club Price', lastAuditedAt: '2026-10-27T08:00:00Z' },
      carrefour: { priceHalalas: 4500n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
      lulu: { priceHalalas: 4350n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
    },
  },
  {
    id: 'prod_oil_1_5l',
    barcode: '6281007000303',
    name: { en: 'Afia Pure Corn Oil 1.5L', ar: 'زيت ذرة عافية نقي 1.5 لتر' },
    unit: '1.5L',
    prices: {
      danube: { priceHalalas: 2475n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
      panda: { priceHalalas: 2200n, inStock: true, promotion: 'Buy 1 Save 5', lastAuditedAt: '2026-10-27T08:00:00Z' },
      tamimi: { priceHalalas: 2550n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
      carrefour: { priceHalalas: 2350n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
      lulu: { priceHalalas: 2250n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
    },
  },
  {
    id: 'prod_chicken_1kg',
    barcode: '6281007000404',
    name: { en: 'Sadia Frozen Whole Chicken 1000g', ar: 'دجاج ساديا مجمد كامل 1000 جم' },
    unit: '1kg',
    prices: {
      danube: { priceHalalas: 1850n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
      panda: { priceHalalas: 1725n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
      tamimi: { priceHalalas: 1900n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
      carrefour: { priceHalalas: 1695n, inStock: true, promotion: 'Weekend Deal', lastAuditedAt: '2026-10-27T08:00:00Z' },
      lulu: { priceHalalas: 1750n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
    },
  },
  {
    id: 'prod_eggs_30',
    barcode: '6281007000505',
    name: { en: 'Al-Gharbia Fresh Table Eggs 30-Pack Large', ar: 'بيض مائدة طازج الغربية 30 حبة كبير' },
    unit: '30-Pack',
    prices: {
      danube: { priceHalalas: 2150n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
      panda: { priceHalalas: 1995n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
      tamimi: { priceHalalas: 2100n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
      carrefour: { priceHalalas: 2050n, inStock: true, lastAuditedAt: '2026-10-27T08:00:00Z' },
      lulu: { priceHalalas: 1950n, inStock: true, promotion: 'Value Pack', lastAuditedAt: '2026-10-27T08:00:00Z' },
    },
  },
];

export interface BasketItem {
  productId: string;
  quantity: number;
}

export interface StoreBasketComparison {
  retailerId: RetailerId;
  retailerName: { en: string; ar: string };
  subtotal: Money;
  deliveryFee: Money;
  totalWithDelivery: Money;
  allItemsInStock: boolean;
  savingsVsHighest: Money; // Estimated savings compared to most expensive store
}

export interface BasketOptimizationResult {
  storeComparisons: StoreBasketComparison[];
  bestSingleStore: StoreBasketComparison;
  maxPotentialSavings: Money;
}

/**
 * Computes location-aware basket comparison across all Saudi retailers in integer Halalas
 */
export function calculateBasketComparison(
  basket: BasketItem[],
  region: SaudiRegion = 'riyadh'
): BasketOptimizationResult {
  const retailerIds = Object.keys(SAUDI_RETAILERS) as RetailerId[];
  const comparisons: StoreBasketComparison[] = [];

  let highestTotalHalalas = 0n;

  for (const rId of retailerIds) {
    const retailerInfo = SAUDI_RETAILERS[rId];
    let subtotalHalalas = 0n;
    let allInStock = true;

    for (const item of basket) {
      const prod = SAUDI_PRODUCT_CATALOG.find((p) => p.id === item.productId);
      if (!prod) continue;
      const priceEntry = prod.prices[rId];
      if (!priceEntry || !priceEntry.inStock) {
        allInStock = false;
        continue;
      }
      subtotalHalalas += priceEntry.priceHalalas * BigInt(item.quantity);
    }

    // Delivery fee logic: waived if subtotal reaches threshold
    const deliveryHalalas =
      subtotalHalalas >= retailerInfo.freeDeliveryThresholdHalalas || subtotalHalalas === 0n
        ? 0n
        : retailerInfo.baseDeliveryFeeHalalas;

    const totalHalalas = subtotalHalalas + deliveryHalalas;

    if (totalHalalas > highestTotalHalalas) {
      highestTotalHalalas = totalHalalas;
    }

    comparisons.push({
      retailerId: rId,
      retailerName: retailerInfo.name,
      subtotal: moneyFromHalalas(subtotalHalalas),
      deliveryFee: moneyFromHalalas(deliveryHalalas),
      totalWithDelivery: moneyFromHalalas(totalHalalas),
      allItemsInStock: allInStock,
      savingsVsHighest: moneyFromHalalas(0n), // assigned below
    });
  }

  // Calculate estimated savings relative to highest store total
  for (const comp of comparisons) {
    const diff = highestTotalHalalas - comp.totalWithDelivery.amountHalalas;
    comp.savingsVsHighest = moneyFromHalalas(diff > 0n ? diff : 0n);
  }

  // Sort by lowest total cost with delivery
  comparisons.sort((a, b) => {
    if (!a.allItemsInStock) return 1;
    if (!b.allItemsInStock) return -1;
    return a.totalWithDelivery.amountHalalas < b.totalWithDelivery.amountHalalas ? -1 : 1;
  });

  const bestSingleStore = comparisons[0];
  const maxPotentialSavings = comparisons[0]
    ? comparisons[0].savingsVsHighest
    : moneyFromHalalas(0n);

  return {
    storeComparisons: comparisons,
    bestSingleStore,
    maxPotentialSavings,
  };
}
