import { Link } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { fetchBrandBest, type CatalogVariant } from "@/lib/catalog";
import { rupees } from "@/lib/format";
import { ProductImage, brandClass, resolveProductImage } from "@/components/store/ProductImage";

/** The three brands Swati Enterprises carries, in shelf order. */
const BRANDS = [
  { slug: "pigeon", name: "Pigeon", blurb: "Pressure cookers, cookware & appliances" },
  { slug: "dubblin", name: "Dubblin", blurb: "Steel bottles, flasks & lunch boxes" },
  { slug: "yera", name: "Yera", blurb: "Glassware, jars & serving sets" },
] as const;

/**
 * Picks the variant to feature for a brand.
 *
 * Requires a *verified* photo — a spotlight card showing a missing-image
 * placeholder defeats the point — and skips any candidate whose resolved
 * photo is already claimed (by the hero collage, or an earlier brand in
 * this same section), so the same photograph never appears twice on the
 * homepage. `claimed` is mutated: the chosen candidate's image is added to
 * it before returning, so the next brand's pick excludes it too.
 *
 * Returns null when nothing qualifies, in which case the caller skips that
 * brand's card entirely rather than render one with a bad photo.
 */
function pickFeatured(
  candidates: CatalogVariant[] | undefined,
  claimed: Set<string>,
): CatalogVariant | null {
  if (!candidates?.length) return null;
  for (const v of candidates) {
    if (v.image_status !== "verified") continue;
    const img = resolveProductImage(v.image_url, v.variant_code, v.product_slug);
    if (!img || claimed.has(img)) continue;
    claimed.add(img);
    return v;
  }
  return null;
}

export function BrandSpotlight({
  excludeImages,
}: {
  /** Image paths already shown elsewhere on the page (the hero collage) — never re-picked here. */
  excludeImages?: Iterable<string>;
}) {
  const results = useQueries({
    queries: BRANDS.map((b) => ({
      queryKey: ["brand-best", b.slug],
      queryFn: () => fetchBrandBest(b.slug),
    })),
  });
  const claimed = new Set(excludeImages);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold sm:text-2xl">Best of our brands</h2>
          <p className="text-sm text-muted-foreground">
            A standout pick from each of the three houses we stock
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {BRANDS.map((brand, i) => {
          const query = results[i];
          const item = pickFeatured(query?.data, claimed);

          if (query?.isLoading) {
            return (
              <div
                key={brand.slug}
                className="h-80 animate-pulse rounded-3xl border border-border bg-muted/50"
              />
            );
          }
          if (!item) return null;

          return (
            <div
              key={brand.slug}
              className={`${brandClass(brand.slug)} group relative overflow-hidden rounded-3xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-2xl`}
            >
              <Link to="/product/$sku" params={{ sku: item.sku_id }} className="block">
                <div className="relative aspect-[4/3] overflow-hidden bg-brand-tint">
                  <ProductImage
                    name={item.product_name}
                    capacity={item.capacity_or_size}
                    brandSlug={item.brand_slug}
                    categorySlug={item.category_slug}
                    imageUrl={item.image_url}
                    variantCode={item.variant_code}
                    productSlug={item.product_slug}
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                    {brand.name}
                  </span>
                  {item.discount_pct > 0 && (
                    <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-brand shadow">
                      {item.discount_pct}% off
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {brand.blurb}
                  </p>
                  <h3 className="mt-1.5 line-clamp-2 font-display text-lg font-bold leading-snug">
                    {item.product_name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-xl font-bold text-brand">
                      {rupees(item.selling_price)}
                    </span>
                    {item.mrp > item.selling_price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {rupees(item.mrp)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              <div className="px-5 pb-5">
                <Link
                  to="/brand/$slug"
                  params={{ slug: brand.slug }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                >
                  Explore all {brand.name}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
