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

export const ORDER_PIPELINE = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const;
