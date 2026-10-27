import { describe, it, expect } from 'vitest';
import {
  calculateReadyToAssign,
  moveMoneyBetweenEnvelopes,
  calculateDebtPayoff,
  INITIAL_ENVELOPES,
  Envelope,
} from './zeroBasedEngine';

describe('Beyond Budget Replica: Zero-Based Budgeting Engine', () => {
  it('correctly calculates Ready to Assign pool from income and allocations', () => {
    // Total income 20,000 SAR (2,000,000 Halalas)
    const income = 2000000n;
    const envelopes: Envelope[] = [
      {
        id: '1',
        name: 'Rent',
        nameAr: 'إيجار',
        category: 'housing',
        targetHalalas: 600000n,
        allocatedHalalas: 600000n,
        spentHalalas: 600000n,
        iconName: 'Home',
      },
      {
        id: '2',
        name: 'Groceries',
        nameAr: 'بقالة',
        category: 'groceries',
        targetHalalas: 400000n,
        allocatedHalalas: 400000n,
        spentHalalas: 200000n,
        iconName: 'ShoppingBasket',
      },
    ];

    const ready = calculateReadyToAssign(income, envelopes);
    // 2,000,000 - (600,000 + 400,000) = 1,000,000 Halalas (10,000 SAR)
    expect(ready).toBe(1000000n);
  });

  it('allows moving money between envelopes to cover overspending', () => {
    const envelopes: Envelope[] = [
      {
        id: 'env_dining',
        name: 'Dining',
        nameAr: 'مطاعم',
        category: 'dining',
        targetHalalas: 100000n,
        allocatedHalalas: 100000n,
        spentHalalas: 120000n,
        iconName: 'Utensils',
      },
      {
        id: 'env_groceries',
        name: 'Groceries',
        nameAr: 'بقالة',
        category: 'groceries',
        targetHalalas: 200000n,
        allocatedHalalas: 200000n,
        spentHalalas: 100000n,
        iconName: 'ShoppingBasket',
      },
    ];

    // Move 200.00 SAR (20,000 Halalas) from Groceries to Dining
    const updated = moveMoneyBetweenEnvelopes(
      'env_groceries',
      'env_dining',
      20000n,
      envelopes
    );

    const dining = updated.find((e) => e.id === 'env_dining');
    const groceries = updated.find((e) => e.id === 'env_groceries');

    expect(dining?.allocatedHalalas).toBe(120000n);
    expect(groceries?.allocatedHalalas).toBe(180000n);
  });

  it('computes accelerated debt payoff timeline and interest correctly', () => {
    // 10,000 SAR at 0% Murabaha paying 1,000 SAR per month -> 10 months
    const zeroInterest = calculateDebtPayoff(1000000n, 100000n, 0);
    expect(zeroInterest.monthsToPayoff).toBe(10);
    expect(zeroInterest.estimatedCostHalalas).toBe(0n);

    // 8,500 SAR card debt at 18% APR paying 850 SAR per month -> ~12 months
    const creditCard = calculateDebtPayoff(850000n, 85000n, 18.0);
    expect(creditCard.monthsToPayoff).toBeGreaterThan(10);
    expect(creditCard.monthsToPayoff).toBeLessThan(14);
    expect(creditCard.estimatedCostHalalas).toBeGreaterThan(0n);
  });
});
