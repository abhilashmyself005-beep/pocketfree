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
  currency: string;
  confidence: 'high' | 'medium' | 'low';
  date: Date;
  rawText: string;
  isOtp?: boolean;
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
  {
    id: 'sms_english_card',
    bank: 'International / Mada',
    labelEn: 'English Card Alert - Carrefour',
    labelAr: 'إشعار بطاقة بالإنجليزية - كارفور',
    smsText: 'Your account ending in 4920 was debited by SAR 145.20 at Carrefour on 28-OCT-2026. Avail Bal: SAR 5,420.00',
  },
  {
    id: 'sms_alinma_01',
    bank: 'Alinma Bank',
    labelEn: 'Alinma Bank - McDonald\'s Mada',
    labelAr: 'مصرف الإنماء - ماكدونالدز مدى',
    smsText: 'مصرف الإنماء: تم خصم مبلغ 48.00 ر.س من بطاقة مدى **1122 لدى ماكدونالدز فرع الرياض. الرصيد المتبقي: 3,920.00 ر.س',
  },
  {
    id: 'sms_noon_01',
    bank: 'Digital Pay',
    labelEn: 'Noon Shopping - Mada Online',
    labelAr: 'نون للتسوق الإلكتروني - مدى',
    smsText: 'تم خصم 150.00 ريال من بطاقتك مدى لدى نون للتجارة الإلكترونية مرجع #NOON-9921.',
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

  const normalized = normalizeDigits(rawSms.trim());

  // 1. Detect if this is an OTP / 2FA message instead of a financial transaction
  const isOtp = /otp|one time password|verification code|رمز التحقق|رمز التأكيد|كود التحقق/i.test(normalized) &&
    !/debited|credited|spent|خصم|شراء|إيداع/i.test(normalized);

  if (isOtp) {
    return {
      amountHalalas: 0n,
      type: 'expense',
      merchant: 'Security OTP Verification',
      category: 'other',
      accountLabel: 'Verification Code',
      bankName: 'Bank Security',
      currency: 'SAR',
      confidence: 'low',
      date: new Date(),
      rawText: rawSms,
      isOtp: true,
      notes: 'This message is a login/payment OTP verification code rather than a completed transaction.',
    };
  }

  // 2. Strict Financial Action Verification (Reject appointment, delivery, room no, tracking SMS)
  const isFinancialMessage =
    /(?:خصم|شراء|سداد|تحويل|إيداع|ايداع|راتب|استرداد|مدفوعات|نقاط البيع|سريع|فاتورة|debited|credited|spent|paid|purchase|charged|transferred|withdrawal|refund|salary|pos purchase|payment of|bill payment)/i.test(normalized);

  if (!isFinancialMessage) {
    return null;
  }

  let amountStr: string | null = null;
  let detectedCurrency = 'SAR';
  let type: TransactionType = 'expense';
  let merchant = 'Unknown Merchant';
  let bankName = 'Saudi Bank';
  let accountLabel = 'Mada Card';
  let confidence: 'high' | 'medium' | 'low' = 'low';

  // 3. Detect Bank / Provider (order matters: specific names before general)
  if (/al[\s\-]*rajhi|الراجحي/i.test(normalized)) {
    bankName = 'Al Rajhi Bank';
  } else if (/alinma|الإنماء|الانماء/i.test(normalized)) {
    bankName = 'Alinma Bank';
  } else if (/\briyad(?!\s*city|\s*ksa|\s*saudi|\s*branch)\b|بنك الرياض/i.test(normalized)) {
    bankName = 'Riyad Bank';
  } else if (/snb|الأهلي|الاهلي|alahli/i.test(normalized)) {
    bankName = 'SNB (AlAhli)';
  } else if (/sab\b|saudi awwal|الأول|ساب/i.test(normalized)) {
    bankName = 'SAB (Saudi Awwal Bank)';
  } else if (/fransi|الفرنسي/i.test(normalized)) {
    bankName = 'Banque Saudi Fransi';
  } else if (/anb|العربي/i.test(normalized)) {
    bankName = 'Arab National Bank';
  } else if (/albilad|البلاد/i.test(normalized)) {
    bankName = 'Bank Albilad';
  } else if (/aljazira|الجزيرة/i.test(normalized)) {
    bankName = 'Bank AlJazira';
  } else if (/stc[\s\-]*pay|اس تي سي باي/i.test(normalized)) {
    bankName = 'STC Pay';
  } else if (/urpay|يورباي/i.test(normalized)) {
    bankName = 'Urpay';
  } else if (/tiqmo|تكمو/i.test(normalized)) {
    bankName = 'Tiqmo';
  } else if (/apple pay/i.test(normalized)) {
    bankName = 'Apple Pay';
  } else if (/hdfc/i.test(normalized)) {
    bankName = 'HDFC Bank';
  } else if (/sbi\b|state bank/i.test(normalized)) {
    bankName = 'State Bank of India';
  } else if (/icici/i.test(normalized)) {
    bankName = 'ICICI Bank';
  } else if (/axis/i.test(normalized)) {
    bankName = 'Axis Bank';
  } else if (/kotak/i.test(normalized)) {
    bankName = 'Kotak Bank';
  } else if (/chase/i.test(normalized)) {
    bankName = 'Chase Bank';
  } else if (/wells fargo/i.test(normalized)) {
    bankName = 'Wells Fargo';
  } else if (/citi\b|citibank/i.test(normalized)) {
    bankName = 'Citibank';
  }

  // 4. Detect Currency
  if (/ر\.س|ريال|sar/i.test(normalized)) {
    detectedCurrency = 'SAR';
  } else if (/usd|\$/i.test(normalized)) {
    detectedCurrency = 'USD';
  } else if (/eur|€/i.test(normalized)) {
    detectedCurrency = 'EUR';
  } else if (/gbp|£/i.test(normalized)) {
    detectedCurrency = 'GBP';
  } else if (/aed|درهم/i.test(normalized)) {
    detectedCurrency = 'AED';
  } else if (/rs\.?|inr|₹/i.test(normalized)) {
    detectedCurrency = 'INR';
  } else if (/kwd|دينار/i.test(normalized)) {
    detectedCurrency = 'KWD';
  }

  // 5. Detect Transaction Type (Debit/Expense vs Credit/Income)
  if (/إيداع|ايداع|راتب|deposit|salary|refund|استرداد|credited|credit to|received/i.test(normalized)) {
    type = 'income';
  } else {
    type = 'expense';
  }

  // 6. Pre-Sanitize Non-Amount Numbers to prevent picking up card suffixes, phone numbers, refs, or dates
  const textWithoutBalance = normalized
    // Available & Remaining Balance
    .replace(/(?:avail(?:able)?(?:\s+(?:bal(?:ance)?|limit))?|الرصيد المتاح|الرصيد الحالي|الرصيد المتبقي|remaining|balance|avl\s*bal|avlbl\s*bal)\s*:?\s*(?:sar|ر\.س|ريال|rs\.?|inr|usd|\$|eur|€|aed)?\s*[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?/gi, ' ')
    // Phone & Helpline numbers (e.g. Call 920003344, 8001244455, +966...)
    .replace(/(?:call|helpline|support|contact|toll\s*free|هاتف|اتصل|خدمة العملاء|customer care)\s*:?\s*[+0-9\s\-()]{5,15}/gi, ' ')
    // Card & Account numbers (e.g. Card **8821, ending in 4920, A/c *1234, بطاقة **1122)
    .replace(/(?:card|acct|account|a\/c|بطاقة|حساب|ending\s*in|ending|مدى|mada)\s*[:#\*\s]*[0-9]{4,16}/gi, ' ')
    .replace(/(?:\*{2,4}|x{2,4})[0-9]{4}/gi, ' ')
    // References & IDs (Ref #994821, UTR 5299482910, مفوتر 402919102, #AMZ881920)
    .replace(/(?:ref|reference|txn|txnid|id|rrn|utr|auth|approval|code|مرجع|المرجع|مفوتر|فاتورة|رقم|invoice|bill)\s*[:#\s]*[a-zA-Z0-9\-_]{4,25}/gi, ' ')
    .replace(/#[0-9a-zA-Z\-_]+/g, ' ')
    .replace(/upi\/[a-zA-Z0-9_\-\/]+/gi, ' ')
    // Dates & Times (2026-10-27, 28/10/2026, 14:32:00)
    .replace(/\b[0-9]{4}[-/][0-9]{1,2}[-/][0-9]{1,2}\b/g, ' ')
    .replace(/\b[0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4}\b/g, ' ')
    .replace(/\b[0-9]{1,2}:[0-9]{2}(?::[0-9]{2})?\s*(?:am|pm|صباحاً|مساءً)?\b/gi, ' ')
    // 4-digit years
    .replace(/\b(?:2024|2025|2026|2027)\b/g, ' ');

  // 7. Strict Amount Regex Patterns with Probability
  const amountPatterns: { regex: RegExp; prob: number; conf: 'high' | 'medium' }[] = [
    // Preceded by verb + explicit currency: "بمبلغ 184.50 ر.س", "debited by SAR 145.20"
    {
      regex: /(?:بمبلغ|بقيمة|مبلغ|قيمة|خصم|شراء|سداد|تحويل|إيداع|debited\s*(?:by|for|with)?|spent\s*(?:of)?|paid|purchase\s*(?:of|pos)?|charged\s*(?:with|for)?|transferred\s*(?:of)?|credited\s*(?:with|by|for)?|amount\s*(?:is|of)?|withdrawn\s*(?:of)?)\s*:?\s*(?:sar|ر\.س|ريال|rs\.?|inr|usd|\$|eur|€|aed)\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
      prob: 95,
      conf: 'high',
    },
    // Accompanied by currency: "SAR 184.50", "184.50 ر.س", "Rs. 350.00", "USD 29.99"
    {
      regex: /(?:sar|ر\.س|ريال|rs\.?|inr|usd|\$|eur|€|aed)\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
      prob: 90,
      conf: 'high',
    },
    {
      regex: /([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)\s*(?:sar|ر\.س|ريال|rs\.?|inr|usd|\$|eur|€|aed)\b/i,
      prob: 90,
      conf: 'high',
    },
    // Preceded by financial verb without currency: "debited by 350.00", "بمبلغ 184.50", "خصم 150.00", "سداد 220"
    {
      regex: /(?:بمبلغ|بقيمة|مبلغ|قيمة|خصم|شراء|سداد|تحويل|إيداع|debited\s*(?:by|for|with)?|spent\s*(?:of)?|paid|purchase\s*(?:of|pos)?|charged\s*(?:with|for)?|transferred\s*(?:of)?|credited\s*(?:with|by|for)?|amount\s*(?:is|of)?|withdrawn\s*(?:of)?)\s*:?\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/i,
      prob: 80,
      conf: 'high',
    },
    // Decimal amount with exactly 2 decimal places in confirmed financial message: "145.20"
    {
      regex: /\b([0-9]{1,6}\.[0-9]{2})\b/i,
      prob: 65,
      conf: 'medium',
    },
  ];

  for (const { regex, conf } of amountPatterns) {
    const match = textWithoutBalance.match(regex);
    if (match && match[1]) {
      const cleaned = match[1].replace(/,/g, '');
      const parsedNum = parseFloat(cleaned);

      if (
        !isNaN(parsedNum) &&
        parsedNum >= 0.01 &&
        parsedNum <= 5000000 &&
        parsedNum !== 2024 &&
        parsedNum !== 2025 &&
        parsedNum !== 2026 &&
        parsedNum !== 2027
      ) {
        amountStr = cleaned;
        confidence = conf;
        break;
      }
    }
  }

  // If no validated amount was found, this message has 0 probability of being a spend event
  if (!amountStr) {
    return null;
  }

  // Convert to Halala bigint (1 SAR = 100 Halalas)
  const money = moneyFromSarString(amountStr);
  const amountHalalas = money.amountHalalas;

  // 7. Extract Merchant / Narration
  const merchantRegexes = [
    // UPI transfer pattern: UPI/P2M/Swiggy or UPI/Zomato or UPI/merchant
    /upi\/(?:p2m\/)?([a-zA-Z0-9_\-]+)/i,
    // Arabic patterns: لدى بنده, لصالح إيجار, متجر أمازون, في صيدلية النهدي
    /(?:لدى|متجر|صالح|لصالح|في)\s*:?\s*([^.\n,]+?)(?:\s+(?:بواسطة|عبر|ببطاقة|بطاقة|مرجع|رصيد|available|with\b)|$)/i,
    // Bill payment: سداد فاتورة STC Fiber or سداد مبلغ ... لدى/لصالح ...
    /(?:سداد فاتورة|bill payment|سداد مبلغ[^\n]+?(?:لدى|لصالح)?)\s*:?\s*([^,.\n]+)/i,
    // Spent on <Merchant>
    /(?:spent|paid)\s+(?:sar|rs\.?|usd|\$)?\s*[0-9.]+\s+on\s+([a-zA-Z0-9_\-\s]+?)(?:\s+(?:using|with|via|card\b)|$)/i,
    // English patterns: at Panda, towards Amazon Pay
    /\b(?:at|towards)\s*:?\s*([^.\n,]+?)(?:\s+(?:on|with|using|ref\b|via|card|ending|avail|balance\b)|$)/i,
    // to / for merchant (avoid capturing "to account")
    /\b(?:to|for)\s+(?!a\/c|account|card)\s*:?\s*([^.\n,]+?)(?:\s+(?:on|with|using|ref\b|via|card|ending|avail|balance\b)|$)/i,
    // POS purchase: شراء عبر نقاط البيع لدى بنده
    /(?:شراء|purchase)\s*:?\s*(?:عبر [^,]+)?\s*لدى\s+([^,.\n]+)/i,
  ];

  for (const regex of merchantRegexes) {
    const match = normalized.match(regex);
    if (match && match[1]) {
      let candidate = match[1].trim();
      // Clean up common prepositions and symbols
      candidate = candidate.replace(/^(?:at|to|for|towards|on|لدى|في|متجر|صالح|لصالح)\s+/i, '');
      candidate = candidate.replace(/^[:\-\s]+|[:\-\s]+$/g, '').trim();

      // Ensure candidate isn't just an account number or date
      if (
        candidate.length > 2 &&
        !/^[0-9\s\-_.]+$/.test(candidate) &&
        !/^(mada|card|account|sar|usd|inr|rs)$/i.test(candidate)
      ) {
        merchant = candidate;
        confidence = 'high';
        break;
      }
    }
  }

  if (merchant === 'Unknown Merchant') {
    if (type === 'income') {
      merchant = 'Payroll / Deposit';
      confidence = 'medium';
    } else {
      merchant = `${bankName} POS Purchase`;
      confidence = 'medium';
    }
  }

  // 8. Extract Card or Account Suffix
  const cardMatch = normalized.match(/(?:بطاقة|البطاقة|حساب|الحساب|card|account|a\/c|ending in|ending|via mada|mada)\s*(?:الائتمانية|ائتمانية|مدى|mada)?\s*[:\*#\s]*([0-9]{4})/i) ||
                    normalized.match(/card\s*([0-9]{4})/i) ||
                    normalized.match(/(?:xx|\*\*|\*|x)([0-9]{4})/i);

  if (cardMatch && cardMatch[1]) {
    accountLabel = `${bankName} **${cardMatch[1]}`;
  } else if (/apple pay/i.test(normalized)) {
    accountLabel = 'Apple Pay (Mada)';
  } else {
    accountLabel = `${bankName} Account`;
  }

  // 9. Automatically Categorize
  const category = autoCategorizeSaudiMerchant(merchant + ' ' + rawSms);

  return {
    amountHalalas,
    type,
    merchant,
    category,
    accountLabel,
    bankName,
    currency: detectedCurrency,
    confidence,
    date: new Date(),
    rawText: rawSms,
    isOtp: false,
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
