import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Banknote,
  Heart,
  Info,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { fetchProductBySku, fetchRelated, fetchSiblings, type CatalogVariant } from "@/lib/catalog";
import { brandClass, resolveProductImageInfo } from "@/components/store/ProductImage";
import { ProductGallery, type GalleryImage } from "@/components/store/ProductGallery";
import { DeliveryEstimate } from "@/components/store/DeliveryEstimate";
import { ProductCard } from "@/components/store/ProductCard";
import { QueryError } from "@/components/store/QueryError";
import { RatingChip } from "@/components/store/RatingChip";
import { ReviewSection } from "@/components/store/ReviewSection";
import { rupees } from "@/lib/format";
import { absoluteUrl, SITE_NAME } from "@/lib/site";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

const variantLabel = (v: CatalogVariant) =>
  v.capacity_or_size ?? v.color ?? v.variant_code ?? v.sku_id;

/** Product title as a shopper would search for it, e.g. "Amelia Cooker 3 L". */
const productTitle = (item: CatalogVariant) =>
  item.capacity_or_size && !item.product_name.includes(item.capacity_or_size)
    ? `${item.product_name} ${item.capacity_or_size}`
    : item.product_name;

export const Route = createFileRoute("/product/$sku")({
  // Fetched on the server so the real product name reaches <title>, the meta
  // tags and the JSON-LD in the very first HTML. A backend failure must not
  // take the page down, so errors degrade to the generic title and the
  // component's own error state.
  loader: async ({ params }) => {
    try {
      return { item: await fetchProductBySku(params.sku) };
    } catch {
      return { item: null };
    }
  },
  head: ({ params, loaderData }) => {
    const item = loaderData?.item;
    if (!item) {
      return {
        meta: [{ title: `${params.sku} — ${SITE_NAME}` }],
      };
    }
    const title = `${productTitle(item)} | ${item.brand_name} — ${SITE_NAME}`;
    const description = `Buy ${productTitle(item)} by ${item.brand_name} at ${rupees(
      item.selling_price,
    )}. Genuine stock with brand warranty and fast Delhi delivery from ${SITE_NAME}.`;
    const image = resolveProductImageInfo(item.image_url, item.variant_code, item.product_slug);
    const url = absoluteUrl(`/product/${item.sku_id}`);

    const product: Record<string, unknown> = {
      "@type": "Product",
      name: productTitle(item),
      sku: item.sku_id,
      brand: { "@type": "Brand", name: item.brand_name },
      ...(item.description ? { description: item.description } : {}),
      ...(image ? { image: absoluteUrl(image.src) } : {}),
      offers: {
        "@type": "Offer",
        priceCurrency: "INR",
        price: item.selling_price,
        availability:
          item.stock_qty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url,
      },
      ...(item.rating != null && item.rating_count > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: item.rating,
              reviewCount: item.rating_count,
            },
          }
        : {}),
    };
    const breadcrumb = {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        {
          "@type": "ListItem",
          position: 2,
          name: item.brand_name,
          item: absoluteUrl(`/brand/${item.brand_slug}`),
        },
        ...(item.category_name
          ? [{ "@type": "ListItem", position: 3, name: item.category_name }]
          : []),
      ],
    };

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(image ? [{ property: "og:image", content: absoluteUrl(image.src) }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          // `<` is escaped so the payload can never close its own <script>.
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [product, breadcrumb],
          }).replace(/</g, "\\u003c"),
        },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { sku } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const navigate = useNavigate();
  const { add } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const [qty, setQty] = useState(1);

  const {
    data: item,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["product", sku],
    queryFn: () => fetchProductBySku(sku),
    ...(loaderData?.item && loaderData.item.sku_id === sku ? { initialData: loaderData.item } : {}),
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

  // Photos for this product: the selected size's photo first, then any other
  // distinct photo among its sizes/colours. Only real photos — never a guess.
  const gallery = useMemo<GalleryImage[]>(() => {
    if (!item) return [];
    const seen = new Set<string>();
    const out: GalleryImage[] = [];
    for (const v of [item, ...(siblings ?? [])]) {
      const info = resolveProductImageInfo(v.image_url, v.variant_code, v.product_slug);
      if (info && !seen.has(info.src)) {
        seen.add(info.src);
        out.push({ src: info.src, alt: `${v.product_name} — ${variantLabel(v)}` });
      }
    }
    return out;
  }, [item, siblings]);

  if (isError && !item) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <QueryError
          title="We couldn't load this product"
          onRetry={() => refetch()}
          retrying={isFetching}
        />
      </div>
    );
  }

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
  const lowStock = !out && item.stock_qty <= 5;
  const maxQty = Math.max(1, Math.min(item.stock_qty || 10, 10));
  const specs = item.specifications ?? {};
  const hasDiscount = item.discount_pct > 0 && item.mrp > item.selling_price;
  const imageInfo = resolveProductImageInfo(item.image_url, item.variant_code, item.product_slug);

  const addToCart = async () => {
    await add(item.id, qty);
    toast.success("Added to cart");
  };

  const share = async () => {
    const url = absoluteUrl(`/product/${item.sku_id}`);
    const text = `${productTitle(item)} — ${rupees(item.selling_price)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.product_name, text, url });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank");
      }
    } catch {
      /* user dismissed the share sheet */
    }
  };

  return (
    <div className={brandClass(item.brand_slug)}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"
        >
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
          <div>
            <ProductGallery
              images={gallery}
              fallback={{
                name: item.product_name,
                capacity: item.capacity_or_size,
                brandSlug: item.brand_slug,
                categorySlug: item.category_slug,
                imageUrl: item.image_url,
                variantCode: item.variant_code,
                productSlug: item.product_slug,
              }}
            />
            {imageInfo?.representative && (
              <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Image shows the {item.product_name} range — size, colour and finish may vary by
                option.
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-block rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                {item.brand_name}
              </span>
              <button
                type="button"
                onClick={share}
                aria-label="Share this product"
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
              {item.product_name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              {item.rating != null && item.rating_count > 0 && (
                <RatingChip rating={item.rating} count={item.rating_count} />
              )}
              <span className="text-xs text-muted-foreground">SKU {item.sku_id}</span>
              {item.category_name && (
                <span className="text-xs text-muted-foreground">{item.category_name}</span>
              )}
            </div>

            {/* Only show a struck-through MRP when it differs from the price
                actually being charged. */}
            <div className="mt-4 flex flex-wrap items-baseline gap-2">
              <span className="font-display text-3xl font-bold">{rupees(item.selling_price)}</span>
              {hasDiscount && (
                <>
                  <span className="text-base text-muted-foreground line-through">
                    {rupees(item.mrp)}
                  </span>
                  <span className="text-base font-bold text-success">{item.discount_pct}% off</span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>

            {siblings && siblings.length > 1 && (
              <fieldset className="mt-5">
                <legend className="mb-2 text-sm font-semibold">
                  Size / option:{" "}
                  <span className="font-normal text-muted-foreground">{variantLabel(item)}</span>
                </legend>
                <div
                  role="radiogroup"
                  aria-label="Choose size or option"
                  className="flex flex-wrap gap-2"
                >
                  {siblings.map((v) => {
                    const selected = v.id === item.id;
                    const soldOut = v.stock_qty <= 0;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => {
                          if (selected) return;
                          setQty(1);
                          // Replace, not push, and keep scroll: picking a size
                          // should feel like state, not a page change.
                          navigate({
                            to: "/product/$sku",
                            params: { sku: v.sku_id },
                            replace: true,
                            resetScroll: false,
                          });
                        }}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                          selected
                            ? "border-brand bg-brand-tint font-semibold text-brand"
                            : "border-border hover:border-brand/50",
                          soldOut && "text-muted-foreground line-through",
                        )}
                      >
                        {variantLabel(v)}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
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
                <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  className="p-2.5"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {/* Raw stock counts are commercially sensitive; only warn when
                  it is genuinely low. */}
              <p
                className={cn(
                  "text-sm font-medium",
                  out ? "text-destructive" : lowStock ? "text-gold" : "text-success",
                )}
              >
                {out ? "Out of stock" : lowStock ? `Only ${item.stock_qty} left` : "In stock"}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={out}
                onClick={addToCart}
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
                aria-label={isWishlisted(item.id) ? "Remove from wishlist" : "Add to wishlist"}
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

            <DeliveryEstimate className="mt-5" />

            <ul className="mt-4 grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-2">
              <li className="flex items-start gap-2">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <p className="text-xs">Free delivery above Rs. 999</p>
              </li>
              <li className="flex items-start gap-2">
                <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <p className="text-xs">Cash on delivery available</p>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <p className="text-xs">Brand warranty included</p>
              </li>
              <li className="flex items-start gap-2">
                <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <p className="text-xs">
                  7-day replacement &middot;{" "}
                  <Link to="/returns-policy" className="underline">
                    policy
                  </Link>
                </p>
              </li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Need 10 or more?{" "}
              <Link to="/bulk-orders" className="font-semibold text-gold hover:underline">
                Ask for bulk pricing
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="font-display text-lg font-bold">Product description</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.description || `${item.product_name} by ${item.brand_name}.`}
            </p>
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

        <ReviewSection productId={item.product_id} />
      </div>

      {/* Sticky buy bar on phones: price and the primary action stay in reach
          however far down the page the shopper has scrolled. Sits above the
          bottom navigation. */}
      <div className="fixed inset-x-0 bottom-[calc(3.6rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold leading-tight">
              {rupees(item.selling_price)}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">{variantLabel(item)}</p>
          </div>
          <button
            type="button"
            disabled={out}
            onClick={addToCart}
            className="shrink-0 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {out ? "Out of stock" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
