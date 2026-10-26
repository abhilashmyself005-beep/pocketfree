import { describe, it, expect } from 'vitest';
import {
  calculateSpendVsIncome,
  computeTransactionFingerprint,
  Transaction,
} from '../src/core/transactions';

describe('Transaction Ledger & Deduplication Engine', () => {
  const userId = 'user_test_123';
  const accountId = 'acc_cash_01';

  it('computes stable SHA-256 fingerprint for deduplication', async () => {
    const date = new Date('2026-10-27T10:00:00Z');
    const fp1 = await computeTransactionFingerprint({
      userId,
      date,
      amountHalalas: 4550n,
      description: 'Panda Hypermarket - Groceries',
    });

    const fp2 = await computeTransactionFingerprint({
      userId,
      date,
      amountHalalas: 4550n,
      description: '   panda hypermarket - groceries   ', // case & whitespace normalized
    });

    expect(fp1).toBe(fp2);
    expect(fp1.length).toBe(64); // SHA-256 hex string
  });

  it('calculates spend vs income with transfer exclusion to prevent double counting', () => {
    const mockTxs: Transaction[] = [
      {
        id: '1',
        userId,
        accountId,
        type: 'income',
        category: 'salary',
        amountHalalas: 2000000n, // 20,000 SAR
        currency: 'SAR',
        date: new Date('2026-10-01'),
        description: 'Monthly Salary',
        source: 'bank_sync',
        fingerprint: 'fp_1',
        isTransfer: false,
        isRefund: false,
        createdAt: new Date(),
      },
      {
        id: '2',
        userId,
        accountId,
        type: 'expense',
        category: 'housing',
        amountHalalas: 500000n, // 5,000 SAR
        currency: 'SAR',
        date: new Date('2026-10-02'),
        description: 'Apartment Rent Riyadh',
        source: 'cash_manual',
        fingerprint: 'fp_2',
        isTransfer: false,
        isRefund: false,
        createdAt: new Date(),
      },
      {
        id: '3',
        userId,
        accountId,
        type: 'expense',
        category: 'groceries',
        amountHalalas: 120000n, // 1,200 SAR
        currency: 'SAR',
        date: new Date('2026-10-05'),
        description: 'Danube Supermarket',
        source: 'receipt_ocr',
        fingerprint: 'fp_3',
        isTransfer: false,
        isRefund: false,
        createdAt: new Date(),
      },
      // Internal transfer: Moving 3,000 SAR from Current to Savings Account
      {
        id: '4',
        userId,
        accountId,
        type: 'transfer',
        category: 'other',
        amountHalalas: 300000n, // 3,000 SAR
        currency: 'SAR',
        date: new Date('2026-10-06'),
        description: 'Transfer to Savings Vault',
        source: 'bank_sync',
        fingerprint: 'fp_4',
        isTransfer: true, // Must be excluded from spend & income!
        isRefund: false,
        createdAt: new Date(),
      },
    ];

    const result = calculateSpendVsIncome(mockTxs);

    expect(result.totalIncome.amountHalalas).toBe(2000000n); // 20,000 SAR
    expect(result.totalExpenses.amountHalalas).toBe(620000n); // 5,000 + 1,200 = 6,200 SAR (transfer excluded!)
    expect(result.netCashflow.amountHalalas).toBe(1380000n); // 13,800 SAR
    expect(result.excludedTransfersCount).toBe(1);
    expect(result.savingsRatePercentage).toBe(69); // (20,000 - 6,200) / 20,000 = 69%
  });

  it('correctly offsets expenses when a refund is recorded instead of falsely inflating income', () => {
    const mockTxs: Transaction[] = [
      {
        id: '1',
        userId,
        accountId,
        type: 'expense',
        category: 'shopping',
        amountHalalas: 50000n, // 500 SAR
        currency: 'SAR',
        date: new Date('2026-10-10'),
        description: 'Jarir Bookstore - Electronics purchase',
        source: 'bank_sync',
        fingerprint: 'fp_1',
        isTransfer: false,
        isRefund: false,
        createdAt: new Date(),
      },
      {
        id: '2',
        userId,
        accountId,
        type: 'expense',
        category: 'shopping',
        amountHalalas: 20000n, // 200 SAR refund
        currency: 'SAR',
        date: new Date('2026-10-12'),
        description: 'Jarir Bookstore - Item returned refund',
        source: 'bank_sync',
        fingerprint: 'fp_2',
        isTransfer: false,
        isRefund: true, // Offsets expense
        relatedTransactionId: '1',
        createdAt: new Date(),
      },
    ];

    const result = calculateSpendVsIncome(mockTxs);

    expect(result.totalIncome.amountHalalas).toBe(0n); // Did not falsely count refund as income
    expect(result.totalExpenses.amountHalalas).toBe(30000n); // 500 - 200 = 300 SAR (30000 halalas)
  });
});
