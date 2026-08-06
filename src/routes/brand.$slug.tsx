import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchBrands, fetchCategories, fetchShop } from "@/lib/catalog";
import { ProductCard, ProductCardSkeleton } from "@/components/store/ProductCard";
import { brandClass } from "@/components/store/ProductImage";

export const Route = createFileRoute("/brand/$slug")({
  head: ({ params }) => {
    const name = params.slug.charAt(0).toUpperCase() + params.slug.slice(1);
    return {
      meta: [
        { title: `${name} products — Swati Enterprises` },
        {
          name: "description",
          content: `Shop the full ${name} range at Swati Enterprises Delhi, with genuine stock and brand warranty.`,
        },
        { property: "og:title", content: `${name} at Swati Enterprises` },
        { property: "og:description", content: `Genuine ${name} products with brand warranty.` },
      ],
    };
  },
  component: BrandPage,
});

function BrandPage() {
  const { slug } = Route.useParams();
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: fetchBrands });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const brand = brands?.find((b) => b.slug === slug);

  const { data, isLoading } = useQuery({
    queryKey: ["brand-products", slug],
    queryFn: () => fetchShop({ brands: [slug], sort: "discount" }),
  });

  if (brands && !brand) throw notFound();

  const brandCats = (categories ?? []).filter((c) => c.brand_id === brand?.id);

  return (
    <div className={brandClass(slug)}>
      <section className="border-b border-border bg-brand-tint">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h1 className="font-display text-3xl font-bold text-brand sm:text-4xl">
            {brand?.name ?? "Brand"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-foreground/80 sm:text-base">
            {brand?.description ?? brand?.tagline}
          </p>
        </div>
      </section>

      {brandCats.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-8">
          <h2 className="font-display text-lg font-bold">Shop by category</h2>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-2">
            {brandCats.map((c) => (
              <Link
                key={c.id}
                to="/shop"
                search={{ brands: slug, categories: c.slug }}
                className="shrink-0 rounded-full border border-brand/40 bg-background px-4 py-1.5 text-sm font-medium text-brand"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <h2 className="truncate font-display text-lg font-bold">Top picks</h2>
          <Link
            to="/shop"
            search={{ brands: slug }}
            className="shrink-0 text-sm font-semibold text-brand hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : data?.items.map((item) => <ProductCard key={item.id} item={item} />)}
        </div>
      </section>
    </div>
  );
}
