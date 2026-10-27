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

export interface AllocationSegment {
  name: string;
  nameAr: string;
  percentage: number;
  color: string;
  amountHalalas: bigint;
}

export const TOP_ALLOCATIONS: AllocationSegment[] = [
  { name: 'Rent', nameAr: 'الإيجار', percentage: 37, color: '#2563EB', amountHalalas: 165000n }, // Blue
  { name: 'Groceries', nameAr: 'المقاضي والبقالة', percentage: 15, color: '#16A34A', amountHalalas: 68000n }, // Dark Green
  { name: 'Emergency fund', nameAr: 'صندوق الطوارئ', percentage: 11, color: '#0D9488', amountHalalas: 50000n }, // Teal
  { name: '401(k) / Investment boost', nameAr: 'استثمار ونمو مالي', percentage: 10, color: '#38BDF8', amountHalalas: 45000n }, // Light Blue
  { name: 'Road trip / Travel fund', nameAr: 'رحلة سفر وسياحة', percentage: 8, color: '#EA580C', amountHalalas: 36000n }, // Orange
  { name: 'Auto loan', nameAr: 'تمويل السيارة', percentage: 8, color: '#6366F1', amountHalalas: 36000n }, // Indigo
];

export interface BudgetTarget {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  targetHalalas: bigint;
  currentHalalas: bigint;
  status: 'reached' | 'in_progress';
  dueText: string;
  iconName: string;
}

export const INITIAL_TARGETS: BudgetTarget[] = [
  {
    id: 'target_401k',
    name: '401(k) / Investment Boost',
    nameAr: 'الاستثمار والادخار التقاعدي',
    category: 'savings',
    targetHalalas: 225000n, // 2,250.00 SAR
    currentHalalas: 225000n,
    status: 'reached',
    dueText: 'Open ended',
    iconName: 'PiggyBank',
  },
  {
    id: 'target_dining',
    name: 'Dining & Coffee Out',
    nameAr: 'المطاعم والقهوة',
    category: 'dining',
    targetHalalas: 19000n, // 190.00 SAR
    currentHalalas: 19000n,
    status: 'reached',
    dueText: 'Any day',
    iconName: 'Utensils',
  },
  {
    id: 'target_yellowstone',
    name: 'Road Trip to Asir / Yellowstone',
    nameAr: 'رحلة عسير السياحية',
    category: 'travel',
    targetHalalas: 275000n, // 2,750.00 SAR
    currentHalalas: 188000n, // 1,880.00 SAR (68%)
    status: 'in_progress',
    dueText: 'Open ended',
    iconName: 'Car',
  },
  {
    id: 'target_emergency',
    name: 'Emergency Cushion 3-Months',
    nameAr: 'صندوق الطوارئ 3 أشهر',
    category: 'emergency',
    targetHalalas: 1100000n, // 11,000.00 SAR
    currentHalalas: 750000n, // 7,500.00 SAR (68%)
    status: 'in_progress',
    dueText: 'Open ended',
    iconName: 'Shield',
  },
];

export interface BillReminder {
  id: string;
  title: string;
  titleAr: string;
  payee: string;
  amountHalalas: bigint;
  group: 'tomorrow' | 'upcoming';
  timeStr: string;
  recurrence: string;
  iconName: string;
  isPaid: boolean;
}

export const INITIAL_BILL_REMINDERS: BillReminder[] = [
  {
    id: 'bill_rent_nov',
    title: 'Rent',
    titleAr: 'إيجار السكن',
    payee: 'Landlord • Al-Malqa Apt',
    amountHalalas: 165000n, // 1,650.00 SAR
    group: 'tomorrow',
    timeStr: 'Tomorrow • 8:00 AM',
    recurrence: 'Monthly',
    iconName: 'Home',
    isPaid: false,
  },
  {
    id: 'bill_utilities',
    title: 'Utilities & Internet',
    titleAr: 'الكهرباء والإنترنت المنزلي',
    payee: 'Saudi Electricity Co & STC',
    amountHalalas: 18000n, // 180.00 SAR
    group: 'tomorrow',
    timeStr: 'Tomorrow • 9:00 AM',
    recurrence: 'Monthly',
    iconName: 'Zap',
    isPaid: false,
  },
  {
    id: 'bill_auto_loan',
    title: 'Auto Loan Financing',
    titleAr: 'قسط تمويل السيارة',
    payee: 'Al Rajhi Auto Lease',
    amountHalalas: 42000n, // 420.00 SAR
    group: 'upcoming',
    timeStr: 'Sun 15 Nov • 9:00 AM',
    recurrence: 'Monthly',
    iconName: 'Car',
    isPaid: false,
  },
];

export interface HabitStreakState {
  streakDays: number;
  xp: number;
  level: number;
  freezesAvailable: number;
  perfectWeeks: number;
  habitDayProgress: number; // e.g. 12 of 66
  weekDays: { name: string; checked: boolean; isToday?: boolean }[];
  achievements: {
    id: string;
    title: string;
    titleAr: string;
    earnedDate: string;
    icon: string;
    badgeStyle: string;
  }[];
}

export const INITIAL_HABIT_STREAK: HabitStreakState = {
  streakDays: 12,
  xp: 2460,
  level: 6,
  freezesAvailable: 1,
  perfectWeeks: 2,
  habitDayProgress: 12,
  weekDays: [
    { name: 'Mon', checked: true },
    { name: 'Tue', checked: true },
    { name: 'Wed', checked: true },
    { name: 'Thu', checked: true },
    { name: 'Fri', checked: true },
    { name: 'Sat', checked: true },
    { name: 'Sun', checked: true, isToday: true },
  ],
  achievements: [
    {
      id: 'ach_streak_star',
      title: 'Streak Star',
      titleAr: 'نجم الاستمرارية',
      earnedDate: 'Earned on Oct 8, 2026',
      icon: 'Stars',
      badgeStyle: 'from-amber-400 to-orange-500',
    },
    {
      id: 'ach_weekend_warrior',
      title: 'Weekend Warrior',
      titleAr: 'محارب عطلة الأسبوع',
      earnedDate: 'Earned on Oct 18, 2026',
      icon: 'ShieldAlert',
      badgeStyle: 'from-purple-500 to-indigo-600',
    },
    {
      id: 'ach_target_crusher',
      title: 'Target Crusher',
      titleAr: 'مقتنص الأهداف المالية',
      earnedDate: 'Earned on Oct 24, 2026',
      icon: 'Trophy',
      badgeStyle: 'from-emerald-400 to-teal-600',
    },
  ],
};

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
