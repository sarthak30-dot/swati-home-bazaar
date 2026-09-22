/**
 * Delivery serviceability.
 *
 * Swati Enterprises runs two very different fulfilment models, and the
 * storefront has to be honest about both:
 *
 *   1. Retail delivery — currently Delhi only, restricted to a set of PIN codes.
 *   2. Bulk / wholesale orders — available pan-India, handled as an enquiry
 *      rather than a checkout.
 *
 * A shopper outside the retail zone should never hit a dead end: they are
 * redirected to the bulk enquiry route instead of being told "we don't deliver".
 */

export type Serviceability =
  | { status: "invalid"; message: string }
  | { status: "serviceable"; pin: string; area?: string; message: string }
  | { status: "bulk-only"; pin: string; message: string };

/**
 * Retail-serviceable Delhi PIN codes — seed/fallback list.
 *
 * The live list is managed through the admin panel and stored in the
 * `serviceable_pins` Supabase table. This array is the client-side fallback
 * used on first paint before the async fetch resolves.
 */
export const SERVICEABLE_PINS: string[] = [
  "110006", // Chandni Chowk — warehouse
];

/** Fetch live serviceable PINs from the database. Falls back silently on error. */
export async function fetchServiceablePins(): Promise<string[]> {
  try {
    // Lazy import so SSR and non-Supabase contexts are not affected.
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("serviceable_pins")
      .select("pin");
    if (error) return SERVICEABLE_PINS;
    return (data ?? []).map((r: { pin: string }) => r.pin);
  } catch {
    return SERVICEABLE_PINS;
  }
}

/** Delhi PIN codes all sit in the 1100xx block. */
export const DELHI_PIN_PREFIX = "110";

export function isWellFormedPin(raw: string): boolean {
  // Indian PIN codes are exactly six digits and never start with zero.
  return /^[1-9][0-9]{5}$/.test(raw.trim());
}

/**
 * Decide what a shopper sees after entering a PIN code.
 *
 * Strict rule: only PINs explicitly confirmed in `SERVICEABLE_PINS` are
 * retail-serviceable. Every other PIN — including unconfirmed Delhi PINs —
 * is routed to the bulk enquiry flow rather than accepted as a retail order.
 * This is accurate to what ops can actually fulfil today; it will under-serve
 * nearby customers until `SERVICEABLE_PINS` is filled in with the real list.
 */
export function checkServiceability(raw: string, pins: string[] = SERVICEABLE_PINS): Serviceability {
  const pin = raw.trim();

  if (!isWellFormedPin(pin)) {
    return { status: "invalid", message: "Enter a valid 6-digit PIN code." };
  }

  if (pins.includes(pin)) {
    return {
      status: "serviceable",
      pin,
      message: "Great news! Retail delivery is available at this PIN code.",
    };
  }

  const message = pin.startsWith(DELHI_PIN_PREFIX)
    ? "We don't retail-deliver to this Delhi PIN yet. Bulk orders ship across India — send us an enquiry."
    : "We deliver retail orders in Delhi. Bulk orders ship across India — send us an enquiry.";

  return { status: "bulk-only", pin, message };
}

const STORAGE_KEY = "swati.pin";

export function loadSavedPin(): string | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved && isWellFormedPin(saved) ? saved : null;
}

export function savePin(pin: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, pin);
}

export function clearPin(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
