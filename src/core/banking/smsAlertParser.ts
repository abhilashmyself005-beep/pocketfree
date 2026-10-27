import { moneyFromSarString, moneyFromHalalas, Money } from '../money';
import {
  Transaction,
  TransactionType,
  TransactionCategory,
  computeTransactionFingerprint,
} from '../transactions';
import { autoCategorizeSaudiMerchant } from './index';

export interface ParsedSmsResult {
  amountHalalas: bigint;
  type: TransactionType;
  merchant: string;
  category: TransactionCategory;
  accountLabel: string;
  bankName: string;
  confidence: 'high' | 'medium' | 'low';
  date: Date;
  rawText: string;
  notes?: string;
}

export interface PresetSaudiSms {
  id: string;
  bank: string;
  labelEn: string;
  labelAr: string;
  smsText: string;
}

export const SAMPLE_SAUDI_BANK_SMS: PresetSaudiSms[] = [
  {
    id: 'sms_alrajhi_01',
    bank: 'Al Rajhi Bank',
    labelEn: 'Al Rajhi Mada - Panda Supermarket',
    labelAr: 'مصرف الراجحي - سوبرماركت بنده',
    smsText: 'مصرف الراجحي: شراء عبر نقاط البيع بمبلغ 184.50 ر.س لدى بنده - ملقا بواسطة بطاقة مدى **8821. الرصيد المتاح: 14,250.00 ر.س في 2026-10-27 14:32',
  },
  {
    id: 'sms_snb_01',
    bank: 'SNB (AlAhli)',
    labelEn: 'SNB - Apartment Rent SARIE Transfer',
    labelAr: 'البنك الأهلي - تحويل إيجار الشقة عبر سريع',
    smsText: 'البنك الأهلي SNB: تم تحويل مبلغ 4,500.00 ريال عبر نظام سريع لصالح إيجار شقة الرياض. المرجع: #SNB-994821 في 27-10-2026',
  },
  {
    id: 'sms_stcpay_01',
    bank: 'STC Pay',
    labelEn: 'STC Pay - Telecom Fiber Bill',
    labelAr: 'إس تي سي باي - سداد فاتورة الألياف',
    smsText: 'STC Pay: تم سداد فاتورة بنجاح بقيمة 287.50 SAR لصالح STC Fiber - مفوتر رقم 402919102. الرصيد المتبقي: 1,820.00 SAR',
  },
  {
    id: 'sms_riyad_01',
    bank: 'Riyad Bank',
    labelEn: 'Riyad Bank - Starbucks Olaya',
    labelAr: 'بنك الرياض - قهوة ستاربكس العليا',
    smsText: 'بنك الرياض: تمت عملية شراء إنترنت/Apple Pay بمبلغ 32.00 ر.س لدى Starbucks Olaya بواسطة البطاقة الائتمانية **4012.',
  },
  {
    id: 'sms_alrajhi_salary',
    bank: 'Al Rajhi Bank',
    labelEn: 'Al Rajhi - Monthly Payroll Deposit',
    labelAr: 'مصرف الراجحي - إيداع الراتب الشهري',
    smsText: 'مصرف الراجحي: تم إيداع راتب شهري بمبلغ 22,500.00 ر.س في حسابك الجاري **3920 من شركة التقنية المتقدمة. الرصيد الحالي: 28,450.00 ر.س',
  },
];

/**
 * Clean and normalize Arabic/English number strings
 */
function normalizeDigits(str: string): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (d) => arabicNumerals.indexOf(d).toString());
}

/**
 * Parses raw bank alert SMS text into a structured financial transaction
 * Follows FinArt's clean-room on-device alert extraction pattern.
 */
