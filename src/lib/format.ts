export function rupees(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return `Rs. ${Math.round(n).toLocaleString("en-IN")}`;
}

export function discountPct(mrp: number, selling: number): number {
  if (!mrp || mrp <= selling) return 0;
  return Math.round(((mrp - selling) / mrp) * 100);
}

export const FREE_DELIVERY_THRESHOLD = 999;
export const SHIPPING_FEE = 79;

/**
 * Units at or below which a SKU counts as low stock in the admin panel —
 * highlighted in the inventory table and the subject of its own filtered view.
 */
export const LOW_STOCK_THRESHOLD = 10;

/**
 * Largest `pack_or_carton_qty` still shown to a retail shopper.
 *
 * That column conflates two different things. For Yera and Dubblin the small
 * values are the real selling unit — Yera's own site lists "Set of 2 Pack",
 * "Set of 3 Pack" — but the large ones are WHOLESALE CARTON quantities (the
 * catalogue goes up to 160). Rendering those as "Pack of 124" against a
 * Rs. 125 bowl tells a shopper they are buying 124 bowls for Rs. 125.
 *
 * Twelve is the cut: at or below it the figure reads as a retail pack, above
 * it it is a carton and belongs in the bulk-orders conversation, not on a
 * product card.
 */
export const MAX_RETAIL_PACK_QTY = 12;

/** True when `pack_or_carton_qty` is plausibly a retail pack worth showing. */
export function isRetailPack(qty: number | null | undefined): boolean {
  return qty != null && qty > 1 && qty <= MAX_RETAIL_PACK_QTY;
}

/**
 * Renders `capacity_or_size` for display, adding the unit where the source
 * data omits it.
 *
 * Yera (241 of 250) and Dubblin (91 of 105) store capacity as a bare number —
 * "350", "435" — which reads as a price or a product code on a card. Both are
 * liquid-capacity ranges (jars, bowls, tumblers, bottles, flasks) and every
 * value is millilitres. Pigeon never stores a bare number: its values already
 * carry ml / L / mm / cm, or are null, so it is passed through untouched and
 * a cookware "280" is never mislabelled as 280ml.
 */
export function formatCapacity(
  capacity: string | null | undefined,
  brandSlug?: string | null,
): string | null {
  const value = capacity?.trim();
  if (!value) return null;
  const bareNumber = /^[0-9]+(\.[0-9]+)?$/.test(value);
  if (bareNumber && (brandSlug === "yera" || brandSlug === "dubblin")) {
    return `${value} ml`;
  }
  return value;
}

export function shippingFor(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const ENQUIRY_STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  closed: "Closed",
};

export const ORDER_PIPELINE = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const;
