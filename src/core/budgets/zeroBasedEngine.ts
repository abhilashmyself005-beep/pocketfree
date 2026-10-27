import { Money, moneyFromHalalas } from '../money';

export interface Envelope {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  targetHalalas: bigint;
  allocatedHalalas: bigint;
  spentHalalas: bigint;
  iconName: string;
}

export interface DebtItem {
  id: string;
  name: string;
  nameAr: string;
  creditor: string;
  principalHalalas: bigint;
  monthlyMinimumHalalas: bigint;
  interestApr: number; // e.g. 4.5%
  isIslamicFinancing: boolean; // Murabaha / Tawarruq fixed profit rate
}

export const INITIAL_ENVELOPES: Envelope[] = [
  {
    id: 'env_housing',
    name: 'Housing & Rent',
    nameAr: 'السكن والإيجار',
    category: 'housing',
    targetHalalas: 650000n, // 6,500.00 SAR
    allocatedHalalas: 650000n,
    spentHalalas: 650000n,
    iconName: 'Home',
  },
  {
    id: 'env_groceries',
    name: 'Groceries & Household',
    nameAr: 'البقالة والمؤونة',
    category: 'groceries',
    targetHalalas: 250000n, // 2,500.00 SAR
    allocatedHalalas: 250000n,
    spentHalalas: 184525n, // 1,845.25 SAR
    iconName: 'ShoppingBasket',
  },
  {
    id: 'env_utilities',
    name: 'Utilities & Telecom',
    nameAr: 'الفواتير والاتصالات',
    category: 'utilities',
    targetHalalas: 90000n, // 900.00 SAR
    allocatedHalalas: 90000n,
    spentHalalas: 70750n, // 707.50 SAR
    iconName: 'Zap',
  },
  {
    id: 'env_dining',
    name: 'Dining & Cafes',
    nameAr: 'المطاعم والمقاهي',
    category: 'dining',
    targetHalalas: 150000n, // 1,500.00 SAR
    allocatedHalalas: 150000n,
    spentHalalas: 162550n, // 1,625.50 SAR (Overspent by 125.50)
    iconName: 'Utensils',
  },
  {
    id: 'env_emergency',
    name: 'Emergency Cushion',
    nameAr: 'طوارئ وادخار آمن',
    category: 'savings',
    targetHalalas: 300000n, // 3,000.00 SAR
    allocatedHalalas: 300000n,
    spentHalalas: 0n,
    iconName: 'Shield',
  },
  {
    id: 'env_debt_snowball',
    name: 'Debt Snowball / Loan Payoff',
    nameAr: 'تسريع سداد التمويل والديون',
    category: 'debt',
    targetHalalas: 200000n, // 2,000.00 SAR
    allocatedHalalas: 200000n,
    spentHalalas: 150000n,
    iconName: 'TrendingDown',
  },
];

export const INITIAL_DEBTS: DebtItem[] = [
  {
    id: 'debt_auto_01',
    name: 'Murabaha Auto Financing (تمويل سيارة)',
    nameAr: 'تمويل سيارة تأجيري - الراجحي',
    creditor: 'Al Rajhi Bank',
    principalHalalas: 4800000n, // 48,000.00 SAR
    monthlyMinimumHalalas: 145000n, // 1,450.00 SAR
    interestApr: 3.85,
    isIslamicFinancing: true,
  },
  {
    id: 'debt_card_01',
    name: 'SNB Titanium Mastercard Balance',
    nameAr: 'بطاقة الأهلي تيتانيوم الائتمانية',
    creditor: 'SNB AlAhli',
    principalHalalas: 850000n, // 8,500.00 SAR
    monthlyMinimumHalalas: 42500n, // 425.00 SAR (5%)
    interestApr: 18.0,
    isIslamicFinancing: false,
  },
];

/**
 * Calculates Unassigned / "Ready to Assign" Pool
 * Core Zero-Based Budgeting formula:
 * ReadyToAssign = TotalMonthlyIncome - Sum(AllocatedEnvelopes)
 */
export function calculateReadyToAssign(
  totalIncomeHalalas: bigint,
  envelopes: Envelope[]
): bigint {
  const totalAllocated = envelopes.reduce(
    (sum, env) => sum + env.allocatedHalalas,
    0n
  );
  return totalIncomeHalalas - totalAllocated;
}

/**
 * Moves money from one envelope to another to cover overspending or reallocate
 */
export function moveMoneyBetweenEnvelopes(
  fromId: string,
  toId: string,
  amountHalalas: bigint,
  envelopes: Envelope[]
): Envelope[] {
  if (amountHalalas <= 0n) return envelopes;

  return envelopes.map((env) => {
    if (env.id === fromId) {
      return {
        ...env,
        allocatedHalalas: env.allocatedHalalas - amountHalalas,
      };
    }
    if (env.id === toId) {
      return {
        ...env,
        allocatedHalalas: env.allocatedHalalas + amountHalalas,
      };
    }
    return env;
  });
}

/**
 * Calculates accelerated debt payoff months and estimated interest/profit saved
 */
export function calculateDebtPayoff(
  principalHalalas: bigint,
  monthlyPaymentHalalas: bigint,
  interestApr: number
): { monthsToPayoff: number; estimatedCostHalalas: bigint } {
  if (monthlyPaymentHalalas <= 0n || principalHalalas <= 0n) {
    return { monthsToPayoff: 0, estimatedCostHalalas: 0n };
  }

  const monthlyRate = interestApr / 100 / 12;
  const principal = Number(principalHalalas) / 100;
  const payment = Number(monthlyPaymentHalalas) / 100;

  if (monthlyRate === 0) {
    const months = Math.ceil(principal / payment);
    return { monthsToPayoff: months, estimatedCostHalalas: 0n };
  }

  // Monthly amortisation formula: n = -ln(1 - (r * P) / M) / ln(1 + r)
  const numerator = Math.log(1 - (monthlyRate * principal) / payment);
  const denominator = Math.log(1 + monthlyRate);

  if (isNaN(numerator) || numerator >= 0) {
    // Payment too low to cover interest
    return { monthsToPayoff: 999, estimatedCostHalalas: principalHalalas };
  }

  const months = Math.ceil(-numerator / denominator);
  const totalPaid = payment * months;
  const interestCost = Math.max(0, totalPaid - principal);

  return {
    monthsToPayoff: months,
    estimatedCostHalalas: BigInt(Math.round(interestCost * 100)),
  };
}
