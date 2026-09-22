import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CookingPot,
  CupSoda,
  Zap,
  Package2,
  Sandwich,
  Sparkles,
  Truck,
  ShieldCheck,
  Store,
  BadgeIndianRupee,
  type LucideIcon,
} from "lucide-react";
import { fetchBrands, fetchCategories, fetchCategoryCounts, fetchRail } from "@/lib/catalog";
import { ProductCard, ProductCardSkeleton } from "@/components/store/ProductCard";
import { brandClass } from "@/components/store/ProductImage";
import { HomeHero } from "@/components/store/HomeHero";
import { BrandSpotlight } from "@/components/store/BrandSpotlight";
import { DEPARTMENTS, assertCategoriesMapped, type DepartmentSlug } from "@/lib/departments";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Swati Enterprises — Cookware, Bottles & Glassware, Delhi" },
      {
        name: "description",
        content:
          "Shop 900+ Pigeon cookware, Dubblin bottles and Yera glassware SKUs. Retail delivery across Delhi, bulk orders shipped pan-India.",
      },
      { property: "og:title", content: "Swati Enterprises — Home & Kitchen essentials" },
      {
        property: "og:description",
        content: "Authorised Delhi retailer for Pigeon, Dubblin and Yera Glassware.",
      },
    ],
  }),
  component: Home,
});

/** Icons live in the UI layer so the taxonomy module stays pure data. */
const DEPT_ICONS: Record<DepartmentSlug, LucideIcon> = {
  cookware: CookingPot,
  "drinkware-bottles": CupSoda,
  "kitchen-appliances": Zap,
  "storage-serveware": Package2,
  "lunch-boxes": Sandwich,
  "home-personal-care": Sparkles,
};

const USPS = [
  { icon: Store, title: "Authorised retailer", text: "Genuine Pigeon, Dubblin & Yera stock" },
  { icon: Truck, title: "Delhi delivery", text: "Free on every order above Rs. 999" },
  { icon: ShieldCheck, title: "Brand warranty", text: "Full manufacturer warranty support" },
  { icon: BadgeIndianRupee, title: "Bulk, pan-India", text: "Wholesale shipped across India" },
];

function Home() {
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: fetchBrands });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: counts } = useQuery({
    queryKey: ["category-counts"],
    queryFn: fetchCategoryCounts,
  });
  const { data: fresh, isLoading: freshLoading } = useQuery({
    queryKey: ["rail", "new"],
    queryFn: () => fetchRail("new", 12),
  });

  // Dev-only guard: warns if the seed adds a category no department claims.
  if (categories) assertCategoriesMapped(categories.map((c) => c.slug));

  const deptTotals = Object.fromEntries(
    DEPARTMENTS.map((d) => [d.slug, d.categorySlugs.reduce((n, s) => n + (counts?.[s] ?? 0), 0)]),
  ) as Record<DepartmentSlug, number>;

  const popular = Object.entries(counts ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([slug, count]) => ({
      slug,
      count,
      name: (categories ?? []).find((c) => c.slug === slug)?.name ?? slug,
    }));

  return (
    <div>
      <HomeHero />

      <BrandSpotlight />

      {/* Departments are the primary entry point — a shopper picks an intent
          here, then narrows by brand inside. */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="font-display text-xl font-bold sm:text-2xl">Shop by category</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {DEPARTMENTS.map((d) => {
            const Icon = DEPT_ICONS[d.slug];
            return (
              <Link
                key={d.slug}
                to="/department/$slug"
                params={{ slug: d.slug }}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-gold hover:shadow-md"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-tint text-gold">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold leading-snug">{d.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {deptTotals[d.slug] || "—"} products
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 lg:grid-cols-4">
          {USPS.map((u) => (
            <div key={u.title} className="flex min-w-0 items-start gap-3">
              <u.icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{u.title}</p>
                <p className="text-xs text-muted-foreground">{u.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Ranked by real variant counts. Replaces the previous "Deals of the
          week" and "Best sellers" rails, which sorted on discount_pct and
          rating_count — both of which are placeholder values today. */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <h2 className="font-display text-xl font-bold sm:text-2xl">Popular ranges</h2>
        <p className="text-sm text-muted-foreground">Our deepest stocked categories</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {popular.map((c) => (
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

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-bold sm:text-2xl">New arrivals</h2>
            <p className="truncate text-sm text-muted-foreground">Freshly added to our catalogue</p>
          </div>
          <Link to="/shop" className="shrink-0 text-sm font-semibold text-gold hover:underline">
            View all
          </Link>
        </div>
        <div className="no-scrollbar mt-4 flex snap-x gap-4 overflow-x-auto pb-2">
          {freshLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-44 shrink-0 snap-start sm:w-56">
                  <ProductCardSkeleton />
                </div>
              ))
            : fresh?.map((item) => (
                <div key={item.id} className="w-44 shrink-0 snap-start sm:w-56">
                  <ProductCard item={item} />
                </div>
              ))}
        </div>
      </section>

      {/* Brands demoted below intent-based navigation, but kept: they still
          carry trust and warranty meaning for a returning customer. */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <h2 className="font-display text-xl font-bold sm:text-2xl">Our brands</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {(brands ?? []).map((b) => (
            <div
              key={b.id}
              className={`${brandClass(b.slug)} rounded-2xl border border-border bg-brand-tint p-6`}
            >
              <h3 className="font-display text-lg font-bold text-brand">{b.name}</h3>
              <p className="mt-2 text-sm text-foreground/80">{b.description ?? b.tagline}</p>
              <Link
                to="/brand/$slug"
                params={{ slug: b.slug }}
                className="mt-4 inline-block text-sm font-semibold text-brand hover:underline"
              >
                Explore {b.name} &rarr;
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
