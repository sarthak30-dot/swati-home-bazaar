/** Digits only, with country code, e.g. "911145678900" — see .env.example. */
export const STORE_PHONE = import.meta.env["VITE_STORE_PHONE"] as string | undefined;

/** "911145678900" -> "+91 11 4567 8900". Falls back to the raw digits if the
 *  configured number doesn't match this shape, rather than mis-grouping it. */
export function formatStorePhone(digits: string): string {
  const match = /^(\d{2})(\d{2})(\d{4})(\d{4})$/.exec(digits);
  return match ? `+${match[1]} ${match[2]} ${match[3]} ${match[4]}` : digits;
}
