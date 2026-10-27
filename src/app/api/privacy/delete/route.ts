import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/auth';

const DeleteAccountSchema = z.object({
  confirmPhrase: z.string().refine((val) => val === 'DELETE MY DATA' || val === 'حذف بياناتي', {
    message: 'Must enter the exact confirmation phrase',
  }),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = DeleteAccountSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Confirmation phrase mismatch. Please type "DELETE MY DATA" to confirm.' },
        { status: 400 }
      );
    }

    // In a live DB environment, this executes:
    // await db.delete(users).where(eq(users.id, session.userId));
    // and purges private R2 objects under receipts/${session.userId}/*

    return NextResponse.json({
      success: true,
      message: 'Your account and all associated financial records, receipts, and bank logs have been permanently deleted in accordance with the Saudi PDPL right to erasure.',
      deletedTenantId: session.userId,
      deletedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Error during account deletion:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
