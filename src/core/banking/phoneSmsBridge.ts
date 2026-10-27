import { registerPlugin, Capacitor } from '@capacitor/core';
import { Transaction, computeTransactionFingerprint } from '../transactions';
import { parseSaudiBankSmsAlert } from './smsAlertParser';

export interface PhoneSmsMessage {
  address: string;
  body: string;
  date: number; // millisecond epoch timestamp
}

export interface PhoneSmsReaderPluginInterface {
  getHistoricSms(options?: { limit?: number }): Promise<{
    messages: PhoneSmsMessage[];
    count: number;
    success: boolean;
  }>;
}

export const PhoneSmsReader = registerPlugin<PhoneSmsReaderPluginInterface>('PhoneSmsReader');

export interface MonthlyCollationRecord {
  monthKey: string; // e.g. "2026-10"
  monthLabel: string; // e.g. "October 2026"
  totalDebitHalalas: bigint;
  totalCreditHalalas: bigint;
  netHalalas: bigint;
  transactionsCount: number;
  transactions: Transaction[];
}

/**
 * Checks if running on a real Android or iOS native device with telephony
 */
export function isNativeAndroidDevice(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/**
 * Reads all historic SMS messages from device telephony inbox
 */
export async function fetchDeviceHistoricSms(limit: number = 1000): Promise<PhoneSmsMessage[]> {
  if (!isNativeAndroidDevice()) {
    console.log('[PhoneSmsBridge] Not running on native Android. Fallback to simulated/manual SMS.');
    return [];
  }

  try {
    const res = await PhoneSmsReader.getHistoricSms({ limit });
    return res.messages || [];
  } catch (err) {
    console.error('[PhoneSmsBridge] Error reading historic SMS from device:', err);
    throw err;
  }
}

/**
 * Parses an array of raw phone SMS messages into verified Pocketfree transactions
 */
export async function parseHistoricSmsToTransactions(
  messages: PhoneSmsMessage[],
  userId: string = 'user_dev_saudi_pilot_01'
): Promise<Transaction[]> {
  const transactions: Transaction[] = [];
  const seenFingerprints = new Set<string>();

  for (const msg of messages) {
    if (!msg.body || msg.body.trim().length === 0) continue;

    const parsed = parseSaudiBankSmsAlert(msg.body);
    if (!parsed || parsed.isOtp || parsed.amountHalalas <= 0n) {
      continue;
    }

    const txDate = new Date(msg.date);
    const dateStr = txDate.toISOString().split('T')[0];
    const normalizedDesc = parsed.merchant.trim().toLowerCase().replace(/\s+/g, '_');
    const fingerprint = `fp_sms_${userId}_${dateStr}_${parsed.amountHalalas}_${normalizedDesc}`;

    if (seenFingerprints.has(fingerprint)) {
      continue;
    }
    seenFingerprints.add(fingerprint);

    const bankName = parsed.bankName || (msg.address ? msg.address.trim() : 'Bank Alert');
    const id = `tx_sms_hist_${msg.date}_${Math.random().toString(36).substring(2, 6)}`;

    transactions.push({
      id,
      userId,
      accountId: parsed.accountLabel.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      type: parsed.type,
      category: parsed.category,
      amountHalalas: parsed.amountHalalas,
      currency: 'SAR',
      date: txDate,
      description: parsed.merchant,
      source: 'bank_sync',
      fingerprint,
      isTransfer: false,
      isRefund: false,
      notes: `Auto-synced from SMS (${bankName})`,
      createdAt: txDate,
    });
  }

  // Sort descending by date (most recent first)
  transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  return transactions;
}

/**
 * Collates transactions by month and computes total debits, credits, and net cashflow
 */
export function collateMonthlyDebitsAndCredits(
  transactions: Transaction[]
): MonthlyCollationRecord[] {
  const collationMap = new Map<string, {
    monthKey: string;
    monthLabel: string;
    totalDebitHalalas: bigint;
    totalCreditHalalas: bigint;
    transactions: Transaction[];
  }>();

  for (const tx of transactions) {
    const d = new Date(tx.date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;

    const monthName = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    if (!collationMap.has(monthKey)) {
      collationMap.set(monthKey, {
        monthKey,
        monthLabel: monthName,
        totalDebitHalalas: 0n,
        totalCreditHalalas: 0n,
        transactions: [],
      });
    }

    const group = collationMap.get(monthKey)!;
    group.transactions.push(tx);

    if (tx.type === 'expense') {
      group.totalDebitHalalas += tx.amountHalalas;
    } else if (tx.type === 'income') {
      group.totalCreditHalalas += tx.amountHalalas;
    }
  }

  // Convert to array and sort by month descending (most recent month first)
  const results: MonthlyCollationRecord[] = Array.from(collationMap.values()).map((g) => ({
    monthKey: g.monthKey,
    monthLabel: g.monthLabel,
    totalDebitHalalas: g.totalDebitHalalas,
    totalCreditHalalas: g.totalCreditHalalas,
    netHalalas: g.totalCreditHalalas - g.totalDebitHalalas,
    transactionsCount: g.transactions.length,
    transactions: g.transactions,
  }));

  results.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  return results;
}
