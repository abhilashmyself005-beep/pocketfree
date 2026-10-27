import { describe, it, expect } from 'vitest';
import { SAUDI_REGULATED_INVESTMENTS, REGULATORY_COMPLIANCE_DISCLOSURE } from '../src/core/investments';

describe('Investments Compliance & Truthfulness Safeguards', () => {
  it('strictly specifies authorized Saudi regulators for all listed investments', () => {
    for (const inv of SAUDI_REGULATED_INVESTMENTS) {
      expect(['CMA', 'Ministry of Finance', 'SAMA']).toContain(inv.regulator);
      expect(inv.officialLink.startsWith('https://')).toBe(true);
      expect(inv.indicativeAnnualYield.length).toBeGreaterThan(3);
    }
  });

  it('provides bilingual compliance disclaimers prohibiting fabricated returns', () => {
    expect(REGULATORY_COMPLIANCE_DISCLOSURE.en).toContain('NOT a licensed investment advisor');
    expect(REGULATORY_COMPLIANCE_DISCLOSURE.ar).toContain('ولا يقدم أي استشارات استثمارية');
  });
});
