/**
 * Site-wide constants.
 *
 * SITE_URL is the canonical origin used for canonical links, og:image and the
 * sitemap. Override with VITE_SITE_URL once a custom domain is attached.
 */
export const SITE_URL = (
  (import.meta.env?.["VITE_SITE_URL"] as string | undefined) || "https://swati-clone.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "Swati Enterprises";

/** Absolute URL for a path or already-absolute URL. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/**
 * Contact details shown in the header, footer and on the contact page.
 * These are the values ops must confirm before launch — see HANDOFF.md.
 * WhatsApp is the default support channel for this customer base.
 */
export const CONTACT = {
  phoneDisplay: "+91 11 4567 8900",
  phoneHref: "tel:+911145678900",
  whatsappHref: "https://wa.me/911145678900",
  email: "care@swatienterprises.in",
} as const;

/**
 * Business days promised for retail delivery inside the serviceable zone.
 * Ops should confirm this before launch — it drives the delivery estimate on
 * the product page.
 */
export const DELIVERY_DAYS = { min: 2, max: 4 } as const;
