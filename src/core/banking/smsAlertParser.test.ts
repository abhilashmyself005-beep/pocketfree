import { describe, it, expect } from 'vitest';
import {
  parseSaudiBankSmsAlert,
  createTransactionFromParsedSms,
  SAMPLE_SAUDI_BANK_SMS,
} from './smsAlertParser';

describe('FinArt Replica: Saudi Bank SMS Alert Parser', () => {
  it('parses Al Rajhi POS purchase at Panda with Mada card correctly', () => {
    const sample = SAMPLE_SAUDI_BANK_SMS[0];
    const parsed = parseSaudiBankSmsAlert(sample.smsText);

    expect(parsed).not.toBeNull();
    expect(parsed?.type).toBe('expense');
    expect(parsed?.amountHalalas).toBe(18450n); // 184.50 SAR
    expect(parsed?.merchant).toContain('بنده');
    expect(parsed?.category).toBe('groceries');
    expect(parsed?.bankName).toBe('Al Rajhi Bank');
    expect(parsed?.accountLabel).toContain('8821');
  });

  it('parses SNB rent transfer via SARIE correctly', () => {
    const sample = SAMPLE_SAUDI_BANK_SMS[1];
    const parsed = parseSaudiBankSmsAlert(sample.smsText);

    expect(parsed).not.toBeNull();
    expect(parsed?.amountHalalas).toBe(450000n); // 4,500.00 SAR
    expect(parsed?.type).toBe('expense');
    expect(parsed?.bankName).toBe('SNB (AlAhli)');
    expect(parsed?.category).toBe('housing');
  });

  it('parses STC Pay telecom fiber bill payment correctly', () => {
    const sample = SAMPLE_SAUDI_BANK_SMS[2];
    const parsed = parseSaudiBankSmsAlert(sample.smsText);

    expect(parsed).not.toBeNull();
    expect(parsed?.amountHalalas).toBe(28750n); // 287.50 SAR
    expect(parsed?.category).toBe('utilities');
    expect(parsed?.bankName).toBe('STC Pay');
  });

  it('parses Riyad Bank Starbucks coffee with credit card', () => {
    const sample = SAMPLE_SAUDI_BANK_SMS[3];
    const parsed = parseSaudiBankSmsAlert(sample.smsText);

    expect(parsed).not.toBeNull();
    expect(parsed?.amountHalalas).toBe(3200n); // 32.00 SAR
    expect(parsed?.category).toBe('dining');
    expect(parsed?.accountLabel).toContain('4012');
  });

  it('parses Al Rajhi monthly salary deposit as income', () => {
    const sample = SAMPLE_SAUDI_BANK_SMS[4];
    const parsed = parseSaudiBankSmsAlert(sample.smsText);

    expect(parsed).not.toBeNull();
    expect(parsed?.type).toBe('income');
    expect(parsed?.amountHalalas).toBe(2250000n); // 22,500.00 SAR
    expect(parsed?.category).toBe('salary');
  });

  it('converts parsed SMS into a valid Pocketfree transaction', () => {
    const sample = SAMPLE_SAUDI_BANK_SMS[0];
    const parsed = parseSaudiBankSmsAlert(sample.smsText)!;
    const tx = createTransactionFromParsedSms(parsed);

    expect(tx.id).toMatch(/^tx_sms_/);
    expect(tx.currency).toBe('SAR');
    expect(tx.amountHalalas).toBe(18450n);
    expect(tx.source).toBe('bank_sync');
    expect(tx.fingerprint).toBeDefined();
  });

  it('parses English card debit alert with Available Balance stripped correctly', () => {
    const text = 'Your account ending in 4920 was debited by SAR 145.20 at Carrefour on 28-OCT-2026. Avail Bal: SAR 5,420.00';
    const parsed = parseSaudiBankSmsAlert(text);

    expect(parsed).not.toBeNull();
    expect(parsed?.amountHalalas).toBe(14520n); // 145.20 SAR (NOT the 5,420.00 balance!)
    expect(parsed?.type).toBe('expense');
    expect(parsed?.merchant).toBe('Carrefour');
    expect(parsed?.accountLabel).toContain('4920');
  });

  it('detects and flags OTP messages so they are not treated as financial spend', () => {
    const text = 'Your one time password (OTP) is 849201 for logging in to Al Rajhi Mobile.';
    const parsed = parseSaudiBankSmsAlert(text);

    expect(parsed).not.toBeNull();
    expect(parsed?.isOtp).toBe(true);
    expect(parsed?.amountHalalas).toBe(0n);
  });

  it('returns null for invalid or empty text', () => {
    expect(parseSaudiBankSmsAlert('')).toBeNull();
    expect(parseSaudiBankSmsAlert('Hello without amount')).toBeNull();
  });
});
