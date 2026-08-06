import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { rupees, formatDate, ORDER_STATUS_LABELS } from "@/lib/format";

export const Route = createFileRoute("/order/$orderNumber")({
  head: ({ params }) => ({
    meta: [
      { title: `Order ${params.orderNumber} — Swati Enterprises` },
      { name: "description", content: "Your Swati Enterprises order confirmation and summary." },
      { property: "og:title", content: `Order ${params.orderNumber}` },
      { property: "og:description", content: "Order confirmation from Swati Enterprises." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderConfirmation,
});

type ShippingAddress = {
  full_name?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

function OrderConfirmation() {
  const { orderNumber } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["order", orderNumber],
    queryFn: async () => {
      const { data: order, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("order_number", orderNumber)
        .maybeSingle();
      if (error) throw error;
      return order;
    },
  });

  if (isLoading) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted-foreground">Loading order...</div>;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Order not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with the account used to place this order.
        </p>
        <Link to="/account/orders" className="mt-6 inline-block text-sm font-semibold text-gold">
          Go to my orders
        </Link>
      </div>
    );
  }

  const address = (data.shipping_address ?? {}) as ShippingAddress;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-border bg-gold-tint p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <h1 className="mt-3 font-display text-2xl font-bold">Thank you, your order is placed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Order <strong>{data.order_number}</strong> &middot; {formatDate(data.created_at)}
        </p>
        <p className="mt-1 text-sm font-semibold">
          Status: {ORDER_STATUS_LABELS[data.status] ?? data.status}
        </p>
      </div>

      <section className="mt-6 rounded-2xl border border-border p-5">
        <h2 className="font-display text-base font-bold">Items</h2>
        <ul className="mt-3 divide-y divide-border text-sm">
          {(data.order_items ?? []).map((line) => (
            <li key={line.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2.5">
              <span className="min-w-0">
                <span className="line-clamp-2 font-medium">{line.product_name}</span>
                <span className="text-xs text-muted-foreground">
                  {line.brand_name} · Qty {line.qty}
                </span>
              </span>
              <span className="shrink-0 font-medium">{rupees(line.line_total)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{rupees(data.subtotal)}</dd>
          </div>
          {Number(data.discount_amount) > 0 && (
            <div className="flex justify-between text-success">
              <dt>Discount {data.coupon_code}</dt>
              <dd>-{rupees(data.discount_amount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Delivery</dt>
            <dd>{Number(data.shipping_fee) === 0 ? "Free" : rupees(data.shipping_fee)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>Total</dt>
            <dd>{rupees(data.total)}</dd>
          </div>
          <p className="pt-1 text-xs text-muted-foreground">
            Payment: {data.payment_method === "cod" ? "Cash on delivery" : "Online"} ({data.payment_status})
          </p>
        </dl>
      </section>

      <section className="mt-4 rounded-2xl border border-border p-5 text-sm">
        <h2 className="font-display text-base font-bold">Delivering to</h2>
        <p className="mt-2 font-medium">
          {address.full_name} &middot; {address.phone}
        </p>
        <p className="text-muted-foreground">
          {address.line1}
          {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.pincode}
        </p>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/account/orders" className="rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-white">
          View all orders
        </Link>
        <Link to="/shop" className="rounded-xl border border-border px-5 py-3 text-sm font-semibold">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
