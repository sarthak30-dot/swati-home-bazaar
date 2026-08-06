import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { rupees, formatDate, ORDER_STATUS_LABELS } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [orders, variants, lowStock] = await Promise.all([
        supabase.from("orders").select("total, status, created_at, order_number").order("created_at", { ascending: false }),
        supabase.from("product_variants").select("id", { count: "exact", head: true }),
        supabase
          .from("catalog_variants")
          .select("sku_id, product_name, stock_qty")
          .lt("stock_qty", 5)
          .order("stock_qty")
          .limit(10),
      ]);
      return {
        orders: orders.data ?? [],
        skuCount: variants.count ?? 0,
        lowStock: lowStock.data ?? [],
      };
    },
  });

  const orders = data?.orders ?? [];
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0);
  const pending = orders.filter((o) => o.status === "placed").length;

  const cards = [
    { label: "Orders", value: orders.length.toLocaleString("en-IN") },
    { label: "Revenue", value: rupees(revenue) },
    { label: "Awaiting confirmation", value: pending.toLocaleString("en-IN") },
    { label: "Live SKUs", value: (data?.skuCount ?? 0).toLocaleString("en-IN") },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border p-5">
          <h2 className="font-display text-base font-bold">Recent orders</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {orders.slice(0, 8).map((o) => (
              <li key={o.order_number} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{o.order_number}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(o.created_at)} · {ORDER_STATUS_LABELS[o.status] ?? o.status}
                  </span>
                </span>
                <span className="shrink-0 font-medium">{rupees(o.total)}</span>
              </li>
            ))}
            {!orders.length && <li className="py-3 text-muted-foreground">No orders yet.</li>}
          </ul>
        </section>

        <section className="rounded-2xl border border-border p-5">
          <h2 className="font-display text-base font-bold">Low stock alerts</h2>
          <ul className="mt-3 divide-y divide-border text-sm">
            {(data?.lowStock ?? []).map((s) => (
              <li key={s.sku_id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{s.product_name}</span>
                  <span className="text-xs text-muted-foreground">{s.sku_id}</span>
                </span>
                <span className="shrink-0 font-semibold text-destructive">{s.stock_qty} left</span>
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