export function parseSaudiBankSmsAlert(rawSms: string): ParsedSmsResult | null {
  if (!rawSms || rawSms.trim().length === 0) return null;

  const normalized = normalizeDigits(rawSms);
  let amountStr: string | null = null;
  let type: TransactionType = 'expense';
  let merchant = 'Unknown Merchant';
  let bankName = 'Saudi Bank';
  let accountLabel = 'Mada Card';
  let confidence: 'high' | 'medium' | 'low' = 'low';

  // 1. Detect Bank
  if (/alrajhi|الراجحي/i.test(normalized)) {
    bankName = 'Al Rajhi Bank';
  } else if (/snb|الأهلي|الاهلي/i.test(normalized)) {
    bankName = 'SNB (AlAhli)';
  } else if (/riyad|الرياض/i.test(normalized)) {
    bankName = 'Riyad Bank';
  } else if (/alinma|الإنماء|الانماء/i.test(normalized)) {
    bankName = 'Alinma Bank';
  } else if (/stc pay|stcpay|اس تي سي باي/i.test(normalized)) {
    bankName = 'STC Pay';
  } else if (/urpay|يورباي/i.test(normalized)) {
    bankName = 'Urpay';
  }

  // 2. Detect Transaction Type (Debit/Expense vs Credit/Income)
  if (/إيداع|ايداع|راتب|deposit|salary|refund|استرداد|credit to/i.test(normalized)) {
    type = 'income';
  } else {
    type = 'expense';
  }

  // 3. Extract Amount
  // Matches: "184.50 ر.س" or "SAR 184.50" or "بمبلغ 184.50" or "بقيمة 184.50" or "184.50 ريال"
  const amountRegexes = [
    /(?:بمبلغ|بقيمة|مبلغ|قيمة|amount|paid|purchase of|transfer of)\s*:?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*(?:ر\.س|ريال|sar)?/i,
    /([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*(?:ر\.س|ريال|sar)/i,
    /(?:sar|rs)\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
  ];

  for (const regex of amountRegexes) {
    const match = normalized.match(regex);
    if (match && match[1]) {
      // Remove commas from numbers like 4,500.00
      amountStr = match[1].replace(/,/g, '');
      break;
    }
  }

  if (!amountStr) {
    return null; // Cannot parse without a valid monetary amount
  }

  // Convert to Halala bigint
  const money = moneyFromSarString(amountStr);
  const amountHalalas = money.amountHalalas;

  // 4. Extract Merchant / Narration
  const merchantRegexes = [
    /(?:لدى|متجر|صالح|لصالح|from|at|to)\s*:?\s*([^.\n,]+?)(?:\s*(?:بواسطة|عبر|ببطاقة|بطاقة|في|ref|مرجع|رصيد|available|with|$))/i,
    /(?:شراء|purchase)\s*:?\s*(?:عبر [^,]+)?\s*لدى\s+([^,.\n]+)/i,
    /(?:سداد فاتورة|bill payment)\s*:?\s*([^,.\n]+)/i,
  ];

  for (const regex of merchantRegexes) {
    const match = normalized.match(regex);
    if (match && match[1]) {
      const candidate = match[1].trim();
      if (candidate.length > 2 && !/^[0-9]+$/.test(candidate)) {
        merchant = candidate.replace(/^[:\-\s]+|[:\-\s]+$/g, '');
        confidence = 'high';
        break;
      }
    }
  }

  if (merchant === 'Unknown Merchant') {
    if (type === 'income') {
      merchant = 'Salary / Bank Transfer';
      confidence = 'medium';
    } else {
      merchant = bankName + ' Transaction';
      confidence = 'medium';
    }
  }

  // 5. Extract Card or Account Suffix
  const cardMatch = normalized.match(/(?:بطاقة|البطاقة|حساب|الحساب|card|account|مدى)\s*(?:الائتمانية|ائتمانية|مدى)?\s*[:\*#\s]*([0-9]{4})/i);
  if (cardMatch && cardMatch[1]) {
    accountLabel = `${bankName} **${cardMatch[1]}`;
  } else if (/apple pay/i.test(normalized)) {
    accountLabel = 'Apple Pay (Mada)';
  } else {
    accountLabel = `${bankName} Account`;
  }

  // 6. Automatically Categorize
  const category = autoCategorizeSaudiMerchant(merchant + ' ' + rawSms);

  return {
    amountHalalas,
    type,
    merchant,
    category,
    accountLabel,
    bankName,
    confidence,
    date: new Date(),
    rawText: rawSms,
    notes: `Parsed automatically from ${bankName} SMS alert`,
  };
}

/**
 * Creates a standard Pocketfree Transaction from Parsed SMS
 */
export function createTransactionFromParsedSms(
  parsed: ParsedSmsResult,
  userId: string = 'user_dev_saudi_pilot_01'
): Transaction {
  const id = `tx_sms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const dateStr = parsed.date.toISOString().split('T')[0];
  const normalizedDesc = parsed.merchant.trim().toLowerCase().replace(/\s+/g, '_');
  const fingerprint = `fp_sms_${userId}_${dateStr}_${parsed.amountHalalas}_${normalizedDesc}`;

  return {
    id,
    userId,
    accountId: parsed.accountLabel.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    type: parsed.type,
    category: parsed.category,
    amountHalalas: parsed.amountHalalas,
    currency: 'SAR',
    date: parsed.date,
    description: parsed.merchant,
    source: 'bank_sync',
    fingerprint,
    isTransfer: false,
    isRefund: false,
    notes: parsed.notes,
    createdAt: new Date(),
  };
}
