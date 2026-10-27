import { Money, moneyFromHalalas, moneyFromSarString } from '../money';
import {
  Transaction,
  TransactionType,
  TransactionCategory,
  computeTransactionFingerprint,
} from '../transactions';

export type SaudiBankId = 'alrajhi' | 'snb' | 'riyad' | 'generic_csv';

export interface RawBankRecord {
  date: string;
  description: string;
  amount: string; // SAR decimal or negative for debit
  type?: 'debit' | 'credit';
  reference?: string;
}

export interface BankImportResult {
  totalProcessed: number;
  newTransactions: Transaction[];
  duplicatesIgnored: Array<{ description: string; amountHalalas: bigint; fingerprint: string }>;
  transfersNeutralCount: number;
  refundsCount: number;
}

/**
 * Intelligent categorization based on common Saudi retail and service merchants
 */
export function autoCategorizeSaudiMerchant(description: string): TransactionCategory {
  const text = description.toLowerCase();

  // Groceries / Supermarket
  if (/panda|بنده|danube|الدانوب|tamimi|التميمي|carrefour|كارفور|othaim|العثيم|lulu|لولو/i.test(text)) {
    return 'groceries';
  }
  // Restaurants & Cafes
  if (/albaik|البيك|romansiah|الرومانسية|starbucks|ستاربكس|maestro|مايسترو|mcdonald|barns|half million|shawarma/i.test(text)) {
    return 'dining';
  }
  // Utilities & Telecom
  if (/stc|اس تي سي|mobily|موبايلي|zain|زين|sec|الكهرباء|water|المياه|fawateer|سداد/i.test(text)) {
    return 'utilities';
  }
  // Transport & Fuel
  if (/sasco|ساسكو|aldrees|الدريس|uber|اوبر|careem|كريم|petrol|fuel|بنزين/i.test(text)) {
    return 'transport';
  }
  // Rent & Housing
  if (/rent|إيجار|housing|سكن|aqar|عقار|ejari/i.test(text)) {
    return 'housing';
  }
  // Salary
  if (/salary|payroll|راتب|رواتب|wages/i.test(text)) {
    return 'salary';
  }
  // Investments
  if (/derayah|دراية|alinma investment|الراجحي كابيتال|riyad capital|sukuk|صكوك|dividends/i.test(text)) {
    return 'investments';
  }
  // Healthcare
  if (/nahdi|النهدي|dawaa|الدواء|hospital|مستشفى|clinic|عيادة|pharmacy|صيدلية/i.test(text)) {
    return 'healthcare';
  }
  // Shopping / Retail
  if (/jarir|جرير|extra|اكسترا|noon|نون|amazon|امازون|ikea|ايكيا/i.test(text)) {
    return 'shopping';
  }

  return 'other';
}

/**
 * Checks if a bank record represents an internal account transfer (neutral cashflow)
 */
export function isInternalTransferRecord(description: string): boolean {
  const text = description.toLowerCase();
  return (
    /transfer to|تحويل إلى|internal transfer|تحويل داخلي|between accounts|sarie transfer|سريع/i.test(text)
  );
}

/**
 * Checks if a bank record represents a merchant refund/reversal
 */
export function isRefundRecord(description: string): boolean {
  const text = description.toLowerCase();
  return /refund|استرداد|reversal|عكس عملية|pos return/i.test(text);
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map((s) => s.replace(/^"|"$/g, ''));
}

/**
 * Parses Saudi CSV statements (Al Rajhi, SNB, Riyad Bank, or standard format)
 */
