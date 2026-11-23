import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { IMAGE_BY_VARIANT, IMAGE_BY_SLUG } from "@/lib/product-images.generated";

const BRAND_CLASS: Record<string, string> = {
  pigeon: "brand-pigeon",
  dubblin: "brand-dubblin",
  yera: "brand-yera",
};

export function brandClass(slug?: string | null) {
  return (slug && BRAND_CLASS[slug]) || "";
}

/**
 * Resolves the photo for a variant.
 *
 * Only about a quarter of variants carry an `image_url` in Supabase, yet a
 * matching photo often already exists in public/images/products. The generated
 * manifest closes that gap on the client, since we cannot backfill the column.
 * A real `image_url` always wins — the manifest is a fallback, never an
 * override.
 */
export function resolveProductImage(
  imageUrl?: string | null,
  variantCode?: string | null,
  productSlug?: string | null,
): string | null {
  return (
    imageUrl ||
    (variantCode ? IMAGE_BY_VARIANT[variantCode] : undefined) ||
    (productSlug ? IMAGE_BY_SLUG[productSlug] : undefined) ||
    null
  );
}

/** Product photo, falling back to a brand-tinted name tile when none exists. */
export function ProductImage({
  name,
  capacity,
  brandSlug,
  imageUrl,
  variantCode,
  productSlug,
  className,
}: {
  name: string;
  capacity?: string | null;
  brandSlug: string;
  imageUrl?: string | null;
  variantCode?: string | null;
  productSlug?: string | null;
  className?: string;
}) {
  const src = resolveProductImage(imageUrl, variantCode, productSlug);
  if (src) {
    // Dubblin assets are catalogue pages: the top quarter carries wholesale
    // text ("Ctn. 24 Pcs", "MRP Rs. 939/-") above the product shot. Biasing the
    // crop downwards frames the product and keeps trade pricing — which can
    // contradict this store's own price — out of the tile.
    const isCatalogueSheet = src.includes("/dubblin/");
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        className={cn(
          "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
          isCatalogueSheet && "origin-bottom scale-[1.4] object-bottom",
          className,
        )}
      />
    );
  }
  // 554 SKUs still have no photograph, 429 of them Pigeon, so this tile is
  // the dominant visual on much of the catalogue rather than a rare fallback.
  // A flat tinted rectangle reads as a missing image; a framed card with the
  // brand mark, a soft wash and the product name reads as a deliberate
  // placeholder until real photography arrives.
  return (
    <div
      className={cn(
        brandClass(brandSlug),
        "relative flex h-full w-full flex-col items-center justify-center gap-1.5 overflow-hidden bg-brand-tint px-3 text-center",
        className,
      )}
    >
      {/* Soft radial wash so the tile has depth instead of reading as a
          solid swatch. Decorative only. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.75),transparent_70%)]"
      />
      <span
        aria-hidden="true"
        className="relative grid h-9 w-9 place-items-center rounded-full bg-brand/10 ring-1 ring-brand/20"
      >
        <Package className="h-4 w-4 text-brand" />
      </span>
      <span className="relative line-clamp-3 font-display text-[13px] font-semibold leading-tight text-brand sm:text-sm">
        {name}
      </span>
      {capacity && <span className="relative text-[11px] font-medium text-brand">{capacity}</span>}
    </div>
  );
}
