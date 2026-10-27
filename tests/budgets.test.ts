import { describe, it, expect } from 'vitest';
import { evaluateBudgets } from '../src/core/budgets';
import { Transaction } from '../src/core/transactions';

describe('Budget Evaluation & Threshold Alerts', () => {
  const userId = 'user_clerk_saudi_pilot';
  const accountId = 'acc_bank_riyad';

  it('correctly calculates budget consumption and flags warnings at >= 75%', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        userId,
        accountId,
        type: 'expense',
        category: 'dining',
        amountHalalas: 85000n, // 850.00 SAR (85% of 1,000 SAR target)
        currency: 'SAR',
        date: new Date(),
        description: 'Restaurants and Cafes Olaya',
        source: 'cash_manual',
        fingerprint: 'fp_d1',
        isTransfer: false,
        isRefund: false,
        createdAt: new Date(),
      },
    ];

    const result = evaluateBudgets(transactions);

    const diningBudget = result.categoryBudgets.find((b) => b.category === 'dining');
    expect(diningBudget).toBeDefined();
    expect(diningBudget?.spentPercentage).toBe(85);
    expect(diningBudget?.status).toBe('warning');
    expect(result.recommendations.some((r) => r.category === 'dining')).toBe(true);
  });

  it('flags exceeded budgets when spend is >= 100%', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        userId,
        accountId,
        type: 'expense',
        category: 'shopping',
        amountHalalas: 150000n, // 1,500.00 SAR (Target is 1,200.00 SAR)
        currency: 'SAR',
        date: new Date(),
        description: 'Jarir Electronics',
        source: 'bank_sync',
        fingerprint: 'fp_s1',
        isTransfer: false,
        isRefund: false,
        createdAt: new Date(),
      },
    ];

    const result = evaluateBudgets(transactions);
    const shoppingBudget = result.categoryBudgets.find((b) => b.category === 'shopping');

    expect(shoppingBudget?.status).toBe('exceeded');
    expect(result.overallStatus).toBe('critical');
  });
});
