import { describe, it, expect } from 'vitest';
import {
  validateFileMagicBytes,
  createPresignedUploadUrl,
  createPresignedDownloadUrl,
  MAX_FILE_SIZE_BYTES,
} from '../src/server/storage';
import { ForbiddenTenantAccessError } from '../src/server/auth';

describe('Cloudflare R2 Storage Adapter & File Content Validation', () => {
  const userId = 'user_clerk_saudi_pilot';

  it('validates authentic PNG file by magic bytes', () => {
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const result = validateFileMagicBytes(pngHeader);
    expect(result.isValid).toBe(true);
    expect(result.detectedMime).toBe('image/png');
  });

  it('validates authentic JPEG file by magic bytes', () => {
    const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const result = validateFileMagicBytes(jpegHeader);
    expect(result.isValid).toBe(true);
    expect(result.detectedMime).toBe('image/jpeg');
  });

  it('validates authentic PDF file by magic bytes', () => {
    const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e]);
    const result = validateFileMagicBytes(pdfHeader);
    expect(result.isValid).toBe(true);
    expect(result.detectedMime).toBe('application/pdf');
  });

  it('rejects spoofed file (e.g. bash script disguised with a .png extension)', () => {
    // Starts with '#!/bin/bash'
    const scriptBuffer = new TextEncoder().encode('#!/bin/bash\nrm -rf /');
    const result = validateFileMagicBytes(scriptBuffer);
    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/signature does not match/);
  });

  it('generates presigned upload URL with strict tenant-scoped storage key', async () => {
    const result = await createPresignedUploadUrl({
      userId,
      fileName: 'invoice_october.pdf',
      fileSizeBytes: 1024 * 500, // 500 KB
      mimeType: 'application/pdf',
    });

    expect(result.storageKey.startsWith(`receipts/${userId}/`)).toBe(true);
    expect(result.storageKey.endsWith('.pdf')).toBe(true);
    expect(result.expiresInSeconds).toBe(900);
  });

  it('rejects upload requests that exceed the 10MB limit', async () => {
    await expect(
      createPresignedUploadUrl({
        userId,
        fileName: 'oversized_scan.png',
        fileSizeBytes: MAX_FILE_SIZE_BYTES + 1,
        mimeType: 'image/png',
      })
    ).rejects.toThrowError(/exceeds maximum limit/);
  });

  it('enforces tenant isolation on download URLs, blocking cross-tenant object access', async () => {
    const foreignUserKey = 'receipts/user_malicious_attacker/secret_receipt.jpg';

    await expect(
      createPresignedDownloadUrl({
        userId,
        storageKey: foreignUserKey,
      })
    ).rejects.toThrow(ForbiddenTenantAccessError);
  });
});
