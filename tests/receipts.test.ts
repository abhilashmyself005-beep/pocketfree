import { describe, it, expect } from 'vitest';
import {
  encodeZatcaTlv,
  decodeZatcaTlv,
  parseSaudiReceipt,
} from '../src/core/receipts';

describe('Saudi ZATCA e-Invoicing QR & Receipt Parser', () => {
  it('correctly encodes and decodes ZATCA TLV Base64 format to exact integer Halalas', () => {
    const rawData = {
      sellerName: 'شركة أسواق التميمي المحدودة',
      vatNumber: '300055443322003',
      timestamp: '2026-10-26T14:45:00.000Z',
      totalAmount: '230.00',
      vatAmount: '30.00',
    };

    const base64Zatca = encodeZatcaTlv(rawData);
    expect(typeof base64Zatca).toBe('string');
    expect(base64Zatca.length).toBeGreaterThan(30);

    const decoded = decodeZatcaTlv(base64Zatca);

    expect(decoded.sellerName).toBe(rawData.sellerName);
    expect(decoded.vatNumber).toBe(rawData.vatNumber);
    expect(decoded.totalAmount.amountHalalas).toBe(23000n); // 230.00 SAR -> 23000 Halalas
    expect(decoded.vatAmount.amountHalalas).toBe(3000n); // 30.00 SAR -> 3000 Halalas
  });

  it('parses ZATCA QR input into a full compliant receipt model', () => {
    const base64Zatca = encodeZatcaTlv({
      sellerName: 'Danube Supermarket',
      vatNumber: '300012345678903',
      timestamp: '2026-10-27T10:00:00.000Z',
      totalAmount: '450.75',
      vatAmount: '58.79',
    });

    const parsed = parseSaudiReceipt({ zatcaQrBase64: base64Zatca });

    expect(parsed.merchantName).toBe('Danube Supermarket');
    expect(parsed.vatNumber).toBe('300012345678903');
    expect(parsed.totalAmount.amountHalalas).toBe(45075n);
    expect(parsed.vatAmount.amountHalalas).toBe(5879n);
    expect(parsed.zatcaCompliant).toBe(true);
  });

  it('extracts merchant and promotional discount as verified savings from OCR text', () => {
    const sampleOcrText = `
      شركة أسواق بنده للتجزئة
      Panda Hypermarket - Riyadh Exit 5
      الرقم الضريبي: 300088776655003
      --------------------------------
      Almarai Fresh Milk 2L     11.00 SAR
      Sadia Chicken 1kg         18.50 SAR
      DISCOUNT / وفر ترويجي:     4.50 SAR
      --------------------------------
      TOTAL / الإجمالي:          25.00 SAR
    `;

    const parsed = parseSaudiReceipt({ ocrText: sampleOcrText });

    expect(parsed.merchantName).toBe('Panda Hypermarket');
    expect(parsed.vatNumber).toBe('300088776655003');
    expect(parsed.totalAmount.amountHalalas).toBe(2500n);
    // Verified promotional savings extracted
    expect(parsed.verifiedSavings.amountHalalas).toBe(450n); // 4.50 SAR -> 450 Halalas
  });
});
