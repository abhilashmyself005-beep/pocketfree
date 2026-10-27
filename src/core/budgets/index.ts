import { Money, moneyFromHalalas, subtractMoney } from '../money';
import { Transaction, TransactionCategory, calculateSpendVsIncome } from '../transactions';

export interface CategoryBudget {
  category: TransactionCategory;
  budgetHalalas: bigint;
  spentHalalas: bigint;
  remainingHalalas: bigint;
  spentPercentage: number;
  status: 'safe' | 'warning' | 'exceeded';
}

export interface BudgetRecommendation {
  id: string;
  category: TransactionCategory;
  title: { en: string; ar: string };
  message: { en: string; ar: string };
  potentialMonthlySavingsHalalas: bigint;
}

export const DEFAULT_BUDGET_TARGETS: Record<TransactionCategory, bigint> = {
  housing: 700000n, // 7,000 SAR
  groceries: 250000n, // 2,500 SAR
  dining: 100000n, // 1,000 SAR
  transport: 80000n, // 800 SAR
  utilities: 90000n, // 900 SAR
  shopping: 120000n, // 1,200 SAR
  healthcare: 50000n, // 500 SAR
  entertainment: 60000n, // 600 SAR
  salary: 0n,
  freelance: 0n,
  investments: 0n,
  other: 50000n, // 500 SAR
};

/**
 * Calculates current budget utilization and identifies warning thresholds
 */
export function evaluateBudgets(
  transactions: Transaction[],
  budgetTargets: Partial<Record<TransactionCategory, bigint>> = DEFAULT_BUDGET_TARGETS
): {
  categoryBudgets: CategoryBudget[];
  overallStatus: 'healthy' | 'warning' | 'critical';
  recommendations: BudgetRecommendation[];
} {
  const analysis = calculateSpendVsIncome(transactions);
  const categoryBudgets: CategoryBudget[] = [];
  const recommendations: BudgetRecommendation[] = [];

  const targets = { ...DEFAULT_BUDGET_TARGETS, ...budgetTargets };

  for (const [cat, targetHalalas] of Object.entries(targets)) {
    const category = cat as TransactionCategory;
    if (targetHalalas <= 0n) continue; // Skip income categories

    const spentEntry = analysis.categoryBreakdown.find((c) => c.category === category);
    const spentHalalas = spentEntry ? spentEntry.total.amountHalalas : 0n;

    const remaining = targetHalalas - spentHalalas;
    const spentPercentage = Math.round((Number(spentHalalas) / Number(targetHalalas)) * 100);

    let status: CategoryBudget['status'] = 'safe';
    if (spentPercentage >= 100) {
      status = 'exceeded';
    } else if (spentPercentage >= 75) {
      status = 'warning';
    }

    categoryBudgets.push({
      category,
      budgetHalalas: targetHalalas,
      spentHalalas,
      remainingHalalas: remaining,
      spentPercentage,
      status,
    });

    // Generate practical budget recommendations based on actual spending
    if (category === 'dining' && spentPercentage >= 75) {
      recommendations.push({
        id: 'rec_dining',
        category: 'dining',
        title: {
          en: 'Restaurants & Dining Optimization',
          ar: 'ترشيد مصروفات المطاعم والمقاهي',
        },
        message: {
          en: 'Dining out accounts for a high share of discretionary spend. Preparing 2 additional home meals per week could save up to 450 SAR monthly.',
          ar: 'يشكل الإنفاق على المطاعم نسبة مرتفعة. إعداد وجبتين إضافيتين منزلياً أسبوعياً قد يوفر نحو 450 ريال شهرياً.',
        },
        potentialMonthlySavingsHalalas: 45000n,
      });
    }

    if (category === 'groceries' && spentPercentage >= 80) {
      recommendations.push({
        id: 'rec_groceries',
        category: 'groceries',
        title: {
          en: 'Supermarket Smart Shopping Split',
          ar: 'توزيع المقاضي بالاستفادة من عروض المتاجر',
        },
        message: {
          en: 'Splitting key staple purchases (rice, oil, milk) using Pocketfree Smart Shopping matches can save up to 15% on supermarket expenses.',
          ar: 'مقارنة سلة المقاضي الأساسية عبر أداة التسوق الذكي قد يقلص فاتورة التموين بنسبة تصل إلى 15%.',
        },
        potentialMonthlySavingsHalalas: 37500n,
      });
    }
  }

  // Sort by highest utilization percentage
  categoryBudgets.sort((a, b) => b.spentPercentage - a.spentPercentage);

  const hasExceeded = categoryBudgets.some((c) => c.status === 'exceeded');
  const hasWarning = categoryBudgets.some((c) => c.status === 'warning');
  const overallStatus = hasExceeded ? 'critical' : hasWarning ? 'warning' : 'healthy';

  return {
    categoryBudgets,
    overallStatus,
    recommendations,
  };
}
