import { describe, it, expect } from 'vitest';
import {
  parseSaudiBankCsv,
  autoCategorizeSaudiMerchant,
  isInternalTransferRecord,
  isRefundRecord,
  ingestBankRecords,
} from '../src/core/banking';

describe('Saudi Bank Statement Ingestion & Deduplication', () => {
  const userId = 'user_clerk_saudi_pilot';
  const accountId = 'acc_bank_riyad';

  it('correctly auto-categorizes Saudi merchants', () => {
    expect(autoCategorizeSaudiMerchant('POS PANDA HYPERMARKET RIYADH')).toBe('groceries');
    expect(autoCategorizeSaudiMerchant('DANUBE EXIT 5')).toBe('groceries');
    expect(autoCategorizeSaudiMerchant('ALBAIK RESTAURANT OLAYA')).toBe('dining');
    expect(autoCategorizeSaudiMerchant('STC TELECOM SADAD')).toBe('utilities');
    expect(autoCategorizeSaudiMerchant('SASCO FUEL STATION 95')).toBe('transport');
    expect(autoCategorizeSaudiMerchant('JARIR BOOKSTORE TAB')).toBe('shopping');
    expect(autoCategorizeSaudiMerchant('MONTHLY SALARY PAYROLL')).toBe('salary');
  });

  it('detects internal transfers and refunds', () => {
    expect(isInternalTransferRecord('Transfer to Savings Account')).toBe(true);
    expect(isInternalTransferRecord('SARIE Transfer to Alinma Bank')).toBe(true);
    expect(isInternalTransferRecord('Grocery Purchase Panda')).toBe(false);

    expect(isRefundRecord('Refund from Amazon SA')).toBe(true);
    expect(isRefundRecord('POS Reversal Jarir Bookstore')).toBe(true);
    expect(isRefundRecord('Starbucks Coffee')).toBe(false);
  });

  it('parses Saudi CSV bank statement into structured records', () => {
    const csvData = `
Date,Narration,Debit,Credit
2026-10-25,"Panda Supermarket - Groceries",145.50,
2026-10-25,"SARIE Transfer to Savings",2000.00,
2026-10-26,"Monthly Engineering Salary",,22500.00
    `;

    const records = parseSaudiBankCsv(csvData);
    expect(records.length).toBe(3);
    expect(records[0].amount).toBe('145.50');
    expect(records[0].type).toBe('debit');
    expect(records[2].amount).toBe('22500.00');
    expect(records[2].type).toBe('credit');
  });

  it('deduplicates transactions across repeated statement imports', async () => {
    const csvData = `
Date,Description,Amount
2026-10-25,"Panda Supermarket - Groceries",-145.50
2026-10-26,"Albaik Express",-42.00
    `;
    const records = parseSaudiBankCsv(csvData);
    const existingFingerprints = new Set<string>();

    // First Ingestion: both records should be imported
    const firstRun = await ingestBankRecords({
      userId,
      accountId,
      records,
      existingFingerprints,
    });

    expect(firstRun.newTransactions.length).toBe(2);
    expect(firstRun.duplicatesIgnored.length).toBe(0);
    expect(firstRun.newTransactions[0].amountHalalas).toBe(14550n); // 145.50 SAR -> 14550 Halalas
    expect(firstRun.newTransactions[1].amountHalalas).toBe(4200n);  // 42.00 SAR -> 4200 Halalas

    // Second Ingestion: identical records should be detected as duplicates and ignored
    const secondRun = await ingestBankRecords({
      userId,
      accountId,
      records,
      existingFingerprints,
    });

    expect(secondRun.newTransactions.length).toBe(0);
    expect(secondRun.duplicatesIgnored.length).toBe(2);
  });

  it('flags internal transfers as neutral and refunds as offsets', async () => {
    const records = [
      {
        date: '2026-10-26',
        description: 'Internal Transfer between accounts',
        amount: '5000.00',
        type: 'debit' as const,
      },
      {
        date: '2026-10-26',
        description: 'POS Return Noon Refund',
        amount: '180.00',
        type: 'debit' as const,
      },
    ];

    const result = await ingestBankRecords({
      userId,
      accountId,
      records,
      existingFingerprints: new Set<string>(),
    });

    expect(result.newTransactions.length).toBe(2);
    expect(result.newTransactions[0].isTransfer).toBe(true);
    expect(result.newTransactions[0].type).toBe('transfer');
    expect(result.newTransactions[1].isRefund).toBe(true);
  });
});
