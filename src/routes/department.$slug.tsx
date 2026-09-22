import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchCategories, fetchCategoryCounts, fetchShop } from "@/lib/catalog";
import { ProductCard, ProductCardSkeleton } from "@/components/store/ProductCard";
import { departmentBySlug, MATERIALS } from "@/lib/departments";

export const Route = createFileRoute("/department/$slug")({
  head: ({ params }) => {
    const dept = departmentBySlug(params.slug);
    const name = dept?.name ?? "Shop";
    return {
      meta: [
        { title: `${name} — Swati Enterprises` },
        {
          name: "description",
          content: dept
            ? `${dept.blurb}. Shop ${name.toLowerCase()} from Pigeon, Dubblin and Yera at Swati Enterprises, Delhi.`
            : "Shop home and kitchen essentials at Swati Enterprises, Delhi.",
        },
        { property: "og:title", content: `${name} — Swati Enterprises` },
      ],
    };
  },
  component: DepartmentPage,
});

function DepartmentPage() {
  const { slug } = Route.useParams();
  const dept = departmentBySlug(slug);

  if (!dept) throw notFound();

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: counts } = useQuery({
    queryKey: ["category-counts"],
    queryFn: fetchCategoryCounts,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["department", slug],
    queryFn: () => fetchShop({ categories: dept.categorySlugs, sort: "price_asc" }),
  });

  const categoriesParam = dept.categorySlugs.join(",");
  const total = data?.total ?? 0;

  // Supplier categories inside this department, largest first — this is the
  // first place a shopper can see that e.g. all 112 water bottles exist as one
  // group rather than scattered across three brands.
  const subCategories = dept.categorySlugs
    .map((s) => ({
      slug: s,
      name: (categories ?? []).find((c) => c.slug === s)?.name ?? s,
      count: counts?.[s] ?? 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Material only applies where the merge actually destroyed a distinction.
  const materials = MATERIALS.filter((m) =>
    m.categorySlugs.every((s) => dept.categorySlugs.includes(s)),
  );

  return (
    <div>
      <section className="border-b border-border bg-gold-tint">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <nav className="text-xs text-muted-foreground">
            <Link to="/" className="hover:text-gold">
              Home
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-foreground">{dept.name}</span>
          </nav>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{dept.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-foreground/80 sm:text-base">{dept.blurb}</p>
          {total > 0 && (
            <p className="mt-1 text-xs font-medium text-muted-foreground">{total} products</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-8">
        <h2 className="font-display text-lg font-bold">Shop by type</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {subCategories.map((c) => (
            <Link
              key={c.slug}
              to="/shop"
              search={{ categories: c.slug }}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm transition-colors hover:border-gold hover:bg-gold-tint"
            >
              <span className="min-w-0 truncate font-medium">{c.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{c.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {materials.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-6">
          <h2 className="font-display text-lg font-bold">Shop by material</h2>
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-2">
            {materials.map((m) => (
              <Link
                key={m.label}
                to="/shop"
                search={{ categories: m.categorySlugs.join(",") }}
                className="shrink-0 rounded-full border border-border bg-background px-4 py-1.5 text-sm font-medium transition-colors hover:border-gold hover:text-gold"
              >
                {m.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <h2 className="truncate font-display text-lg font-bold">All {dept.name.toLowerCase()}</h2>
          <Link
            to="/shop"
            search={{ categories: categoriesParam }}
            className="shrink-0 text-sm font-semibold text-gold hover:underline"
          >
            View all with filters
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : data?.items.map((item) => <ProductCard key={item.id} item={item} />)}
        </div>
        {!isLoading && total > (data?.items.length ?? 0) && (
          <div className="mt-6 text-center">
            <Link
              to="/shop"
              search={{ categories: categoriesParam }}
              className="inline-block rounded-xl border border-gold px-5 py-2.5 text-sm font-semibold text-gold hover:bg-gold/10"
            >
              See all {total} products
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
