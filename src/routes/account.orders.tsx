import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { rupees, formatDate, ORDER_STATUS_LABELS, ORDER_PIPELINE } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account/orders")({
  component: Orders,
});

function Orders() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading orders...</p>;

  if (!data?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="font-display text-lg font-semibold">No orders yet</p>
        <Link to="/shop" className="mt-4 inline-block text-sm font-semibold text-gold">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((order) => {
        const stepIndex = ORDER_PIPELINE.indexOf(
          order.status as (typeof ORDER_PIPELINE)[number],
        );
        const cancelled = order.status === "cancelled" || order.status === "returned";
        return (
          <div key={order.id} className="rounded-2xl border border-border p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate font-display text-base font-bold">{order.order_number}</p>
                <p className="text-xs text-muted-foreground">
                  Placed {formatDate(order.created_at)} · {order.order_items?.length ?? 0} items
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-base font-bold">{rupees(order.total)}</p>
                <p
                  className={cn(
                    "text-xs font-semibold",
                    cancelled ? "text-destructive" : "text-success",
                  )}
                >
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </p>
              </div>
            </div>

            {!cancelled && (
              <div className="mt-4 flex items-center gap-1">
                {ORDER_PIPELINE.map((step, i) => (
                  <div key={step} className="flex-1">
                    <div
                      className={cn(
                        "h-1.5 rounded-full",
                        i <= stepIndex ? "bg-success" : "bg-muted",
                      )}
                    />
                    <p className="mt-1 hidden text-[10px] text-muted-foreground sm:block">
                      {ORDER_STATUS_LABELS[step]}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <ul className="mt-4 divide-y divide-border text-sm">
              {(order.order_items ?? []).map((line) => (
                <li key={line.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2">
                  <span className="min-w-0">
                    <span className="line-clamp-1 font-medium">{line.product_name}</span>
                    <span className="text-xs text-muted-foreground">Qty {line.qty}</span>
                  </span>
                  <span className="shrink-0">{rupees(line.line_total)}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/order/$orderNumber"
              params={{ orderNumber: order.order_number }}
              className="mt-3 inline-block text-sm font-semibold text-gold hover:underline"
            >
              View order details
            </Link>
          </div>
        );
      })}
    </div>
  );
}
