import { z } from 'zod';
import { Money, moneyFromHalalas, addMoney, subtractMoney } from '../money';

export const TransactionTypeSchema = z.enum(['income', 'expense', 'transfer']);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const TransactionSourceSchema = z.enum(['cash_manual', 'bank_sync', 'receipt_ocr']);
export type TransactionSource = z.infer<typeof TransactionSourceSchema>;

export const TransactionCategorySchema = z.enum([
  'housing',
  'groceries',
  'dining',
  'transport',
  'utilities',
  'shopping',
  'healthcare',
  'entertainment',
  'salary',
  'freelance',
  'investments',
  'other',
]);
export type TransactionCategory = z.infer<typeof TransactionCategorySchema>;

export const CategoryLabels: Record<TransactionCategory, { en: string; ar: string; icon: string }> = {
  salary: { en: 'Salary & Wages', ar: 'الرواتب والأجور', icon: 'Briefcase' },
  freelance: { en: 'Freelance & Side Income', ar: 'العمل الحر والدخل الإضافي', icon: 'Laptop' },
  investments: { en: 'Investments & Dividends', ar: 'الاستثمارات والأرباح', icon: 'TrendingUp' },
  housing: { en: 'Rent & Housing', ar: 'السكن والإيجار', icon: 'Home' },
  groceries: { en: 'Supermarket & Groceries', ar: 'السوبرماركت والمؤن', icon: 'ShoppingCart' },
  dining: { en: 'Restaurants & Cafes', ar: 'المطاعم والمقاهي', icon: 'Utensils' },
  transport: { en: 'Fuel & Transportation', ar: 'الوقود والمواصلات', icon: 'Car' },
  utilities: { en: 'Electricity, Water & Telecom', ar: 'الفواتير والخدمات', icon: 'Zap' },
  shopping: { en: 'Retail & Electronics', ar: 'التسوق والتجزئة', icon: 'ShoppingBag' },
  healthcare: { en: 'Pharmacy & Medical', ar: 'الصحة والصيدلية', icon: 'HeartPulse' },
  entertainment: { en: 'Leisure & Activities', ar: 'الترفيه والأنشطة', icon: 'Film' },
  other: { en: 'Miscellaneous', ar: 'أخرى', icon: 'MoreHorizontal' },
};

export const TransactionInputSchema = z.object({
  id: z.string().uuid().optional(),
  userId: z.string().min(1, 'User ID is required'),
  accountId: z.string().min(1, 'Account ID is required'),
  type: TransactionTypeSchema,
  category: TransactionCategorySchema,
  amountHalalas: z.bigint().positive('Amount must be positive in halalas'),
  currency: z.literal('SAR').default('SAR'),
  date: z.date(),
  description: z.string().min(1, 'Description is required').max(255),
  source: TransactionSourceSchema.default('cash_manual'),
  isTransfer: z.boolean().default(false),
  isRefund: z.boolean().default(false),
  relatedTransactionId: z.string().uuid().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export type Transaction = z.infer<typeof TransactionInputSchema> & {
  id: string;
  fingerprint: string;
  createdAt: Date;
};

/**
 * Computes a deterministic SHA-256 fingerprint for deduplication.
 * Prevents re-importing the same bank or receipt entry twice.
 */
export async function computeTransactionFingerprint(params: {
  userId: string;
  date: Date;
  amountHalalas: bigint;
  description: string;
}): Promise<string> {
  const normalizedDate = params.date.toISOString().split('T')[0]; // YYYY-MM-DD
  const normalizedDesc = params.description.trim().toLowerCase().replace(/\s+/g, ' ');
  const payload = `${params.userId}|${normalizedDate}|${params.amountHalalas.toString()}|${normalizedDesc}`;

  // Use Web Crypto API available natively in Node 18+ and browsers
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface SpendVsIncomeAnalysis {
  totalIncome: Money;
  totalExpenses: Money;
  netCashflow: Money;
  savingsRatePercentage: number;
  categoryBreakdown: Array<{
    category: TransactionCategory;
    total: Money;
    percentage: number;
    transactionCount: number;
  }>;
  totalTransactionsCount: number;
  excludedTransfersCount: number;
}

/**
 * Calculates spend vs. income analysis while strictly enforcing:
 * 1. Internal transfers (`isTransfer: true`) are excluded from spend & income totals to prevent double-counting.
 * 2. Refunds (`isRefund: true`) offset expenses rather than inflating income.
 */
export function calculateSpendVsIncome(transactions: Transaction[]): SpendVsIncomeAnalysis {
  let incomeHalalas = 0n;
  let expenseHalalas = 0n;
  let excludedTransfers = 0;

  const categoryTotals: Partial<Record<TransactionCategory, { halalas: bigint; count: number }>> = {};

  for (const tx of transactions) {
    // 1. Exclude internal transfers between user's accounts
    if (tx.isTransfer) {
      excludedTransfers++;
      continue;
    }

    // 2. Handle refunds: a refund is money returned for an expense, so it offsets expense totals
    if (tx.isRefund) {
      expenseHalalas -= tx.amountHalalas;
      continue;
    }

    if (tx.type === 'income') {
      incomeHalalas += tx.amountHalalas;
    } else if (tx.type === 'expense') {
      expenseHalalas += tx.amountHalalas;

      const current = categoryTotals[tx.category] || { halalas: 0n, count: 0 };
      categoryTotals[tx.category] = {
        halalas: current.halalas + tx.amountHalalas,
        count: current.count + 1,
      };
    }
  }

  // Ensure non-negative expense even if net refunded in a small sample window
  if (expenseHalalas < 0n) {
    expenseHalalas = 0n;
  }

  const totalIncome = moneyFromHalalas(incomeHalalas, 'SAR');
  const totalExpenses = moneyFromHalalas(expenseHalalas, 'SAR');
  const netCashflow = subtractMoney(totalIncome, totalExpenses);

  // Calculate savings rate: (Income - Expenses) / Income * 100
  let savingsRatePercentage = 0;
  if (incomeHalalas > 0n) {
    const savedHalalas = incomeHalalas - expenseHalalas;
    savingsRatePercentage = Math.round((Number(savedHalalas) / Number(incomeHalalas)) * 10000) / 100;
  }

  // Build category breakdown sorted by largest spend
  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([cat, val]) => {
      const category = cat as TransactionCategory;
      const percentage =
        expenseHalalas > 0n ? Math.round((Number(val.halalas) / Number(expenseHalalas)) * 10000) / 100 : 0;
      return {
        category,
        total: moneyFromHalalas(val.halalas, 'SAR'),
        percentage,
        transactionCount: val.count,
      };
    })
    .sort((a, b) => (b.total.amountHalalas > a.total.amountHalalas ? 1 : -1));

  return {
    totalIncome,
    totalExpenses,
    netCashflow,
    savingsRatePercentage,
    categoryBreakdown,
    totalTransactionsCount: transactions.length,
    excludedTransfersCount: excludedTransfers,
  };
}
