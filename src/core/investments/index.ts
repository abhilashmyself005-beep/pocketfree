export type InvestmentRiskLevel = 'very_low' | 'low' | 'moderate' | 'growth';

export interface InvestmentOption {
  id: string;
  name: { en: string; ar: string };
  provider: string;
  regulator: 'CMA' | 'Ministry of Finance' | 'SAMA';
  shariaCompliant: boolean;
  riskLevel: InvestmentRiskLevel;
  indicativeAnnualYield: string; // e.g. "5.60% p.a."
  liquidity: { en: string; ar: string };
  minInvestmentHalalas: bigint;
  description: { en: string; ar: string };
  officialLink: string;
}

export const SAUDI_REGULATED_INVESTMENTS: InvestmentOption[] = [
  {
    id: 'gov_sah_sukuk',
    name: {
      en: 'Sah (صح) Government Savings Sukuk',
      ar: 'صكوك صح الحكومية للادخار',
    },
    provider: 'Ministry of Finance & NDMC (المركز الوطني لإدارة الدين)',
    regulator: 'Ministry of Finance',
    shariaCompliant: true,
    riskLevel: 'very_low',
    indicativeAnnualYield: '5.64% p.a. (Fixed)',
    liquidity: { en: 'Annual maturity with monthly distribution', ar: 'استحقاق سنوي مع إمكانية الاسترداد' },
    minInvestmentHalalas: 100000n, // 1,000 SAR minimum
    description: {
      en: 'Sovereign Sharia-compliant savings sukuk issued by the Saudi Ministry of Finance specifically for individual Saudi citizens.',
      ar: 'صكوك ادخارية سيادية متوافقة مع الشريعة ومخصصة للأفراد ومدعومة بالكامل من وزارة المالية السعودية.',
    },
    officialLink: 'https://ndmc.gov.sa',
  },
  {
    id: 'cma_murabaha_fund',
    name: {
      en: 'SAR Liquidity Murabaha Fund',
      ar: 'صندوق الراجحي للمضاربة بالبضائع والسيولة',
    },
    provider: 'Al Rajhi Capital (CMA Licensed)',
    regulator: 'CMA',
    shariaCompliant: true,
    riskLevel: 'low',
    indicativeAnnualYield: '5.10% - 5.40% p.a. (Historical)',
    liquidity: { en: 'Daily liquidity (T+1 redemption)', ar: 'سيولة يومية استرداد خلال يوم عمل' },
    minInvestmentHalalas: 100000n, // 1,000 SAR
    description: {
      en: 'Low-risk money market fund investing in short-term Sharia-compliant commodity murabaha deposits.',
      ar: 'صندوق نقد منخفض المخاطر يستثمر في مرابحات السلع قصيرة الأجل والمتوافقة مع الضوابط الشرعية.',
    },
    officialLink: 'https://www.alrajhi-capital.com',
  },
  {
    id: 'tadawul_sharia_etf',
    name: {
      en: 'Al Bilad Saudi Sovereign Sukuk ETF',
      ar: 'صندوق البلاد المتداول للصكوك السيادية السعودية',
    },
    provider: 'Albilad Capital (Tadawul Listed)',
    regulator: 'CMA',
    shariaCompliant: true,
    riskLevel: 'low',
    indicativeAnnualYield: '4.95% p.a. (Trailing 12M)',
    liquidity: { en: 'Instant trading on Tadawul exchange', ar: 'تداول فوري في سوق الأسهم السعودية (تداول)' },
    minInvestmentHalalas: 1000n, // 10 SAR per unit
    description: {
      en: 'Exchange-traded fund tracking Saudi sovereign sukuk with daily trading flexibility and monthly dividend payouts.',
      ar: 'صندوق استثماري متداول يتبع أداء الصكوك السيادية السعودية ويوفر توزيعات دورية وسيولة فورية.',
    },
    officialLink: 'https://www.albilad-capital.com',
  },
];

export const REGULATORY_COMPLIANCE_DISCLOSURE = {
  en: 'Regulatory Notice: Pocketfree is an educational personal finance management tool and NOT a licensed investment advisor or broker. All listed instruments are regulated by the Capital Market Authority (CMA) or the Saudi Ministry of Finance. Historical yields do not guarantee future returns. Always evaluate your personal risk tolerance before investing.',
  ar: 'إشعار تنظيمي وإخلاء مسؤولية: تطبيق بوكيت فري أداة رقمية لإدارة الميزانية الشخصية، ولا يقدم أي استشارات استثمارية أو وساطة مالية. جميع المنتجات المذكورة تخضع لإشراف هيئة السوق المالية أو وزارة المالية. العوائد التاريخية لا تضمن النتائج المستقبلية.',
};
