import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { rupees, formatDate, ORDER_STATUS_LABELS, LOW_STOCK_THRESHOLD } from "@/lib/format";
import {
  fetchDashboard,
  RANGE_LABELS,
  resolveRange,
  SCAN_CAP,
  type RangeKey,
} from "@/lib/admin-stats";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const PRESETS: Exclude<RangeKey, "custom">[] = ["7d", "30d", "90d", "fy", "all"];

function Dashboard() {
  const [rangeKey, setRangeKey] = useState<RangeKey>("30d");
  const [custom, setCustom] = useState({ from: "", to: "" });

  const range = resolveRange(rangeKey, custom);

  const { data, isFetching } = useQuery({
    queryKey: ["admin-stats", rangeKey, custom.from, custom.to],
    placeholderData: keepPreviousData,
    queryFn: () => fetchDashboard(range),
  });

  const cards = [
    { label: "Orders", value: (data?.orderCount ?? 0).toLocaleString("en-IN") },
    { label: "Revenue", value: rupees(data?.revenue ?? 0) },
    { label: "Awaiting confirmation", value: (data?.pending ?? 0).toLocaleString("en-IN") },
    { label: "Live SKUs", value: (data?.skuCount ?? 0).toLocaleString("en-IN") },
  ];

  const byBrand = data?.byBrand ?? [];
  // Bars are scaled against the largest brand, not against total revenue, so
  // the ranking stays readable when one brand dominates.
  const peak = byBrand[0]?.revenue ?? 0;

  return (
    <div className={cn("space-y-6", isFetching && "opacity-70")}>
      {/* --- range filter: one row, above everything it filters --- */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setRangeKey(key)}
            aria-pressed={rangeKey === key}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium",
              rangeKey === key
                ? "bg-gold-tint text-gold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {RANGE_LABELS[key]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRangeKey("custom")}
          aria-pressed={rangeKey === "custom"}
          className={cn(
            "rounded-lg px-3 py-1.5 text-sm font-medium",
            rangeKey === "custom"
              ? "bg-gold-tint text-gold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Custom
        </button>
        {rangeKey === "custom" && (
          <span className="flex items-center gap-2">
            <input
              type="date"
              value={custom.from}
              aria-label="From date"
              onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
              className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-sm"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={custom.to}
              aria-label="To date"
              onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
              className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-sm"
            />
          </span>
        )}
      </div>

      {data?.capped && (
        <p className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
          This range contains more than {SCAN_CAP.toLocaleString("en-IN")} records, so the totals
          below are a floor rather than an exact figure. Narrow the range for an exact number.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      {/* --- revenue by brand: ranked meter list, one hue, direct labels --- */}
      <section className="rounded-2xl border border-border p-5">
        <h2 className="font-display text-base font-bold">Revenue by brand</h2>
        <p className="text-xs text-muted-foreground">
          Delivered and in-flight orders; cancelled and returned excluded.
        </p>
        {byBrand.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {byBrand.map((b) => (
              <li key={b.brand} title={`${b.brand}: ${b.orders} order lines`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium">{b.brand}</span>
                  <span className="shrink-0 tabular-nums">
                    {rupees(b.revenue)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {Math.round(b.share * 100)}%
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-sm bg-muted">
                  <div
                    className="h-full rounded-r-[4px] bg-gold"
                    style={{ width: `${peak > 0 ? Math.max((b.revenue / peak) * 100, 1) : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No revenue in this range yet.</p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border p-5">
          <h2 className="font-display text-base font-bold">Recent orders</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {(data?.recent ?? []).map((o) => (
              <li key={o.order_number} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{o.order_number}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(o.created_at)} · {ORDER_STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">{rupees(o.total)}</span>
              </li>
            ))}
            {!data?.recent.length && (
              <li className="py-3 text-muted-foreground">No orders in this range.</li>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-border p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-base font-bold">Low stock alerts</h2>
            {Boolean(data?.lowStockCount) && (
              <span className="text-xs text-muted-foreground">
                {data?.lowStockCount} under {LOW_STOCK_THRESHOLD}
              </span>
            )}
          </div>
          <ul className="mt-3 divide-y divide-border text-sm">
            {(data?.lowStock ?? []).map((s) => (
              <li key={s.sku_id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{s.product_name}</span>
                  <span className="text-xs text-muted-foreground">{s.sku_id}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-destructive">
                  {s.stock_qty} left
                </span>
              </li>
            ))}
            {!data?.lowStock.length && (
              <li className="py-3 text-muted-foreground">All SKUs are comfortably stocked.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
