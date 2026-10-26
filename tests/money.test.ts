import { describe, it, expect } from 'vitest';
import {
  moneyFromHalalas,
  moneyFromSarString,
  addMoney,
  subtractMoney,
  multiplyMoneyByBasisPoints,
  formatMoney,
  toNumericSar,
} from '../src/core/money';

describe('Core Money Engine (Halalas & SAR)', () => {
  it('correctly creates money from halalas without floating point errors', () => {
    const m = moneyFromHalalas(15075n);
    expect(m.amountHalalas).toBe(15075n);
    expect(m.currency).toBe('SAR');
    expect(toNumericSar(m)).toBe(150.75);
  });

  it('safely parses decimal SAR strings into exact integer Halalas', () => {
    expect(moneyFromSarString('100').amountHalalas).toBe(10000n);
    expect(moneyFromSarString('100.5').amountHalalas).toBe(10050n);
    expect(moneyFromSarString('100.50').amountHalalas).toBe(10050n);
    expect(moneyFromSarString('100.05').amountHalalas).toBe(10005n);
    expect(moneyFromSarString('1,250.75').amountHalalas).toBe(125075n);
    expect(moneyFromSarString('-45.20').amountHalalas).toBe(-4520n);
  });

  it('avoids classic IEEE 754 floating-point inaccuracies (e.g. 0.10 + 0.20)', () => {
    // In IEEE 754 floats: 0.1 + 0.2 === 0.30000000000000004
    const a = moneyFromSarString('0.10');
    const b = moneyFromSarString('0.20');
    const sum = addMoney(a, b);

    expect(sum.amountHalalas).toBe(30n);
    expect(formatMoney(sum, { showCurrency: false })).toBe('0.30');
  });

  it('performs exact addition and subtraction', () => {
    const salary = moneyFromSarString('15000.00');
    const rent = moneyFromSarString('4200.50');
    const remaining = subtractMoney(salary, rent);

    expect(remaining.amountHalalas).toBe(1079950n);
    expect(formatMoney(remaining)).toBe('10,799.50 SAR');
  });

  it('computes Saudi 15% VAT accurately using basis points (1500 bps)', () => {
    // 100 SAR purchase -> 15 SAR VAT
    const purchase = moneyFromSarString('100.00');
    const vat = multiplyMoneyByBasisPoints(purchase, 1500n);
    expect(vat.amountHalalas).toBe(1500n);
    expect(formatMoney(vat)).toBe('15.00 SAR');

    // Rounding check on fractional halala: 12.33 SAR * 15% = 1.8495 SAR -> 1.85 SAR (185 Halalas)
    const oddAmount = moneyFromSarString('12.33');
    const oddVat = multiplyMoneyByBasisPoints(oddAmount, 1500n);
    expect(oddVat.amountHalalas).toBe(185n);
    expect(formatMoney(oddVat)).toBe('1.85 SAR');
  });

  it('formats currency for English and Arabic locales', () => {
    const m = moneyFromHalalas(254050n);
    expect(formatMoney(m, { locale: 'ar', useSymbol: true })).toBe('2,540.50 ر.س');
    expect(formatMoney(m, { locale: 'ar', useSymbol: true, easternNumerals: true })).toContain('ر.س');
  });

  it('rejects invalid SAR format strings', () => {
    expect(() => moneyFromSarString('invalid')).toThrowError(/Invalid SAR amount format/);
    expect(() => moneyFromSarString('12.345')).toThrowError(/Invalid SAR amount format/); // > 2 decimal places
  });
});
