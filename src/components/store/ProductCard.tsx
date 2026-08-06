import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { rupees } from "@/lib/format";
import type { CatalogVariant } from "@/lib/catalog";
import { ProductImage, brandClass } from "@/components/store/ProductImage";
import { RatingChip } from "@/components/store/RatingChip";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";

export function ProductCard({ item, className }: { item: CatalogVariant; className?: string }) {
  const { isWishlisted, toggle } = useWishlist();
  const { add } = useCart();
  const out = item.stock_qty <= 0;

  return (
    <div
      className={cn(
        brandClass(item.brand_slug),
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Add to wishlist"
        onClick={() => toggle(item.id)}
        className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-background/90 shadow-sm"
      >
        <Heart
          className={cn(
            "h-4 w-4",
            isWishlisted(item.id) ? "fill-brand text-brand" : "text-muted-foreground",
          )}
        />
      </button>

      <Link
        to="/product/$sku"
        params={{ sku: item.sku_id }}
        className="relative block aspect-square overflow-hidden"
      >
        <ProductImage
          name={item.product_name}
          capacity={item.capacity_or_size}
          brandSlug={item.brand_slug}
          imageUrl={item.image_url}
        />
        <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {item.brand_name}
        </span>
        {out && (
          <span className="absolute inset-x-0 bottom-0 bg-foreground/80 py-1 text-center text-[11px] font-semibold text-background">
            Out of stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link to="/product/$sku" params={{ sku: item.sku_id }} className="min-w-0">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground sm:text-sm">
            {item.product_name}
          </h3>
        </Link>
        <p className="text-[11px] text-muted-foreground">
          {item.capacity_or_size ?? item.category_name}
        </p>
        <div className="mt-auto flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 pt-1">
          <span className="font-display text-base font-bold text-foreground">
            {rupees(item.selling_price)}
          </span>
          <span className="text-xs text-muted-foreground line-through">{rupees(item.mrp)}</span>
          {item.discount_pct > 0 && (
            <span className="text-xs font-bold text-success">{item.discount_pct}% OFF</span>
          )}
        </div>
        <div className="flex items-center justify-between pt-1">
          <RatingChip rating={item.rating} count={item.rating_count} />
          <button
            type="button"
            disabled={out}
            onClick={async () => {
              await add(item.id, 1);
              toast.success(`${item.product_name} added to cart`);
            }}
            className="rounded-lg border border-brand px-2.5 py-1 text-[11px] font-semibold text-brand transition-colors hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add
          </button>
        </div>
      </div>
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
