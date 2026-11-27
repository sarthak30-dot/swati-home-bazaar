import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCapacity, isRetailPack, rupees } from "@/lib/format";
import {
  getInventory,
  isSharedPackOfOne,
  SHARED_PACK_OF_ONE_LABEL,
  type CatalogVariant,
} from "@/lib/catalog";
import { ProductImage, brandClass } from "@/components/store/ProductImage";
import { useWishlist } from "@/hooks/useWishlist";

/**
 * Grid tile for a single variant, used in every grid and horizontal
 * carousel — shop, department, brand, wishlist, "New arrivals".
 *
 * Every card renders exactly four blocks (image, eyebrow row, title, price)
 * plus a footer button, none of them optional, so cards never drift apart in
 * height the way they did when a description paragraph, a rating chip, a
 * pack-size line and a stock line each came and went independently. No badge
 * sits on top of the photo: the brand name and capacity/pack move into the
 * eyebrow row as plain text/chips instead of pills over the image, and stock
 * status is the footer button's own label rather than a bar across the photo.
 *
 * The tile is a pure click-through: its job is to let a shopper scan and
 * choose, not to transact. Adding to cart happens on the product page, where
 * the size/capacity is picked explicitly — several products carry up to
 * twelve variants, so an "Add" here would routinely add the wrong one. The
 * footer is styled like a button but is presentational (a <button> cannot
 * legally nest inside the card's own link); the whole card is the hit target.
 */
export function ProductCard({ item, className }: { item: CatalogVariant; className?: string }) {
  const { isWishlisted, toggle } = useWishlist();
  const out = getInventory(item).status === "out_of_stock";
  const hasDiscount = item.discount_pct > 0 && item.mrp > item.selling_price;

  // One chip, one piece of information, in priority order: capacity_or_size is
  // the single most useful disambiguator between two otherwise identically
  // named products; failing that, an explicit "pack of 1" note where the photo
  // might suggest a set (see isSharedPackOfOne); failing that, a real retail
  // multi-unit pack size. At most one shows, so the eyebrow row is always a
  // single line regardless of which — unlike the stacked optional lines this
  // replaces.
  const chipLabel =
    formatCapacity(item.capacity_or_size, item.brand_slug) ??
    (isSharedPackOfOne(item)
      ? SHARED_PACK_OF_ONE_LABEL
      : isRetailPack(item.pack_or_carton_qty)
        ? `Pack of ${item.pack_or_carton_qty}`
        : null);

  return (
    <div className={cn(brandClass(item.brand_slug), "group relative h-full", className)}>
      <Link
        to="/product/$sku"
        params={{ sku: item.sku_id }}
        className="flex h-full flex-col justify-between rounded-2xl border border-border bg-surface p-3 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <div>
          <div className="relative aspect-square overflow-hidden rounded-xl bg-media">
            <ProductImage
              name={item.product_name}
              capacity={item.capacity_or_size}
              brandSlug={item.brand_slug}
              categorySlug={item.category_slug}
              imageUrl={item.image_url}
              variantCode={item.variant_code}
              productSlug={item.product_slug}
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
              {item.brand_name}
            </span>
            {chipLabel && (
              <span className="truncate rounded-full bg-media px-2 py-0.5 text-[11px] text-ink-secondary">
                {chipLabel}
              </span>
            )}
          </div>

          <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-ink">
            {item.product_name}
          </h3>

          <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="font-display text-base font-bold text-ink">
              {rupees(item.selling_price)}
            </span>
            {/* Currently inert: selling_price equals mrp on every seeded row.
                Lights up automatically once ops enters real selling prices. */}
            {hasDiscount && (
              <span className="text-xs text-ink-muted line-through">{rupees(item.mrp)}</span>
            )}
          </div>
        </div>

        <span
          aria-hidden="true"
          className={cn(
            "mt-3 block w-full rounded-xl py-2 text-center text-xs font-semibold transition-colors",
            out ? "bg-muted text-muted-foreground" : "bg-brand text-white group-hover:opacity-90",
          )}
        >
          {out ? "Out of stock" : "View details"}
        </span>
      </Link>

      <button
        type="button"
        aria-label={isWishlisted(item.id) ? "Remove from wishlist" : "Add to wishlist"}
        onClick={(e) => {
          e.preventDefault();
          toggle(item.id);
        }}
        className="absolute right-5 top-5 z-10 grid h-8 w-8 place-items-center rounded-full bg-surface/90 shadow-sm transition-colors hover:bg-surface"
      >
        <Heart
          className={cn(
            "h-4 w-4",
            isWishlisted(item.id) ? "fill-brand text-brand" : "text-muted-foreground",
          )}
        />
      </button>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-surface p-3">
      <div>
        <div className="aspect-square animate-pulse rounded-xl bg-media" />
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
          <div className="h-4 w-14 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="mt-2 h-[2.5rem] animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-2/5 animate-pulse rounded bg-muted" />
      </div>
      <div className="mt-3 h-8 w-full animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
