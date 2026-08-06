import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { rupees, formatDate, ORDER_STATUS_LABELS } from "@/lib/format";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

const STATUSES = Object.keys(ORDER_STATUS_LABELS);

type ShippingAddress = {
  full_name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

function AdminOrders() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", filter],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (filter !== "all") query = query.eq("status", filter as never);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = async (id: string, patch: Record<string, string>) => {
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) toast.error("Could not update the order");
    else {
      toast.success("Order updated");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm ${
              filter === s ? "border-gold bg-gold-tint font-semibold text-gold" : "border-border"
            }`}
          >
            {s === "all" ? "All" : ORDER_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading orders...</p>}
      {!isLoading && !data?.length && (
        <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No orders in this view.
        </p>
      )}

      <div className="space-y-4">
        {(data ?? []).map((order) => {
          const address = (order.shipping_address ?? {}) as ShippingAddress;
          return (
            <div key={order.id} className="rounded-2xl border border-border p-5">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-bold">{order.order_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(order.created_at)} · {rupees(order.total)} ·{" "}
                    {order.payment_method === "cod" ? "COD" : "Online"} ({order.payment_status})
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {address.full_name} · {address.phone} · {address.city} {address.pincode}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <select
                    value={order.status}
                    onChange={(e) => update(order.id, { status: e.target.value })}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <select
                    value={order.payment_status}
                    onChange={(e) => update(order.id, { payment_status: e.target.value })}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {["pending", "paid", "failed", "refunded"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <ul className="mt-3 divide-y divide-border text-sm">
                {(order.order_items ?? []).map((line) => (
                  <li key={line.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2">
                    <span className="min-w-0">
                      <span className="line-clamp-1 font-medium">{line.product_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {line.sku_id} · Qty {line.qty}
                      </span>
                    </span>
                    <span className="shrink-0">{rupees(line.line_total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
