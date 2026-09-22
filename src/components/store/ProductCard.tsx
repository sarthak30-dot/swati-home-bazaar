import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { rupees } from "@/lib/format";
import type { CatalogVariant } from "@/lib/catalog";
import { ProductImage, brandClass } from "@/components/store/ProductImage";
import { RatingChip } from "@/components/store/RatingChip";
import { useWishlist } from "@/hooks/useWishlist";

/**
 * Grid tile for a single variant.
 *
 * The tile is a pure click-through: its job is to let a shopper scan and
 * choose, not to transact. Adding to cart happens on the product page, where
 * the size/capacity is picked explicitly — several products carry up to twelve
 * variants, so an "Add" here would routinely add the wrong one.
 */
export function ProductCard({
  item,
  className,
  variantCount,
}: {
  item: CatalogVariant;
  className?: string;
  /** Number of sizes on the parent product; shows a "+N sizes" hint when > 1. */
  variantCount?: number;
}) {
  const { isWishlisted, toggle } = useWishlist();
  const out = item.stock_qty <= 0;
  const hasDiscount = item.discount_pct > 0 && item.mrp > item.selling_price;

  // capacity_or_size is present on 651/920 variants and is the single most
  // useful disambiguator between two otherwise identically-named products.
  const subtitle = item.capacity_or_size ?? item.category_name;

  return (
    <div className={cn(brandClass(item.brand_slug), "group relative", className)}>
      <Link
        to="/product/$sku"
        params={{ sku: item.sku_id }}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      >
        <div className="relative block aspect-square overflow-hidden">
          <ProductImage
            name={item.product_name}
            capacity={item.capacity_or_size}
            brandSlug={item.brand_slug}
            imageUrl={item.image_url}
            variantCode={item.variant_code}
            productSlug={item.product_slug}
          />
          <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {item.brand_name}
          </span>
          {variantCount != null && variantCount > 1 && (
            <span className="absolute bottom-2 right-2 rounded-md bg-foreground/75 px-1.5 py-0.5 text-[10px] font-semibold text-background">
              +{variantCount - 1} more {variantCount === 2 ? "size" : "sizes"}
            </span>
          )}
          {out && (
            <span className="absolute inset-x-0 bottom-0 bg-foreground/80 py-1 text-center text-[11px] font-semibold text-background">
              Out of stock
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground sm:text-sm">
            {item.product_name}
          </h3>
          {subtitle && <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>}
          {item.rating != null && item.rating_count > 0 && (
            <RatingChip rating={item.rating} count={item.rating_count} className="w-fit" />
          )}

          <div className="mt-auto pt-2">
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="font-display text-base font-bold text-foreground">
                {rupees(item.selling_price)}
              </span>
              {/* Currently inert: selling_price equals mrp on every seeded row.
                  Lights up automatically once ops enters real selling prices. */}
              {hasDiscount && (
                <>
                  <span className="text-xs text-muted-foreground line-through">
                    {rupees(item.mrp)}
                  </span>
                  <span className="text-xs font-bold text-success">{item.discount_pct}% OFF</span>
                </>
              )}
            </div>
            {item.pack_or_carton_qty != null && item.pack_or_carton_qty > 1 && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Pack of {item.pack_or_carton_qty}
              </p>
            )}
          </div>
        </div>
      </Link>

      <button
        type="button"
        aria-label={isWishlisted(item.id) ? "Remove from wishlist" : "Add to wishlist"}
        onClick={(e) => {
          e.preventDefault();
          toggle(item.id);
        }}
        className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/90 shadow-sm transition-colors hover:bg-background"
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
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-square animate-pulse bg-muted" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
        <div className="h-4 w-3/5 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
