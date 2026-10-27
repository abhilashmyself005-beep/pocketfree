import { describe, it, expect } from 'vitest';
import {
  calculateBasketComparison,
  SAUDI_PRODUCT_CATALOG,
  SAUDI_RETAILERS,
  BasketItem,
} from '../src/core/shopping';

describe('Saudi Smart Shopping & Price Comparison Engine', () => {
  it('strictly contains verified timestamps and non-empty prices for all catalog items', () => {
    for (const prod of SAUDI_PRODUCT_CATALOG) {
      expect(prod.barcode.length).toBeGreaterThan(5);
      for (const retailerId of Object.keys(SAUDI_RETAILERS) as Array<keyof typeof SAUDI_RETAILERS>) {
        const priceEntry = prod.prices[retailerId];
        expect(priceEntry).toBeDefined();
        expect(priceEntry.priceHalalas).toBeGreaterThan(0n);
        expect(priceEntry.lastAuditedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
      }
    }
  });

  it('calculates basket subtotal and selects the most cost-effective retailer', () => {
    // Basket: 2x Almarai Milk 2L, 1x Abu Kass Rice 5kg, 1x Afia Corn Oil 1.5L
    const basket: BasketItem[] = [
      { productId: 'prod_milk_2l', quantity: 2 },
      { productId: 'prod_rice_5kg', quantity: 1 },
      { productId: 'prod_oil_1_5l', quantity: 1 },
    ];

    const result = calculateBasketComparison(basket, 'riyadh');

    expect(result.storeComparisons.length).toBe(5);
    expect(result.bestSingleStore).toBeDefined();

    // Verify best store has the lowest total cost with delivery
    for (const store of result.storeComparisons) {
      expect(result.bestSingleStore.totalWithDelivery.amountHalalas).toBeLessThanOrEqual(
        store.totalWithDelivery.amountHalalas
      );
    }
  });

  it('waives delivery fee when subtotal reaches free delivery threshold', () => {
    // 10x Rice 5kg (~450 SAR) -> exceeds all stores free delivery thresholds
    const largeBasket: BasketItem[] = [{ productId: 'prod_rice_5kg', quantity: 10 }];

    const result = calculateBasketComparison(largeBasket, 'riyadh');

    for (const store of result.storeComparisons) {
      expect(store.deliveryFee.amountHalalas).toBe(0n);
    }
  });

  it('accurately computes estimated savings vs. most expensive retailer in Halalas', () => {
    const basket: BasketItem[] = [
      { productId: 'prod_milk_2l', quantity: 3 },
      { productId: 'prod_rice_5kg', quantity: 2 },
      { productId: 'prod_chicken_1kg', quantity: 4 },
    ];

    const result = calculateBasketComparison(basket, 'riyadh');

    expect(result.maxPotentialSavings.amountHalalas).toBeGreaterThan(0n);
    // Highest store has 0 savings vs itself
    const mostExpensiveStore = result.storeComparisons[result.storeComparisons.length - 1];
    expect(mostExpensiveStore.savingsVsHighest.amountHalalas).toBe(0n);
  });
});
