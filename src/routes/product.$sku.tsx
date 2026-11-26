import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Check, Heart, Minus, Plus, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  fetchProductBySku,
  fetchRelated,
  fetchSiblings,
  getDescription,
  getHighlights,
  getInventory,
  INVENTORY_STATUS_LABELS,
  type CatalogVariant,
} from "@/lib/catalog";
import { ProductImage, brandClass } from "@/components/store/ProductImage";
import { ProductCard } from "@/components/store/ProductCard";
import { RatingChip } from "@/components/store/RatingChip";
import { ReviewSection } from "@/components/store/ReviewSection";
import { rupees, formatCapacity } from "@/lib/format";
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
      {
        property: "og:description",
        content: "Genuine stock with brand warranty and fast Delhi delivery.",
      },
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

  const inventory = getInventory(item);
  const out = inventory.status === "out_of_stock";
  const description = getDescription(item);
  const highlights = getHighlights(item);
  // Scalar spec values only — `features` is rendered separately via
  // `highlights` above, so a comma-joined array doesn't end up in a <dd> as
  // one unbroken blob.
  const allSpecs = item.specifications ?? {};
  const specs = Object.fromEntries(
    Object.entries(allSpecs).filter(([k, v]) => k !== "features" && !Array.isArray(v)),
  ) as Record<string, string>;

  return (
    <div className={brandClass(item.brand_slug)}>
      <ProductJsonLd item={item} />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-ink-secondary">
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
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="aspect-square bg-media">
              <ProductImage
                name={item.product_name}
                capacity={item.capacity_or_size}
                brandSlug={item.brand_slug}
                imageUrl={item.image_url}
                variantCode={item.variant_code}
                productSlug={item.product_slug}
              />
            </div>
          </div>

          <div>
            <span className="inline-block rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              {item.brand_name}
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold text-ink sm:text-3xl">
              {item.product_name}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              {item.rating != null && item.rating_count > 0 && (
                <RatingChip rating={item.rating} count={item.rating_count} />
              )}
              <span className="text-xs text-ink-secondary">SKU {item.sku_id}</span>
              {item.category_name && (
                <span className="text-xs text-ink-secondary">{item.category_name}</span>
              )}
            </div>

            {/* Only show a struck-through MRP when it differs from the price
                actually being charged. */}
            <div className="mt-4 flex flex-wrap items-baseline gap-2">
              <span className="font-display text-3xl font-bold text-ink">
                {rupees(item.selling_price)}
              </span>
              {item.discount_pct > 0 && item.mrp > item.selling_price && (
                <>
                  <span className="text-base text-ink-secondary line-through">
                    {rupees(item.mrp)}
                  </span>
                  <span className="text-base font-bold text-success">{item.discount_pct}% off</span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-ink-muted">Inclusive of all taxes</p>

            {siblings && siblings.length > 1 && (
              <div className="mt-5">
                <p className="mb-2 text-sm font-semibold text-ink">Available options</p>
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
                          : "border-border bg-surface",
                      )}
                    >
                      {formatCapacity(v.capacity_or_size, v.brand_slug) ??
                        v.color ??
                        v.variant_code ??
                        v.sku_id}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-border bg-surface">
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
              <div>
                <p className={cn("text-sm font-medium", out ? "text-destructive" : "text-success")}>
                  {INVENTORY_STATUS_LABELS[inventory.status]}
                </p>
                {!out && <p className="text-xs text-ink-muted">{inventory.dispatchNote}</p>}
              </div>
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
                className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-surface"
              >
                <Heart
                  className={cn(
                    "h-5 w-5",
                    isWishlisted(item.id) ? "fill-brand text-brand" : "text-muted-foreground",
                  )}
                />
              </button>
            </div>

            <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:grid-cols-3">
              <div className="flex items-start gap-2">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <p className="text-xs text-ink-muted">Free delivery above Rs. 999</p>
              </div>
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <p className="text-xs text-ink-muted">Brand warranty included</p>
              </div>
              <div className="flex items-start gap-2">
                <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <p className="text-xs text-ink-muted">7-day replacement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden on the rare row with no summary yet, so the heading doesn't
            sit above empty space; the grid then collapses to one column so
            Specifications doesn't leave half the row blank. */}
        <div className={cn("mt-10 grid gap-8", description && "lg:grid-cols-2")}>
          {description && (
            <section>
              <h2 className="font-display text-lg font-bold text-ink">Product description</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                {description.summary}
              </p>
            </section>
          )}
          <section>
            <h2 className="font-display text-lg font-bold text-ink">Specifications</h2>
            <dl className="mt-2 divide-y divide-border rounded-2xl border border-border bg-surface">
              <div className="grid grid-cols-2 gap-2 px-4 py-2.5 text-sm">
                <dt className="text-ink-secondary">Brand</dt>
                <dd className="font-medium text-ink">{item.brand_name}</dd>
              </div>
              {item.capacity_or_size && (
                <div className="grid grid-cols-2 gap-2 px-4 py-2.5 text-sm">
                  <dt className="text-ink-secondary">Capacity / size</dt>
                  <dd className="font-medium text-ink">
                    {formatCapacity(item.capacity_or_size, item.brand_slug)}
                  </dd>
                </div>
              )}
              {item.color && (
                <div className="grid grid-cols-2 gap-2 px-4 py-2.5 text-sm">
                  <dt className="text-ink-secondary">Colour</dt>
                  <dd className="font-medium text-ink">{item.color}</dd>
                </div>
              )}
              {Object.entries(specs).map(([k, v]) => (
                <div key={k} className="grid grid-cols-2 gap-2 px-4 py-2.5 text-sm">
                  <dt className="capitalize text-ink-secondary">{k}</dt>
                  <dd className="font-medium text-ink">{String(v)}</dd>
                </div>
              ))}
            </dl>

            {highlights.length > 0 && (
              <>
                <h3 className="mt-6 font-display text-base font-bold text-ink">Key features</h3>
                <ul className="mt-2 space-y-1.5">
                  {highlights.map((h) => (
                    <li key={h} className="flex gap-2 text-sm text-ink-secondary">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>

        {related && related.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-lg font-bold text-ink">You may also like</h2>
            <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto pb-2">
              {related.map((r) => (
                <div key={r.id} className="w-44 shrink-0 sm:w-56">
                  <ProductCard item={r} />
                </div>
              ))}
            </div>
          </section>
        )}

        <ReviewSection productId={item.product_id} />
      </div>
    </div>
  );
}

/**
 * Product/Offer/AggregateRating/BreadcrumbList structured data, as a single
 * @graph so Google can pick up rich results (price + rating in search) for
 * this SKU. Rendered client-side once `item` resolves — this app has no SSR
 * data loader on any route yet (see catalog.ts), so nothing on this page,
 * JSON-LD included, is present in the very first server-rendered HTML today.
 *
 * Uses `<script>` + `.textContent` (imperatively, via a ref) rather than
 * `dangerouslySetInnerHTML`: the payload is JSON, never parsed as markup, but
 * this avoids the XSS-shaped pattern entirely instead of relying on the
 * "escape every '<'" argument for why it's safe here.
 */
function ProductJsonLd({ item }: { item: CatalogVariant }) {
  const ref = useRef<HTMLScriptElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const url = window.location.href;

    const product: Record<string, unknown> = {
      "@type": "Product",
      name: item.product_name,
      sku: item.sku_id,
      brand: { "@type": "Brand", name: item.brand_name },
      ...(item.description ? { description: item.description } : {}),
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        price: item.selling_price,
        availability:
          item.stock_qty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url,
      },
    };
    if (item.rating != null && item.rating_count > 0) {
      product["aggregateRating"] = {
        "@type": "AggregateRating",
        ratingValue: item.rating,
        reviewCount: item.rating_count,
      };
    }

    const breadcrumb = {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${window.location.origin}/` },
        {
          "@type": "ListItem",
          position: 2,
          name: item.brand_name,
          item: `${window.location.origin}/brand/${item.brand_slug}`,
        },
        ...(item.category_name
          ? [{ "@type": "ListItem", position: 3, name: item.category_name }]
          : []),
      ],
    };

    ref.current.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [product, breadcrumb],
    });
  }, [item]);

  return <script ref={ref} type="application/ld+json" />;
}
