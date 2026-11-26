import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { IMAGE_BY_VARIANT, IMAGE_BY_SLUG } from "@/lib/product-images.generated";
import { departmentForCategory } from "@/lib/departments";
import { DEPARTMENT_ICONS } from "@/lib/department-icons";

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

/**
 * Product photo, falling back to a refined department-matched placeholder
 * when there is no photo (or the one we tried to load 404s/errors out from
 * under us — `onError` catches that rather than letting the browser's own
 * broken-image box show through).
 *
 * Sits on the neutral media pad (`bg-media`, the same `#F3F1ED` tone across
 * every card, carousel and PDP) with `object-contain` so a tall bottle and a
 * wide pan both read cleanly without cropping into the product. The one
 * exception is a Dubblin catalogue-sheet scan, which keeps its own crop: see
 * `isCatalogueSheet` below.
 */
export function ProductImage({
  name,
  capacity,
  brandSlug,
  categorySlug,
  imageUrl,
  variantCode,
  productSlug,
  className,
}: {
  name: string;
  capacity?: string | null;
  brandSlug: string;
  /** Picks the department-matched fallback icon; omit to fall back to a generic box icon. */
  categorySlug?: string | null;
  imageUrl?: string | null;
  variantCode?: string | null;
  productSlug?: string | null;
  className?: string;
}) {
  const [broken, setBroken] = useState(false);
  const src = broken ? null : resolveProductImage(imageUrl, variantCode, productSlug);

  if (src) {
    // Dubblin assets are catalogue pages: the top quarter carries wholesale
    // text ("Ctn. 24 Pcs", "MRP Rs. 939/-") above the product shot. object-contain
    // would show that header instead of cropping it out, so this one case keeps
    // the original cover-and-zoom treatment rather than the padded pad/contain
    // every other photo gets.
    const isCatalogueSheet = src.includes("/dubblin/");
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        onError={() => setBroken(true)}
        className={cn(
          "h-full w-full transition-transform duration-500 group-hover:scale-105",
          isCatalogueSheet
            ? "origin-bottom scale-[1.4] object-cover object-bottom"
            : "bg-media object-contain p-4",
          className,
        )}
      />
    );
  }

  const department = departmentForCategory(categorySlug ?? null);
  const Icon = department ? DEPARTMENT_ICONS[department.slug] : Package;

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center gap-1.5 overflow-hidden bg-media p-4 text-center",
        className,
      )}
    >
      <Icon className="h-7 w-7 text-ink-muted/50" aria-hidden="true" strokeWidth={1.5} />
      <span className="line-clamp-2 text-[11px] font-medium leading-tight text-ink-muted">
        {name}
      </span>
      {capacity && <span className="text-[10px] text-ink-muted/80">{capacity}</span>}
      <span className="text-[10px] italic text-ink-muted/70">Photo updating</span>
    </div>
  );
}