export function parseSaudiBankCsv(csvContent: string): RawBankRecord[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  if (lines.length < 2) return [];

  const records: RawBankRecord[] = [];

  // Determine column positions based on header text
  const cols = splitCsvLine(lines[0]).map((c) => c.toLowerCase());
  const dateIdx = cols.findIndex((c) => c.includes('date') || c.includes('تاريخ'));
  const descIdx = cols.findIndex((c) => c.includes('desc') || c.includes('narration') || c.includes('تفاصيل') || c.includes('statement'));
  const amountIdx = cols.findIndex((c) => c.includes('amount') || c.includes('المبلغ'));
  const debitIdx = cols.findIndex((c) => c.includes('debit') || c.includes('مدين'));
  const creditIdx = cols.findIndex((c) => c.includes('credit') || c.includes('دائن'));

  for (let i = 1; i < lines.length; i++) {
    const row = splitCsvLine(lines[i]);
    if (row.length < 2) continue;

    const rawDate = row[dateIdx >= 0 ? dateIdx : 0] || new Date().toISOString().split('T')[0];
    const rawDesc = row[descIdx >= 0 ? descIdx : 1] || 'Bank Transaction';
    let rawAmount = '0.00';
    let type: 'debit' | 'credit' = 'debit';

    if (amountIdx >= 0 && row[amountIdx]) {
      const val = row[amountIdx].replace(/[^\d.-]/g, '');
      if (val.startsWith('-')) {
        type = 'debit';
        rawAmount = val.slice(1);
      } else {
        type = 'credit';
        rawAmount = val;
      }
    } else if (debitIdx >= 0 && row[debitIdx] && parseFloat(row[debitIdx].replace(/[^\d.]/g, '')) > 0) {
      type = 'debit';
      rawAmount = row[debitIdx].replace(/[^\d.]/g, '');
    } else if (creditIdx >= 0 && row[creditIdx] && parseFloat(row[creditIdx].replace(/[^\d.]/g, '')) > 0) {
      type = 'credit';
      rawAmount = row[creditIdx].replace(/[^\d.]/g, '');
    }

    if (parseFloat(rawAmount) > 0) {
      records.push({
        date: rawDate,
        description: rawDesc,
        amount: rawAmount,
        type,
      });
    }
  }

  return records;
}

/**
 * Ingestion and reconciliation engine:
 * 1. Converts amounts into exact integer Halalas without float operations.
 * 2. Deduplicates against existing transactions via SHA-256 fingerprint.
 * 3. Categorizes and flags internal transfers and refunds.
 */
export async function ingestBankRecords(params: {
  userId: string;
  accountId: string;
  records: RawBankRecord[];
  existingFingerprints: Set<string>;
}): Promise<BankImportResult> {
  const { userId, accountId, records, existingFingerprints } = params;

  const newTransactions: Transaction[] = [];
  const duplicatesIgnored: BankImportResult['duplicatesIgnored'] = [];
  let transfersNeutralCount = 0;
  let refundsCount = 0;

  for (const rec of records) {
    const money = moneyFromSarString(rec.amount);
    if (money.amountHalalas <= 0n) continue;

    const txDate = new Date(rec.date);
    const validDate = isNaN(txDate.getTime()) ? new Date() : txDate;

    const fingerprint = await computeTransactionFingerprint({
      userId,
      date: validDate,
      amountHalalas: money.amountHalalas,
      description: rec.description,
    });

    // Deduplication check
    if (existingFingerprints.has(fingerprint)) {
      duplicatesIgnored.push({
        description: rec.description,
        amountHalalas: money.amountHalalas,
        fingerprint,
      });
      continue;
    }

    const isTransfer = isInternalTransferRecord(rec.description);
    const isRefund = isRefundRecord(rec.description);

    if (isTransfer) transfersNeutralCount++;
    if (isRefund) refundsCount++;

    const txType: TransactionType = isTransfer ? 'transfer' : rec.type === 'credit' ? 'income' : 'expense';
    const category = autoCategorizeSaudiMerchant(rec.description);

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      userId,
      accountId,
      type: txType,
      category,
      amountHalalas: money.amountHalalas,
      currency: 'SAR',
      date: validDate,
      description: rec.description.trim(),
      source: 'bank_sync',
      fingerprint,
      isTransfer,
      isRefund,
      notes: isTransfer
        ? 'Internal Transfer • Neutral Cashflow'
        : isRefund
        ? 'Merchant Refund • Expense Offset'
        : 'Bank Feed Import',
      createdAt: new Date(),
    };

    newTransactions.push(transaction);
    existingFingerprints.add(fingerprint); // Prevent intra-batch duplicates
  }

  return {
    totalProcessed: records.length,
    newTransactions,
    duplicatesIgnored,
    transfersNeutralCount,
    refundsCount,
  };
}
