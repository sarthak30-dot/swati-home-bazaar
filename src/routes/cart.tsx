import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { ProductImage } from "@/components/store/ProductImage";
import { rupees, shippingFor, FREE_DELIVERY_THRESHOLD } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — Swati Enterprises" },
      { name: "description", content: "Review the items in your Swati Enterprises cart before checkout." },
      { property: "og:title", content: "Your cart — Swati Enterprises" },
      { property: "og:description", content: "Review your kitchen and home essentials before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, setQty, remove, loading } = useCart();
  const shipping = shippingFor(subtotal);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-muted-foreground">Loading cart...</div>;
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse Pigeon cookware, Dubblin bottles and Yera glassware to get started.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-block rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-white"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Your cart ({items.length})</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {items.map(({ variant, qty }) => (
            <div
              key={variant.id}
              className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 rounded-2xl border border-border p-3 sm:grid-cols-[100px_minmax(0,1fr)]"
            >
              <Link
                to="/product/$sku"
                params={{ sku: variant.sku_id }}
                className="aspect-square overflow-hidden rounded-xl"
              >
                <ProductImage
                  name={variant.product_name}
                  capacity={variant.capacity_or_size}
                  brandSlug={variant.brand_slug}
                  imageUrl={variant.image_url}
                />
              </Link>
              <div className="min-w-0">
                <Link to="/product/$sku" params={{ sku: variant.sku_id }}>
                  <h2 className="line-clamp-2 text-sm font-semibold">{variant.product_name}</h2>
                </Link>
                <p className="text-xs text-muted-foreground">
                  {variant.brand_name}
                  {variant.capacity_or_size ? ` · ${variant.capacity_or_size}` : ""}
                </p>
                <div className="mt-1 flex flex-wrap items-baseline gap-2">
                  <span className="font-display text-base font-bold">
                    {rupees(variant.selling_price)}
                  </span>
                  <span className="text-xs text-muted-foreground line-through">
                    {rupees(variant.mrp)}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      type="button"
                      aria-label="Decrease"
                      onClick={() => setQty(variant.id, qty - 1)}
                      className="p-2"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm font-semibold">{qty}</span>
                    <button
                      type="button"
                      aria-label="Increase"
                      onClick={() => setQty(variant.id, qty + 1)}
                      className="p-2"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(variant.id)}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-border p-5 lg:sticky lg:top-28">
          <h2 className="font-display text-base font-bold">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{rupees(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd className="font-medium">{shipping === 0 ? "Free" : rupees(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd>{rupees(subtotal + shipping)}</dd>
            </div>
          </dl>
          {shipping > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Add {rupees(FREE_DELIVERY_THRESHOLD - subtotal)} more for free delivery.
            </p>
          )}
          <Link
            to="/checkout"
            className="mt-5 block rounded-xl bg-gold py-3 text-center text-sm font-semibold text-white"
          >
            Proceed to checkout
          </Link>
          <Link
            to="/shop"
            className="mt-2 block py-2 text-center text-sm font-medium text-muted-foreground hover:text-gold"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
