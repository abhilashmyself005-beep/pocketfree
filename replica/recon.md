# Recon map: FinArt AI Automatic Expense Tracker (Web & Mobile PWA)

Scope: Automated SMS/Alert parsing, Category Budgets, Bill & Subscription Reminders, Multi-Account Financial Hub, and Private On-Device Data Engine.
For: Pocketfree (Saudi Personal Finance & Smart Shopping Ecosystem)
Date: 2026-10-27

---

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | Google Play Store Listing | `https://play.google.com/store/apps/details?id=com.finart` | Core features, privacy promise (no bank login), 4.5+ star review breakdown |
| 2 | Official Website | `https://www.finart.app/` | Feature architecture, automated SMS parsing explanation, multi-currency support |
| 3 | FinArt Security & Privacy Docs | `https://www.finart.app/privacy.html` | 100% private, on-device parsing of transaction notifications, no banking credentials required |
| 4 | Apple App Store Listing | `https://apps.apple.com/app/finart-expense-tracker/id1527715011` | iOS counterpart, Apple Pay & wallet alert parsing flows |

---

## Core Loop

Automatically converts messy financial SMS, bank alerts, and notifications into structured income/expense entries, categorizes spending, and warns users before budgets are broken or bills are missed—without requiring bank login credentials.

---

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Smart Alert Parser & Transaction Feed | `/feed` or `/transactions` | Ingests SMS/bank text alerts or simulates live incoming feed | SMS raw text box, live feed list, parse status badge, duplicate detector | empty (no alerts), parsing, alert parsed, duplicate flagged |
| S02 | Multi-Account & Card Hub | `/accounts` | Tracks balances across cards, mada, cash wallets, digital accounts | Account card cards, balance total, add account modal, currency indicator | empty (0 accounts), active accounts, negative balance alert |
| S03 | Category Budget Planner | `/budgets` | Set and monitor monthly category budgets (Groceries, Dining, Bills) | Budget slider/input, category progress bars (green/yellow/red), 80% & 100% warning badges | empty (no budgets), on track (<80%), warning (80-99%), overbudget (>=100%) |
| S04 | Bill & Subscription Reminders | `/bills` | Monitors recurring subscriptions, utilities, and due dates | Bill card, calendar countdown, frequency selector (monthly/yearly), paid toggle | empty (no bills), upcoming (due in <= 3 days), overdue, paid |
| S05 | Analytics & Cash Flow Reports | `/analytics` | Visual breakdown of monthly expenses vs income and category share | Donut category breakdown, monthly cash flow bar chart, top merchant leaderboard | empty, populated, date-range filtered |
| S06 | Privacy & Data Vault (Export/Import) | `/privacy` | Export encrypted JSON/CSV, purge data, verify local-only execution | Local-first status badge, export button, backup restore upload, wipe confirmation | ready, exporting, restored, wiped |

---

## User Flows

```
F01 Automated Bank Alert Ingestion (Happy Path: 1 Click)
    User pastes or receives Bank SMS/Alert -> System detects Amount, Merchant, Date, Account, & Category -> Transaction added to ledger -> Budget progress updated in real time.
    Clicks: 1 (or 0 with simulated live feed listener)
    Edge cases: Unrecognized format falls back to manual classification; duplicate transaction within 5 minutes flagged.

F02 Monthly Budget Setup & Threshold Alert
    User opens S03 Budgets -> Selects Category (e.g. Groceries 1,500 SAR) -> Saves budget -> As transactions occur, visual gauge changes from Emerald (#22C55E) -> Amber (#F59E0B) at 80% -> Coral Red (#EF4444) at 100%.
    Clicks: 2 clicks to set budget.

F03 Bill & Recurring Subscription Reminder
    User adds recurring bill (e.g., STC Postpaid 250 SAR due on 28th) -> System displays countdown ("Due in 2 days") -> User clicks "Mark Paid" -> Deducted from default account and transaction logged.
    Clicks: 1 click to mark paid.
```

---

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| SMSNotificationParser | input box, live simulated feed, preview card | idle, parsing, success, invalid | S01 |
| TransactionCard | debit (expense), credit (income), duplicate alert | normal, expanded, selected, deleted | S01, S05 |
| BudgetProgressBar | green (<80%), yellow (80-99%), red (>=100%) | normal, animating, exceeded | S03, S01 |
| AccountCard | Mada, Credit Card, Bank, Cash, Digital Wallet | active, low balance, hidden | S02 |
| BillReminderBadge | upcoming, due today, overdue, paid | normal, urgent pulse | S04 |
| CategoryDonutChart | SVG Interactive with legend | loading, rendered, hover slice | S05 |
| PrivacyShieldBanner | 100% On-Device verification badge | active, verified | S01, S06 |

---

## Inferred Data Model

```
Transaction:
  id: string (uuid)
  amount: number (SAR / USD)
  type: 'debit' | 'credit'
  category: 'Groceries' | 'Dining' | 'Utilities' | 'Transport' | 'Shopping' | 'Entertainment' | 'Health' | 'Salary' | 'Other'
  merchant: string
  accountId: string (reference to Account)
  date: string (ISO timestamp)
  rawSms: string (optional source SMS text)
  isDuplicate: boolean
  confidence: high

Account:
  id: string
  name: string (e.g. "Al Rajhi Mada", "SNB Mastercard", "Cash Wallet")
  type: 'mada' | 'credit' | 'bank' | 'wallet' | 'cash'
  balance: number
  currency: string (default "SAR")
  accountNumberSuffix: string (e.g. "8821")
  confidence: high

Budget:
  id: string
  category: string
  limitAmount: number
  spentAmount: number
  month: string (YYYY-MM)
  confidence: high

Bill:
  id: string
  title: string (e.g. "STC Fiber", "SEC Electricity", "Netflix", "Car Insurance")
  amount: number
  dueDate: string (YYYY-MM-DD)
  frequency: 'monthly' | 'yearly' | 'weekly'
  isPaid: boolean
  category: string
  confidence: high
```

---

## Feature Matrix Summary

- **Must Have (Core FinArt Parity):**
  - Instant SMS/Bank alert parser (supports Saudi banks: Al Rajhi, SNB, Riyad, Alinma, STC Pay, Apple Pay)
  - Zero bank credentials required (100% on-device local storage)
  - Category budget tracking with visual limit warnings
  - Bill & subscription calendar reminders
  - Multi-account / card tracking
- **Out of Scope for Clean-Room Replica:**
  - Android-specific background telephony SMS broadcast receivers (requires native Android APK privileges; we implement the universal browser PWA / web-compatible input + simulated real-time stream + clipboard/notification listener).

---

## Size & Complexity

- **Screens:** 6 screens / tabs
- **Flows:** 3 primary flows
- **Entities:** 4 core entities (Transaction, Account, Budget, Bill)
- **Hard Parts:** Accurate regex & pattern matching for banking SMS alerts in Arabic & English with currency symbol normalisation.
- **Project Size:** Medium (M)
