import { useState } from "react";
import { Heart, ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { rupees } from "@/lib/format";
import { type Product, type Brand, BRAND_CLASS } from "@/types/product";
import { resolveProductImage } from "@/data/products";
import { SafeImage } from "@/components/SafeImage";

// Static brand pill classes — no template literals (Tailwind v4 scanner requires static strings)
const BRAND_PILL: Record<Brand, string> = {
  "Stovekraft Pigeon": "bg-pigeon/10 text-pigeon border-pigeon/20",
  Dubblin: "bg-dubblin/10 text-dubblin border-dubblin/20",
  "YERA Prima": "bg-yera/10 text-yera border-yera/20",
};

const BRAND_SHORT: Record<Brand, string> = {
  "Stovekraft Pigeon": "Pigeon",
  Dubblin: "Dubblin",
  "YERA Prima": "YERA Prima",
};

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [addState, setAddState] = useState<"idle" | "adding" | "added">("idle");
  const [wishlisted, setWishlisted] = useState(false);

  const hasHover = Boolean(product.images.hover);
  const isOutOfStock = !product.inStock;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (isOutOfStock || addState !== "idle") return;
    setAddState("adding");
    setTimeout(() => {
      setAddState("added");
      toast.success(`${product.name} added to cart`, {
        description: rupees(product.sellingPrice),
      });
      setTimeout(() => setAddState("idle"), 1800);
    }, 400);
  }

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border bg-background overflow-hidden",
        "transition-shadow hover:shadow-lg",
        BRAND_CLASS[product.brand],
        className,
      )}
    >
      {/* Image region */}
      <div className="relative overflow-hidden bg-muted aspect-square">
        <SafeImage
          src={resolveProductImage(product)}
          alt={product.name}
          fallbackLabel={product.name}
          fallbackSublabel={product.brand === "Stovekraft Pigeon" ? "Pigeon" : product.brand}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            hasHover && "group-hover:opacity-0",
          )}
        />

        {hasHover && (
          <SafeImage
            src={product.images.hover ?? null}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <span className="rounded-full bg-foreground/80 px-3 py-1 text-xs font-semibold text-background">
              Out of Stock
            </span>
          </div>
        )}

        {product.discountPercentage > 0 && (
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold leading-none text-white">
            {product.discountPercentage}% OFF
          </span>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            setWishlisted((w) => !w);
          }}
          className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm transition-colors hover:bg-background"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              wishlisted ? "fill-rose-500 text-rose-500" : "text-foreground/60",
            )}
          />
        </button>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            BRAND_PILL[product.brand],
          )}
        >
          {BRAND_SHORT[product.brand]}
        </span>

        <p className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</p>

        {(product.capacity || product.packSize || product.material) && (
          <div className="flex flex-wrap gap-1">
            {product.capacity && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {product.capacity}
              </span>
            )}
            {product.packSize && product.packSize > 1 && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Set of {product.packSize}
              </span>
            )}
            {product.material && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {product.material}
              </span>
            )}
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-bold">{rupees(product.sellingPrice)}</span>
          {product.mrp > product.sellingPrice && (
            <span className="text-xs text-muted-foreground line-through">{rupees(product.mrp)}</span>
          )}
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || addState === "adding"}
          className={cn(
            "mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-semibold",
            "transition-all active:scale-[0.98]",
            isOutOfStock
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : addState === "added"
                ? "bg-emerald-500 text-white"
                : "bg-brand text-white hover:opacity-90",
          )}
        >
          {addState === "added" ? (
            <>
              <Check className="h-4 w-4" />
              Added
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              {addState === "adding" ? "Adding…" : "Add to Cart"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-background overflow-hidden animate-pulse",
        className,
      )}
    >
      <div className="aspect-square bg-muted" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-3 w-14 rounded-full bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="mt-1 h-3 w-20 rounded bg-muted" />
        <div className="mt-2 h-9 w-full rounded-xl bg-muted" />
      </div>
    </div>
  );
}
