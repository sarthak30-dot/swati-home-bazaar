import { supabase } from "@/integrations/supabase/client";
import { LOW_STOCK_THRESHOLD } from "@/lib/format";
import type { DateRange } from "@/lib/date-range";

export { RANGE_LABELS, resolveRange } from "@/lib/date-range";
export type { DateRange, RangeKey } from "@/lib/date-range";

/**
 * Order statuses that count as revenue.
 *
 * `cancelled` was already excluded; `returned` is excluded too, because a
 * returned order has been refunded — counting it would overstate takings. Both
 * still appear in the order *count*, which is "orders placed", not "orders
 * paid for".
 */
export const REVENUE_STATUSES = [
  "placed",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const;

/**
 * Ceiling on rows pulled per dashboard query. PostgREST cannot SUM, so revenue
 * has to be added up client-side; this bounds the payload instead of the
 * previous unbounded "every order ever" fetch. When a range hits the cap the
 * dashboard says so rather than quietly showing a number that is too low.
 */
export const SCAN_CAP = 5000;

type OrderRow = { total: number; status: string };
type RecentOrder = {
  order_number: string;
  total: number;
  status: string;
  created_at: string;
};
type LowStockRow = { sku_id: string; product_name: string; stock_qty: number };
type BrandRevenueRow = { brand_name: string | null; line_total: number };

export type BrandRevenue = { brand: string; revenue: number; orders: number; share: number };

export type DashboardStats = {
  orderCount: number;
  revenue: number;
  pending: number;
  skuCount: number;
  lowStockCount: number;
  lowStock: LowStockRow[];
  recent: RecentOrder[];
  byBrand: BrandRevenue[];
  /** True when a query hit SCAN_CAP, so the totals are a floor, not exact. */
  capped: boolean;
};

export async function fetchDashboard(range: DateRange): Promise<DashboardStats> {
  let ordersQuery = supabase.from("orders").select("total, status").limit(SCAN_CAP);
  if (range.fromISO) ordersQuery = ordersQuery.gte("created_at", range.fromISO);
  if (range.toISO) ordersQuery = ordersQuery.lte("created_at", range.toISO);

  let countQuery = supabase.from("orders").select("id", { count: "exact", head: true });
  if (range.fromISO) countQuery = countQuery.gte("created_at", range.fromISO);
  if (range.toISO) countQuery = countQuery.lte("created_at", range.toISO);

  let recentQuery = supabase
    .from("orders")
    .select("order_number, total, status, created_at")
    .order("created_at", { ascending: false })
    .limit(8);
  if (range.fromISO) recentQuery = recentQuery.gte("created_at", range.fromISO);
  if (range.toISO) recentQuery = recentQuery.lte("created_at", range.toISO);

  // order_items carries its own brand_name snapshot, so revenue by brand needs
  // no join through variants -> products -> brands, and stays correct even for
  // SKUs that have since been deleted or moved between brands.
  let brandQuery = supabase
    .from("order_items")
    .select("brand_name, line_total, orders!inner(created_at, status)")
    .in("orders.status", [...REVENUE_STATUSES])
    .limit(SCAN_CAP);
  if (range.fromISO) brandQuery = brandQuery.gte("orders.created_at", range.fromISO);
  if (range.toISO) brandQuery = brandQuery.lte("orders.created_at", range.toISO);

  const [orders, count, recent, brandRows, skuCount, lowStock, lowStockCount] = await Promise.all([
    ordersQuery.returns<OrderRow[]>(),
    countQuery,
    recentQuery.returns<RecentOrder[]>(),
    brandQuery.returns<BrandRevenueRow[]>(),
    supabase.from("product_variants").select("id", { count: "exact", head: true }),
    supabase
      .from("catalog_variants")
      .select("sku_id, product_name, stock_qty")
      .lt("stock_qty", LOW_STOCK_THRESHOLD)
      .order("stock_qty")
      .limit(10)
      .returns<LowStockRow[]>(),
    supabase
      .from("catalog_variants")
      .select("id", { count: "exact", head: true })
      .lt("stock_qty", LOW_STOCK_THRESHOLD),
  ]);

  const orderRows = orders.data ?? [];
  const revenueStatuses = new Set<string>(REVENUE_STATUSES);
  const revenue = orderRows
    .filter((o) => revenueStatuses.has(o.status))
    .reduce((sum, o) => sum + Number(o.total), 0);

  const brandTotals = new Map<string, { revenue: number; orders: number }>();
  for (const row of brandRows.data ?? []) {
    const name = row.brand_name ?? "Unattributed";
    const entry = brandTotals.get(name) ?? { revenue: 0, orders: 0 };
    entry.revenue += Number(row.line_total);
    entry.orders += 1;
    brandTotals.set(name, entry);
  }
  const brandSum = [...brandTotals.values()].reduce((s, b) => s + b.revenue, 0);
  const byBrand: BrandRevenue[] = [...brandTotals.entries()]
    .map(([brand, v]) => ({
      brand,
      revenue: v.revenue,
      orders: v.orders,
      share: brandSum > 0 ? v.revenue / brandSum : 0,
    }))
    // Ranked largest-first: bars on a shared baseline compare most precisely
    // when they are ordered.
    .sort((a, b) => b.revenue - a.revenue);

  return {
    orderCount: count.count ?? 0,
    revenue,
    pending: orderRows.filter((o) => o.status === "placed").length,
    skuCount: skuCount.count ?? 0,
    lowStockCount: lowStockCount.count ?? 0,
    lowStock: lowStock.data ?? [],
    recent: recent.data ?? [],
    byBrand,
    capped: orderRows.length >= SCAN_CAP || (brandRows.data ?? []).length >= SCAN_CAP,
  };
}
