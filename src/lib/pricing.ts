/**
 * Pure selling-price maths for the admin bulk price tool.
 *
 * Deliberately free of imports: this is the money path, so it is kept
 * dependency-free and directly testable rather than reachable only through a
 * Supabase round trip.
 */

/**
 * Reads a money value out of a spreadsheet cell.
 *
 * Indian price columns arrive as "Rs. 1,749", "₹1234", "1,234.50" or plain
 * "1749". Stripping every character outside [0-9.-] is NOT enough: the full
 * stop in "Rs." survives and becomes a decimal point, so "Rs. 1,749" parses as
 * 0.1749 — seventeen paise instead of one thousand seven hundred and forty
 * nine rupees. Thousands separators and spaces are removed first, then the
 * first number that actually begins with a digit is taken.
 */
export function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[,\s]/g, "");
  const match = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

/** As `parseMoney`, rounded to a whole number for quantity columns. */
export function parseCount(raw: string): number | null {
  const n = parseMoney(raw);
  return n == null ? null : Math.round(n);
}

export type BulkPriceMode =
  /** selling_price = mrp - pct% */
  | "discount_off_mrp"
  /** selling_price = current selling_price +/- pct% */
  | "adjust_current";

export type PriceResult = {
  /** The price to write, always a whole rupee and always >= 1. */
  price: number;
  /** True when the requested change would have landed above MRP. */
  clamped: boolean;
};

/**
 * Prices come back from Postgres `numeric` as strings via PostgREST, so every
 * value is coerced before arithmetic — `"1795" * 0.9` happens to work in JS but
 * `"1795" + 1` does not, and relying on that is how a price becomes "17951".
 */
export function nextSellingPrice(
  input: { mrp: number | string; selling_price: number | string },
  mode: BulkPriceMode,
  pct: number,
): PriceResult {
  const mrp = Number(input.mrp);
  const current = Number(input.selling_price);

  const raw = mode === "discount_off_mrp" ? mrp * (1 - pct / 100) : current * (1 + pct / 100);
  const rounded = Math.round(raw);
  const mrpWhole = Math.round(mrp);

  // Never publish a selling price above MRP — `catalog_variants.discount_pct`
  // would go negative and the storefront would show a struck-through price
  // lower than the price actually being charged.
  const capped = Math.min(rounded, mrpWhole);

  return { price: Math.max(1, capped), clamped: rounded > mrpWhole };
}
