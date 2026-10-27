import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/server/auth';
import { createPresignedUploadUrl, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '@/server/storage';

const UploadUrlRequestSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = UploadUrlRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid upload request parameters', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { uploadUrl, storageKey, expiresInSeconds } = await createPresignedUploadUrl({
      userId: session.userId,
      fileName: parsed.data.fileName,
      fileSizeBytes: parsed.data.fileSizeBytes,
      mimeType: parsed.data.mimeType,
    });

    return NextResponse.json({
      success: true,
      uploadUrl,
      storageKey,
      expiresInSeconds,
      tenantId: session.userId,
    });
  } catch (error: unknown) {
    console.error('Error generating upload URL:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
