# Recon map: Beyond Budget (com.beyondbudget)

Scope: Zero-Based Envelope Budgeting, "Give Every Riyal a Job" Fund Allocation, Debt Snowball / Payoff Calculator, and Savings Envelope Goals.
For: Pocketfree (Saudi Personal Finance Ecosystem)
Date: 2026-10-27

---

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | Google Play Store Listing | `https://play.google.com/store/apps/details?id=com.beyondbudget` | Zero-based budgeting, envelope funding, debt payoff schedules |
| 2 | Beyond Budget Official Website | `https://beyondbudgetapp.com/` | Core philosophy: "Give Every Dollar A Job", envelope rollover |
| 3 | Public App Reviews | Trustpilot, Google Play | Praised for debt snowball and envelope funding clarity; criticized when sync breaks |

---

## Core Loop

Users receive their monthly income into a single **"Ready to Assign"** pool. They fund digital **Envelopes** (Groceries, Rent, Emergency, Debt Snowball) until `Ready to Assign = 0 SAR`. If an envelope is overspent, they cover it from another envelope with one click.

---

## Screens & Components

| ID | screen | purpose | key components |
| --- | --- | --- | --- |
| S01 | Ready-to-Assign Header & Envelope Manager | Zero-based assignment engine | Unassigned Pool Badge, Quick Allocate Button, Auto-Fill Target |
| S02 | Category Envelopes Grid | Visual digital envelopes with allocated, spent, and remaining | Envelope card, progress fill bar, "Move Money" drawer, rollover toggle |
| S03 | Debt Snowball / Avalanche Payoff Planner | Accelerated debt payoff tracker | Debt list (credit card, auto loan, personal finance), extra monthly payment slider, payoff date countdown |
| S04 | Savings Goal Pockets | Sinking funds with target dates | Target amount, monthly contribution suggestion, completion percentage |

---

## Inferred Data Model

```
Envelope:
  id: string
  name: string
  allocatedHalalas: bigint
  spentHalalas: bigint
  targetHalalas: bigint
  category: string
  icon: string

DebtItem:
  id: string
  name: string
  principalHalalas: bigint
  interestRateApr: number
  minimumPaymentHalalas: bigint
  extraPaymentHalalas: bigint
  dueDate: string
```
