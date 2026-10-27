# Architecture: Pocketfree (Rebuild of FinArt's Core Features)

## Stack

| layer | choice | why |
| --- | --- | --- |
| web | Next.js 16 (App Router) + TypeScript | React 19 server/client components, high performance, PWA-ready |
| styling | Tailwind CSS v4 + Lucide Icons | Responsive, ultra-fast styling matching UI Pro Max design guidelines |
| local engine | Client-Side Storage + LocalStorage Vault | 100% on-device privacy matching FinArt's core selling point (no bank credentials) |
| parsing engine | TypeScript Regex Pattern Parser | Instant parsing of multi-bank notification alerts (Al Rajhi, SNB, Riyad, STC Pay, Apple Pay) |
| analytics | Native SVG Charts (Donut + Cash Flow Bars) | Zero heavy external bundle dependencies, responsive and accessible |
| hosting | Vercel | Live edge deployment at pocketfree.vercel.app |

---

## Schema

```sql
-- Client schema / IndexedDB / LocalStorage representation
CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('mada', 'credit', 'bank', 'wallet', 'cash')),
  account_number_suffix TEXT,
  balance NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'SAR',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT CHECK(type IN ('debit', 'credit')),
  category TEXT NOT NULL,
  merchant TEXT NOT NULL,
  raw_sms TEXT,
  date TIMESTAMPTZ NOT NULL,
  is_duplicate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  limit_amount NUMERIC NOT NULL,
  spent_amount NUMERIC DEFAULT 0,
  month TEXT NOT NULL, -- YYYY-MM
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bills (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  frequency TEXT CHECK(frequency IN ('monthly', 'yearly', 'weekly')),
  is_paid BOOLEAN DEFAULT FALSE,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## The Parts that Bite

- **SMS Format Divergence**: Different banks format currencies and merchant names differently (e.g. `SAR 45.00 at Panda`, `مبلغ 45.00 ر.س لدى بندة`, `Apple Pay: Panda Store`). The regex parser handles Arabic/English numerals, removes trailing reference codes, and maps merchants to canonical names.
- **Idempotency & Duplicate Guards**: Bank SMS can occasionally be sent twice or re-triggered by the user. Transactions with identical amount, merchant, and timestamp within 5 minutes are flagged.
- **Privacy Assurance**: No financial records or SMS texts are ever transmitted over the network; everything is processed locally in the browser sandbox.

---

## Build Order

1. **Vertical Slice**:
   - `BankAlertParser`: Live text & simulated stream input -> Instant parsing into structured transaction -> Ledger update.
2. **Must-Haves**:
   - `MultiAccountHub`: Overview of cards and balances.
   - `CategoryBudgetPlanner`: Interactive monthly budget sliders with 80%/100% threshold color indicators.
   - `BillReminderManager`: Upcoming subscription and utility bill countdowns with "Mark Paid" trigger.
3. **Should-Haves**:
   - `CashFlowAnalytics`: Donut category split & monthly breakdown.
   - `PrivacyVault`: Data export (CSV/JSON), encrypted backup, single-click local data wipe.
