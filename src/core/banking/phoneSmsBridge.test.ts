import { describe, it, expect } from 'vitest';
import {
  parseHistoricSmsToTransactions,
  collateMonthlyDebitsAndCredits,
  PhoneSmsMessage,
} from './phoneSmsBridge';

describe('Phone SMS Bridge & Monthly Collation Engine', () => {
  it('parses historic SMS list into transactions with correct dates', async () => {
    const mockHistoricSms: PhoneSmsMessage[] = [
      {
        address: 'AlRajhiBank',
        body: 'مصرف الراجحي: شراء عبر نقاط البيع بمبلغ 184.50 ر.س لدى بنده ببطاقة مدى **8821',
        date: new Date('2026-10-20T12:00:00Z').getTime(),
      },
      {
        address: 'SNB-AlAhli',
        body: 'البنك الأهلي SNB: تم تحويل مبلغ 4,500.00 ريال عبر نظام سريع لصالح إيجار شقة الرياض',
        date: new Date('2026-10-01T09:00:00Z').getTime(),
      },
      {
        address: 'AlRajhiBank',
        body: 'مصرف الراجحي: تم إيداع راتب شهري بمبلغ 22,500.00 ر.س في حسابك الجاري **3920',
        date: new Date('2026-09-27T08:00:00Z').getTime(),
      },
      {
        address: 'Jarir',
        body: 'Your one time password (OTP) is 123456', // OTP should be excluded
        date: new Date('2026-09-28T14:00:00Z').getTime(),
      },
    ];

    const transactions = await parseHistoricSmsToTransactions(mockHistoricSms);

    expect(transactions).toHaveLength(3); // 2 expenses + 1 income (OTP excluded)
    expect(transactions[0].amountHalalas).toBe(18450n); // Oct 20 (sorted latest first)
    expect(transactions[1].amountHalalas).toBe(450000n); // Oct 1
    expect(transactions[2].amountHalalas).toBe(2250000n); // Sept 27
    expect(transactions[2].type).toBe('income');
  });

  it('collates monthly debits and credits correctly', async () => {
    const mockHistoricSms: PhoneSmsMessage[] = [
      // October 2026
      {
        address: 'AlRajhiBank',
        body: 'مصرف الراجحي: شراء عبر نقاط البيع بمبلغ 200.00 ر.س لدى بنده ببطاقة مدى **8821',
        date: new Date('2026-10-15T12:00:00Z').getTime(),
      },
      {
        address: 'AlRajhiBank',
        body: 'مصرف الراجحي: تم إيداع راتب شهري بمبلغ 20,000.00 ر.س في حسابك الجاري **3920',
        date: new Date('2026-10-27T08:00:00Z').getTime(),
      },
      // September 2026
      {
        address: 'SNB',
        body: 'Your account ending in 4920 was debited by SAR 500.00 at Carrefour on 15-SEP-2026.',
        date: new Date('2026-09-15T10:00:00Z').getTime(),
      },
      {
        address: 'SNB',
        body: 'تم إيداع مبلغ 15,000.00 ريال في حسابك الجاري',
        date: new Date('2026-09-27T08:00:00Z').getTime(),
      },
    ];

    const transactions = await parseHistoricSmsToTransactions(mockHistoricSms);
    const collation = collateMonthlyDebitsAndCredits(transactions);

    expect(collation).toHaveLength(2); // October and September

    // October 2026
    const oct = collation.find((c) => c.monthKey === '2026-10')!;
    expect(oct).toBeDefined();
    expect(oct.totalDebitHalalas).toBe(20000n); // 200.00 SAR debit
    expect(oct.totalCreditHalalas).toBe(2000000n); // 20,000.00 SAR credit
    expect(oct.netHalalas).toBe(1980000n); // +19,800.00 SAR net

    // September 2026
    const sep = collation.find((c) => c.monthKey === '2026-09')!;
    expect(sep).toBeDefined();
    expect(sep.totalDebitHalalas).toBe(50000n); // 500.00 SAR debit
    expect(sep.totalCreditHalalas).toBe(1500000n); // 15,000.00 SAR credit
    expect(sep.netHalalas).toBe(1450000n); // +14,500.00 SAR net
  });
});
