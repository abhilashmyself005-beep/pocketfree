import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ForbiddenTenantAccessError } from '../auth';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Megabytes

/**
 * Validates file buffer by inspecting magic bytes rather than trusting filename extensions.
 */
export function validateFileMagicBytes(buffer: Uint8Array): { isValid: boolean; detectedMime?: string; error?: string } {
  if (buffer.length < 4) {
    return { isValid: false, error: 'File is empty or too small to be valid' };
  }

  // PNG magic bytes: 89 50 4E 47 (0x89 'P' 'N' 'G')
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { isValid: true, detectedMime: 'image/png' };
  }

  // JPEG magic bytes: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedMime: 'image/jpeg' };
  }

  // PDF magic bytes: 25 50 44 46 ('%PDF')
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { isValid: true, detectedMime: 'application/pdf' };
  }

  // WEBP magic bytes: 'RIFF' .... 'WEBP'
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { isValid: true, detectedMime: 'image/webp' };
  }

  return { isValid: false, error: 'Invalid file content: signature does not match allowed types (PNG, JPEG, WEBP, PDF)' };
}

/**
 * Cloudflare R2 S3 Client singleton
 */
function getR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey || accountId.includes('your_')) {
    return null; // Development mock fallback mode
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Generates a short-lived presigned upload URL for Cloudflare R2 with strict tenant isolation.
 */
export async function createPresignedUploadUrl(params: {
  userId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: AllowedMimeType;
}): Promise<{ uploadUrl: string; storageKey: string; expiresInSeconds: number }> {
  const { userId, fileName, fileSizeBytes, mimeType } = params;

  // 1. Validation checks
  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size ${fileSizeBytes} bytes exceeds maximum limit of ${MAX_FILE_SIZE_BYTES} bytes (10MB).`);
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`MIME type "${mimeType}" is not allowed. Supported: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  // 2. Derive isolated storage key: receipts/<userId>/<uuid>.<ext>
  const fileId = crypto.randomUUID();
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'bin';
  const storageKey = `receipts/${userId}/${fileId}.${ext}`;
  const bucketName = process.env.R2_BUCKET_NAME || 'pocketfree-receipts-private';
  const expiresInSeconds = 900; // 15 minutes

  const client = getR2Client();

  if (!client) {
    // Development Mock Presigned URL
    return {
      uploadUrl: `https://mock-r2.pocketfree.internal/upload?key=${encodeURIComponent(storageKey)}&expires=900`,
      storageKey,
      expiresInSeconds,
    };
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: storageKey,
    ContentType: mimeType,
    ContentLength: fileSizeBytes,
    Metadata: {
      'user-id': userId,
      'original-name': encodeURIComponent(fileName),
    },
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  return {
    uploadUrl,
    storageKey,
    expiresInSeconds,
  };
}

/**
 * Generates a short-lived presigned download URL for a private receipt object after verifying tenant isolation.
 */
export async function createPresignedDownloadUrl(params: {
  userId: string;
  storageKey: string;
}): Promise<{ downloadUrl: string; expiresInSeconds: number }> {
  const { userId, storageKey } = params;

  // Enforce tenant boundary: storage key must start with receipts/<userId>/
  const expectedPrefix = `receipts/${userId}/`;
  if (!storageKey.startsWith(expectedPrefix)) {
    throw new ForbiddenTenantAccessError(
      `Tenant "${userId}" is not authorized to access storage key "${storageKey}"`
    );
  }

  const bucketName = process.env.R2_BUCKET_NAME || 'pocketfree-receipts-private';
  const expiresInSeconds = 900; // 15 minutes

  const client = getR2Client();

  if (!client) {
    return {
      downloadUrl: `https://mock-r2.pocketfree.internal/download?key=${encodeURIComponent(storageKey)}&expires=900`,
      expiresInSeconds,
    };
  }

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: storageKey,
  });

  const downloadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  return {
    downloadUrl,
    expiresInSeconds,
  };
}
