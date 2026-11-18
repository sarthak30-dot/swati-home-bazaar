import {
  Camera,
  CookingPot,
  CupSoda,
  Package2,
  Sandwich,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { departmentForCategory, type DepartmentSlug } from "@/lib/departments";
import { IMAGE_BY_VARIANT, IMAGE_BY_SLUG } from "@/lib/product-images.generated";
import { isUsableImage } from "@/lib/image-quality";

const BRAND_CLASS: Record<string, string> = {
  pigeon: "brand-pigeon",
  dubblin: "brand-dubblin",
  yera: "brand-yera",
};

export function brandClass(slug?: string | null) {
  return (slug && BRAND_CLASS[slug]) || "";
}

/** One glyph per department, used on the "photo coming soon" tile. */
const DEPT_ICONS: Record<DepartmentSlug, LucideIcon> = {
  cookware: CookingPot,
  "drinkware-bottles": CupSoda,
  "kitchen-appliances": Zap,
  "storage-serveware": Package2,
  "lunch-boxes": Sandwich,
  "home-personal-care": Sparkles,
};

/**
 * How many catalogue keys point at each file. A file used by many different
 * variant codes is a *family* photo (e.g. one cooker shot standing in for
 * twelve sizes), not a photo of that exact variant — the UI says so rather
 * than implying otherwise.
 */
const FILE_USE_COUNT: Record<string, number> = (() => {
  const counts: Record<string, number> = {};
  for (const src of Object.values(IMAGE_BY_VARIANT)) counts[src] = (counts[src] ?? 0) + 1;
  for (const src of Object.values(IMAGE_BY_SLUG)) counts[src] = (counts[src] ?? 0) + 1;
  return counts;
})();

export type ResolvedImage = {
  src: string;
  /**
   * `true` when the photo is shared by several variants/products from the
   * manifest, i.e. it shows the product family rather than this exact variant.
   */
  representative: boolean;
};

/**
 * Resolves the photo for a variant.
 *
 * Only about a quarter of variants carry an `image_url` in Supabase, yet a
 * matching photo often already exists in public/images/products. The generated
 * manifest closes that gap on the client, since we cannot backfill the column.
 * A real `image_url` always wins — the manifest is a fallback, never an
 * override.
 */
export function resolveProductImageInfo(
  imageUrl?: string | null,
  variantCode?: string | null,
  productSlug?: string | null,
): ResolvedImage | null {
  // A real image_url wins — unless it points at a raw catalogue scan, which is
  // worse than showing the "photo coming soon" tile (see image-quality.ts).
  if (isUsableImage(imageUrl)) return { src: imageUrl, representative: false };
  const fromManifest =
    (variantCode ? IMAGE_BY_VARIANT[variantCode] : undefined) ||
    (productSlug ? IMAGE_BY_SLUG[productSlug] : undefined);
  if (!isUsableImage(fromManifest)) return null;
  return { src: fromManifest, representative: (FILE_USE_COUNT[fromManifest] ?? 0) > 1 };
}

export function resolveProductImage(
  imageUrl?: string | null,
  variantCode?: string | null,
  productSlug?: string | null,
): string | null {
  return resolveProductImageInfo(imageUrl, variantCode, productSlug)?.src ?? null;
}

/** Product photo, falling back to a brand-tinted illustrated tile when none exists. */
export function ProductImage({
  name,
  capacity,
  brandSlug,
  categorySlug,
  imageUrl,
  variantCode,
  productSlug,
  className,
  priority = false,
  zoom = true,
}: {
  name: string;
  capacity?: string | null;
  brandSlug: string;
  categorySlug?: string | null;
  imageUrl?: string | null;
  variantCode?: string | null;
  productSlug?: string | null;
  className?: string;
  /** Above-the-fold image: load eagerly with high fetch priority. */
  priority?: boolean;
  /** Hover zoom on the grid; disabled in the gallery, which has its own zoom. */
  zoom?: boolean;
}) {
  const info = resolveProductImageInfo(imageUrl, variantCode, productSlug);
  if (info) {
    // Dubblin assets are catalogue pages: the top quarter carries wholesale
    // text ("Ctn. 24 Pcs", "MRP Rs. 939/-") above the product shot. Biasing the
    // crop downwards frames the product and keeps trade pricing — which can
    // contradict this store's own price — out of the tile. Everything else is
    // shown whole on white so lids, handles and bases are never cut off.
    const isCatalogueSheet = info.src.includes("/dubblin/");
    return (
      <img
        src={info.src}
        alt={capacity ? `${name} — ${capacity}` : name}
        width={600}
        height={600}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        {...(priority ? { fetchPriority: "high" as const } : {})}
        className={cn(
          "h-full w-full bg-white transition-transform duration-500",
          zoom && "group-hover:scale-105",
          isCatalogueSheet
            ? "origin-bottom scale-[1.4] object-cover object-bottom"
            : "object-contain",
          className,
        )}
      />
    );
  }

  const dept = departmentForCategory(categorySlug ?? null);
  const Icon = (dept && DEPT_ICONS[dept.slug]) || Camera;

  return (
    <div
      role="img"
      aria-label={`${name} — product photo coming soon`}
      className={cn(
        brandClass(brandSlug),
        "relative flex h-full w-full flex-col items-center justify-center gap-2 overflow-hidden bg-gradient-to-br from-brand-tint via-white to-brand-tint px-3 text-center",
        className,
      )}
    >
      {/* Soft decorative rings so the tile reads as designed, not broken. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand/5"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-brand/5"
      />
      <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/80 text-brand shadow-sm ring-1 ring-brand/10 sm:h-14 sm:w-14">
        <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.5} />
      </span>
      <span className="relative line-clamp-2 font-display text-[12px] font-semibold leading-tight text-foreground/80 sm:text-[13px]">
        {name}
      </span>
      {capacity && (
        <span className="relative text-[11px] font-medium text-brand/80">{capacity}</span>
      )}
      <span className="relative mt-0.5 rounded-full bg-white/70 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        Photo coming soon
      </span>
    </div>
  );
}
