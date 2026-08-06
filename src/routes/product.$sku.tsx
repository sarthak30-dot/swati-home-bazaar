import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, Minus, Plus, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { fetchProductBySku, fetchRelated, fetchSiblings } from "@/lib/catalog";
import { ProductImage, brandClass } from "@/components/store/ProductImage";
import { ProductCard } from "@/components/store/ProductCard";
import { RatingChip } from "@/components/store/RatingChip";
import { rupees } from "@/lib/format";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$sku")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.sku} — Swati Enterprises` },
      {
        name: "description",
        content: `Product details, price and availability for SKU ${params.sku} at Swati Enterprises Delhi.`,
      },
      { property: "og:title", content: `${params.sku} — Swati Enterprises` },
      { property: "og:description", content: "Genuine stock with brand warranty and fast Delhi delivery." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { sku } = Route.useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const [qty, setQty] = useState(1);

  const { data: item, isLoading } = useQuery({
    queryKey: ["product", sku],
    queryFn: () => fetchProductBySku(sku),
  });

  const { data: siblings } = useQuery({
    queryKey: ["siblings", item?.product_id],
    enabled: Boolean(item?.product_id),
    queryFn: () => fetchSiblings(item!.product_id),
  });

  const { data: related } = useQuery({
    queryKey: ["related", item?.category_slug, item?.product_id],
    enabled: Boolean(item?.product_id),
    queryFn: () => fetchRelated(item!.category_slug, item!.product_id),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
          <div className="space-y-4">
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-10 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) throw notFound();

  const out = item.stock_qty <= 0;
  const specs = item.specifications ?? {};

  return (
    <div className={brandClass(item.brand_slug)}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-gold">
            Home
          </Link>
          <span>/</span>
          <Link to="/brand/$slug" params={{ slug: item.brand_slug }} className="hover:text-gold">
            {item.brand_name}
          </Link>
          {item.category_slug && (
            <>
              <span>/</span>
              <Link
                to="/shop"
                search={{ categories: item.category_slug }}
                className="hover:text-gold"
              >
                {item.category_name}
              </Link>
            </>
          )}
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="aspect-square">
              <ProductImage
                name={item.product_name}
                capacity={item.capacity_or_size}
                brandSlug={item.brand_slug}
                imageUrl={item.image_url}
              />
            </div>
          </div>

          <div>
            <span className="inline-block rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              {item.brand_name}
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">{item.product_name}</h1>
            <div className="mt-2 flex items-center gap-3">
              <RatingChip rating={item.rating} count={item.rating_count} />
              <span className="text-xs text-muted-foreground">SKU {item.sku_id}</span>
            </div>

            <div className="mt-4 flex flex-wrap items-baseline gap-2">
              <span className="font-display text-3xl font-bold">{rupees(item.selling_price)}</span>
              <span className="text-base text-muted-foreground line-through">{rupees(item.mrp)}</span>
              {item.discount_pct > 0 && (
                <span className="text-base font-bold text-success">{item.discount_pct}% off</span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>

            {siblings && siblings.length > 1 && (
              <div className="mt-5">
                <p className="mb-2 text-sm font-semibold">Available options</p>
                <div className="flex flex-wrap gap-2">
                  {siblings.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => navigate({ to: "/product/$sku", params: { sku: v.sku_id } })}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm",
                        v.id === item.id
                          ? "border-brand bg-brand-tint font-semibold text-brand"
                          : "border-border",
                      )}
                    >
                      {v.capacity_or_size ?? v.color ?? v.variant_code ?? v.sku_id}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-border">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="p-2.5"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => Math.min(item.stock_qty || 10, q + 1))}
                  className="p-2.5"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className={cn("text-sm font-medium", out ? "text-destructive" : "text-success")}>
                {out ? "Out of stock" : `In stock (${item.stock_qty} available)`}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={out}
                onClick={async () => {
                  await add(item.id, qty);
                  toast.success("Added to cart");
                }}
                className="flex-1 rounded-xl border border-brand px-6 py-3 text-sm font-semibold text-brand hover:bg-brand-tint disabled:opacity-40"
              >
                Add to cart
              </button>
              <button
                type="button"
                disabled={out}
                onClick={async () => {
                  await add(item.id, qty);
                  navigate({ to: "/cart" });
                }}
                className="flex-1 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                Buy now
              </button>
              <button
                type="button"
                aria-label="Add to wishlist"
                onClick={() => toggle(item.id)}
                className="grid h-12 w-12 place-items-center rounded-xl border border-border"
              >
                <Heart
                  className={cn(
                    "h-5 w-5",
                    isWishlisted(item.id) ? "fill-brand text-brand" : "text-muted-foreground",
                  )}
                />
              </button>
            </div>

            <div className="mt-6 grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-3">
              <div className="flex items-start gap-2">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <p className="text-xs">Free delivery above Rs. 999</p>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <p className="text-xs">Brand warranty included</p>
              </div>
              <div className="flex items-start gap-2">
                <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <p className="text-xs">7-day replacement</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="font-display text-lg font-bold">Product description</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold">Specifications</h2>
            <dl className="mt-2 divide-y divide-border rounded-2xl border border-border">
              <div className="grid grid-cols-2 gap-2 px-4 py-2.5 text-sm">
                <dt className="text-muted-foreground">Brand</dt>
                <dd className="font-medium">{item.brand_name}</dd>
              </div>
              {item.capacity_or_size && (
                <div className="grid grid-cols-2 gap-2 px-4 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Capacity / size</dt>
                  <dd className="font-medium">{item.capacity_or_size}</dd>
                </div>
              )}
              {item.color && (
                <div className="grid grid-cols-2 gap-2 px-4 py-2.5 text-sm">
                  <dt className="text-muted-foreground">Colour</dt>
                  <dd className="font-medium">{item.color}</dd>
                </div>
              )}
              {Object.entries(specs).map(([k, v]) => (
                <div key={k} className="grid grid-cols-2 gap-2 px-4 py-2.5 text-sm">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {related && related.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-lg font-bold">You may also like</h2>
            <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto pb-2">
              {related.map((r) => (
                <div key={r.id} className="w-44 shrink-0 sm:w-56">
                  <ProductCard item={r} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
