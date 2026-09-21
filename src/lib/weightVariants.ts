/**
 * Weight & Quantity Variants Utility for Singlaji Spices
 * Handles parsing, serialization, and price formatting for spice pack sizes
 * (e.g. 100gm, 250gm, 500gm, 1kg, 2.5kg, 5kg)
 */

export interface WeightVariant {
  weight: string; // e.g. "100gm", "250gm", "500gm", "1kg", "2.5kg"
  price: number;  // Price in INR (₹)
}

export const COMMON_WEIGHT_PRESETS = [
  '100gm',
  '250gm',
  '500gm',
  '1kg',
  '2kg',
  '2.5kg',
  '5kg',
];

/**
 * Parses weight string from database into an array of WeightVariant objects.
 * Supports:
 * 1. JSON string: [{"weight":"250gm","price":140}, ...]
 * 2. Legacy string: "500g" or "100gm, 250gm" -> falls back to single/multiple with base price
 * 3. Null/empty -> returns 1 default entry using fallbackPrice
 */
export function parseWeightVariants(
  weightStr: string | null | undefined,
  fallbackPrice: number
): WeightVariant[] {
  if (!weightStr || !weightStr.trim()) {
    return [];
  }

  const trimmed = weightStr.trim();

  // 1. Try parsing JSON array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter(
            (v): v is { weight: any; price: any } =>
              v && typeof v === 'object' && 'weight' in v
          )
          .map((v) => ({
            weight: String(v.weight).trim(),
            price: Number(v.price) > 0 ? Number(v.price) : fallbackPrice,
          }))
          .filter((v) => v.weight.length > 0);
      }
    } catch {
      // invalid JSON, fall through
    }
  }

  // 2. Legacy plain string (e.g. "500g" or "250gm / 500gm")
  const parts = trimmed.split(/[,/|]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 0) {
    return parts.map((w) => ({
      weight: w,
      price: fallbackPrice,
    }));
  }

  return [];
}

/**
 * Serializes weight variants array to JSON for database storage
 */
export function serializeWeightVariants(variants: WeightVariant[]): string {
  const valid = variants.filter(
    (v) => v && v.weight && v.weight.trim().length > 0 && Number(v.price) > 0
  );
  if (valid.length === 0) return '';
  return JSON.stringify(valid);
}

/**
 * Calculates the lowest starting price among variants
 */
export function getLowestVariantPrice(
  variants: WeightVariant[],
  fallbackPrice: number
): number {
  if (!variants || variants.length === 0) return fallbackPrice;
  const prices = variants.map((v) => Number(v.price)).filter((p) => p > 0);
  if (prices.length === 0) return fallbackPrice;
  return Math.min(...prices);
}

/**
 * Formats price display for product listings (e.g. "From ₹140" or "₹260")
 */
export function formatVariantPriceDisplay(
  variants: WeightVariant[],
  basePrice: number
): { formatted: string; hasMultiple: boolean; lowestPrice: number } {
  if (!variants || variants.length === 0) {
    return {
      formatted: `₹${Math.round(basePrice)}`,
      hasMultiple: false,
      lowestPrice: basePrice,
    };
  }

  if (variants.length === 1) {
    return {
      formatted: `₹${Math.round(variants[0].price)}`,
      hasMultiple: false,
      lowestPrice: variants[0].price,
    };
  }

  const lowest = getLowestVariantPrice(variants, basePrice);
  return {
    formatted: `From ₹${Math.round(lowest)}`,
    hasMultiple: true,
    lowestPrice: lowest,
  };
}

/**
 * Common base rate weight units for anchor pricing
 */
export const COMMON_RATE_ANCHORS = ['50gm', '100gm', '250gm', '500gm', '1kg'];

/**
 * Converts any weight string (e.g. "50g", "250gm", "1kg", "2.5kg") into grams
 */
export function parseGrams(weightStr: string): number {
  if (!weightStr) return 0;
  const clean = weightStr.toLowerCase().replace(/,/g, '').trim();

  // Match kg (e.g. "1kg", "2.5 kg", "1.5kilo")
  const kgMatch = clean.match(/^([\d.]+)\s*(?:kg|kilo|kilogram)s?$/i);
  if (kgMatch) {
    const val = parseFloat(kgMatch[1]);
    return isNaN(val) ? 0 : Math.round(val * 1000);
  }

  // Match gm/g (e.g. "50g", "250gm", "500 grams")
  const gMatch = clean.match(/^([\d.]+)\s*(?:gm|g|gram)s?$/i);
  if (gMatch) {
    const val = parseFloat(gMatch[1]);
    return isNaN(val) ? 0 : Math.round(val);
  }

  // Fallback to pure number
  const numOnly = parseFloat(clean);
  return isNaN(numOnly) ? 0 : Math.round(numOnly);
}

/**
 * Calculates variant price for a target weight based on an anchor rate
 * (e.g. base: 299 for 250gm, target: 1kg -> 1196)
 */
export function calculateVariantPrice(
  basePrice: number,
  baseWeightStr: string,
  targetWeightStr: string
): number {
  const baseGrams = parseGrams(baseWeightStr);
  const targetGrams = parseGrams(targetWeightStr);

  if (baseGrams <= 0 || targetGrams <= 0 || basePrice <= 0) {
    return Math.round(basePrice) || 0;
  }

  const ratePerGram = basePrice / baseGrams;
  return Math.round(targetGrams * ratePerGram);
}

/**
 * Generates an array of WeightVariants based on an anchor rate and target weight list
 */
export function generateVariantsFromRate(
  basePrice: number,
  baseWeightStr: string,
  targetWeights: string[]
): WeightVariant[] {
  return targetWeights.map((w) => ({
    weight: w,
    price: calculateVariantPrice(basePrice, baseWeightStr, w),
  }));
}

