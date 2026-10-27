import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/auth';
import { validateFileMagicBytes } from '@/server/storage';
import { parseSaudiReceipt } from '@/core/receipts';
import { computeTransactionFingerprint, Transaction } from '@/core/transactions';

const ProcessReceiptSchema = z.object({
  storageKey: z.string().optional(),
  fileBase64: z.string().optional(),
  zatcaQrBase64: z.string().optional(),
  ocrText: z.string().optional(),
  suggestedCategory: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = ProcessReceiptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid receipt payload' }, { status: 400 });
    }

    const { fileBase64, zatcaQrBase64, ocrText } = parsed.data;

    // Content verification: if raw file buffer is provided, validate magic bytes
    if (fileBase64) {
      const buffer = Buffer.from(fileBase64, 'base64');
      const validation = validateFileMagicBytes(new Uint8Array(buffer));
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.error || 'Invalid file signature' },
          { status: 422 }
        );
      }
    }

    // Process Saudi receipt through ZATCA TLV and OCR pipeline
    const receipt = parseSaudiReceipt({
      zatcaQrBase64,
      ocrText,
    });

    // Compute deterministic deduplication fingerprint
    const fingerprint = await computeTransactionFingerprint({
      userId: session.userId,
      date: receipt.date,
      amountHalalas: receipt.totalAmount.amountHalalas,
      description: receipt.merchantName,
    });

    const candidateTransaction: Transaction = {
      id: crypto.randomUUID(),
      userId: session.userId,
      accountId: 'acc_receipt_inbox',
      type: 'expense',
      category: receipt.lineItems[0]?.category || 'groceries',
      amountHalalas: receipt.totalAmount.amountHalalas,
      currency: 'SAR',
      date: receipt.date,
      description: receipt.merchantName,
      source: 'receipt_ocr',
      fingerprint,
      isTransfer: false,
      isRefund: false,
      notes: receipt.zatcaCompliant
        ? `ZATCA Verified • VAT No: ${receipt.vatNumber}`
        : 'Scanned Receipt',
      createdAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      receipt: {
        merchantName: receipt.merchantName,
        vatNumber: receipt.vatNumber,
        date: receipt.date.toISOString(),
        totalHalalas: receipt.totalAmount.amountHalalas.toString(),
        vatHalalas: receipt.vatAmount.amountHalalas.toString(),
        zatcaCompliant: receipt.zatcaCompliant,
        verifiedSavingsHalalas: receipt.verifiedSavings.amountHalalas.toString(),
        lineItems: receipt.lineItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPriceHalalas: item.unitPrice.amountHalalas.toString(),
          totalPriceHalalas: item.totalPrice.amountHalalas.toString(),
          discountHalalas: item.discount.amountHalalas.toString(),
          category: item.category,
        })),
      },
      candidateTransaction: {
        ...candidateTransaction,
        amountHalalas: candidateTransaction.amountHalalas.toString(),
      },
    });
  } catch (error: unknown) {
    console.error('Error processing receipt:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
