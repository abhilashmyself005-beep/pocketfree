import { pgTable, text, timestamp, boolean, bigint, uuid, varchar, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Users table - mapped 1:1 to Clerk Authentication identities
 */
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk User ID (e.g., 'user_2xyz...')
  email: text('email').notNull(),
  fullName: text('full_name'),
  preferredLanguage: varchar('preferred_language', { length: 5 }).default('ar').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Accounts table - Cash wallets, Bank accounts, Cards
 */
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'cash', 'bank', 'credit_card', 'savings'
  currency: varchar('currency', { length: 3 }).default('SAR').notNull(),
  initialBalanceHalalas: bigint('initial_balance_halalas', { mode: 'bigint' }).default(0n).notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Transactions table - Ledger entries in integer Halalas
 */
export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(), // 'income', 'expense', 'transfer'
  category: varchar('category', { length: 50 }).notNull(), // e.g. 'groceries', 'housing'
  amountHalalas: bigint('amount_halalas', { mode: 'bigint' }).notNull(),
  currency: varchar('currency', { length: 3 }).default('SAR').notNull(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  description: text('description').notNull(),
  source: varchar('source', { length: 30 }).default('cash_manual').notNull(), // 'cash_manual', 'bank_sync', 'receipt_ocr'
  fingerprint: text('fingerprint').notNull(), // Deduplication key
  isTransfer: boolean('is_transfer').default(false).notNull(),
  isRefund: boolean('is_refund').default(false).notNull(),
  relatedTransactionId: uuid('related_transaction_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Receipts table - Private document metadata
 */
export const receipts = pgTable('receipts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  storageKey: text('storage_key').notNull(), // Cloudflare R2 object key
  fileName: text('file_name').notNull(),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  status: varchar('status', { length: 30 }).default('pending').notNull(), // 'pending', 'processing', 'completed', 'failed'
  merchantName: text('merchant_name'),
  vatNumber: text('vat_number'), // Saudi ZATCA VAT registration number
  totalAmountHalalas: bigint('total_amount_halalas', { mode: 'bigint' }),
  vatAmountHalalas: bigint('vat_amount_halalas', { mode: 'bigint' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  transactions: many(transactions),
  receipts: many(receipts),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
}));
