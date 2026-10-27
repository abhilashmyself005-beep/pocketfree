import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/auth';
import { parseSaudiBankCsv, ingestBankRecords, RawBankRecord } from '@/core/banking';

const BankImportSchema = z.object({
  accountId: z.string().default('acc_bank_riyad'),
  csvContent: z.string().optional(),
  records: z
    .array(
      z.object({
        date: z.string(),
        description: z.string(),
        amount: z.string(),
        type: z.enum(['debit', 'credit']).optional(),
      })
    )
    .optional(),
  existingFingerprints: z.array(z.string()).default([]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = BankImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid bank import payload', details: parsed.error.format() }, { status: 400 });
    }

    let recordsToIngest: RawBankRecord[] = [];

    if (parsed.data.csvContent) {
      recordsToIngest = parseSaudiBankCsv(parsed.data.csvContent);
    } else if (parsed.data.records) {
      recordsToIngest = parsed.data.records;
    }

    if (recordsToIngest.length === 0) {
      return NextResponse.json({ error: 'No valid transaction records found to import' }, { status: 422 });
    }

    const fingerprintsSet = new Set(parsed.data.existingFingerprints);

    const result = await ingestBankRecords({
      userId: session.userId,
      accountId: parsed.data.accountId,
      records: recordsToIngest,
      existingFingerprints: fingerprintsSet,
    });

    return NextResponse.json({
      success: true,
      totalProcessed: result.totalProcessed,
      importedCount: result.newTransactions.length,
      duplicateCount: result.duplicatesIgnored.length,
      transfersNeutralCount: result.transfersNeutralCount,
      refundsCount: result.refundsCount,
      transactions: result.newTransactions.map((tx) => ({
        ...tx,
        amountHalalas: tx.amountHalalas.toString(),
      })),
      duplicates: result.duplicatesIgnored.map((d) => ({
        description: d.description,
        amountHalalas: d.amountHalalas.toString(),
        fingerprint: d.fingerprint,
      })),
    });
  } catch (error: unknown) {
    console.error('Error during bank transaction import:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
