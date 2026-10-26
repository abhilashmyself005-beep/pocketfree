/**
 * Core Financial Money Engine (Zero Floating-Point Arithmetic)
 *
 * All values are stored as integer minor units (Halalas: 1 SAR = 100 Halalas).
 * Designed for absolute accuracy conforming to Saudi financial regulations.
 */

export type CurrencyCode = 'SAR';

export interface Money {
  readonly amountHalalas: bigint;
  readonly currency: CurrencyCode;
}

/**
 * Creates a Money instance from Halalas (bigint or safe integer)
 */
export function moneyFromHalalas(halalas: bigint | number, currency: CurrencyCode = 'SAR'): Money {
  const amount = typeof halalas === 'bigint' ? halalas : BigInt(Math.round(halalas));
  return { amountHalalas: amount, currency };
}

/**
 * Parses a decimal SAR string or number into exact integer Halalas.
 * Never performs floating point multiplication directly on unparsed decimals.
 * Examples: "150.75" -> 15075n, "150" -> 15000n, "150.5" -> 15050n, "-25.99" -> -2599n
 */
export function moneyFromSarString(value: string | number, currency: CurrencyCode = 'SAR'): Money {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid monetary amount: ${value}`);
    }
    // Convert to fixed 2 decimal string to avoid IEEE 754 float precision loss
    value = value.toFixed(2);
  }

  const clean = value.trim().replace(/,/g, '');
  if (!/^-?\d+(\.\d{1,2})?$/.test(clean)) {
    throw new Error(`Invalid SAR amount format: "${value}". Expected up to 2 decimal places.`);
  }

  const isNegative = clean.startsWith('-');
  const unsigned = isNegative ? clean.slice(1) : clean;
  const [whole, fractional = ''] = unsigned.split('.');
  const paddedFractional = (fractional + '00').slice(0, 2);

  const totalHalalas = BigInt(whole) * 100n + BigInt(paddedFractional);
  return {
    amountHalalas: isNegative ? -totalHalalas : totalHalalas,
    currency,
  };
}

/**
 * Addition of two Money amounts of the same currency
 */
export function addMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return {
    amountHalalas: a.amountHalalas + b.amountHalalas,
    currency: a.currency,
  };
}

/**
 * Subtraction of two Money amounts of the same currency
 */
export function subtractMoney(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return {
    amountHalalas: a.amountHalalas - b.amountHalalas,
    currency: a.currency,
  };
}

/**
 * Multiplies money by an integer factor or basis points (100 basis points = 1%)
 */
export function multiplyMoneyByBasisPoints(m: Money, basisPoints: bigint): Money {
  // basisPoints e.g. 1500n for 15% VAT (1500 / 10000)
  const product = m.amountHalalas * basisPoints;
  // Standard banker's / half-up rounding on integer division
  const half = product >= 0n ? 5000n : -5000n;
  const rounded = (product + half) / 10000n;
  return {
    amountHalalas: rounded,
    currency: m.currency,
  };
}

/**
 * Formats Money for presentation
 * Example: 15075 Halalas -> "150.75 SAR" or "150.75 ر.س"
 */
export function formatMoney(
  m: Money,
  options: {
    locale?: 'en' | 'ar';
    showCurrency?: boolean;
    useSymbol?: boolean;
    easternNumerals?: boolean;
  } = {}
): string {
  const { locale = 'en', showCurrency = true, useSymbol = false, easternNumerals = false } = options;
  const isNegative = m.amountHalalas < 0n;
  const absHalalas = isNegative ? -m.amountHalalas : m.amountHalalas;

  const whole = absHalalas / 100n;
  const fractional = absHalalas % 100n;
  
  const numLocale = easternNumerals && locale === 'ar' ? 'ar-SA' : 'en-US';
  const formattedWhole = whole.toLocaleString(numLocale);
  const formattedFractional = fractional.toString().padStart(2, '0');

  const formattedNumber = `${isNegative ? '-' : ''}${formattedWhole}.${formattedFractional}`;

  if (!showCurrency) {
    return formattedNumber;
  }

  if (locale === 'ar') {
    const symbol = useSymbol ? 'ر.س' : 'ريال';
    return `${formattedNumber} ${symbol}`;
  }

  return `${formattedNumber} SAR`;
}

/**
 * Converts Halalas to numeric SAR for charts or display only (never for financial storage/calculation)
 */
export function toNumericSar(m: Money): number {
  return Number(m.amountHalalas) / 100;
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`Currency mismatch: cannot operate on ${a.currency} and ${b.currency}`);
  }
}
