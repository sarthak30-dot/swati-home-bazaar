import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Truck, ShieldCheck, Store, BadgeIndianRupee } from "lucide-react";
import { fetchBrands, fetchRail } from "@/lib/catalog";
import { ProductCard, ProductCardSkeleton } from "@/components/store/ProductCard";
import { brandClass } from "@/components/store/ProductImage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Swati Enterprises — Pigeon, Dubblin & Yera Glassware, Delhi" },
      {
        name: "description",
        content:
          "Shop 800+ Pigeon cookware, Dubblin insulated bottles and Yera glassware SKUs at Delhi retail prices. Free delivery above Rs. 999.",
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

const USPS = [
  { icon: Store, title: "Authorised retailer", text: "Genuine Pigeon, Dubblin & Yera stock" },
  { icon: Truck, title: "Free delivery", text: "On every order above Rs. 999" },
  { icon: ShieldCheck, title: "Brand warranty", text: "Full manufacturer warranty support" },
  { icon: BadgeIndianRupee, title: "Cash on delivery", text: "Available across Delhi NCR" },
];

function Rail({
  title,
  subtitle,
  kind,
}: {
  title: string;
  subtitle: string;
  kind: "deals" | "bestsellers" | "new";
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["rail", kind],
    queryFn: () => fetchRail(kind, 12),
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <div className="min-w-0">
          <h2 className="truncate font-display text-xl font-bold sm:text-2xl">{title}</h2>
          <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Link to="/shop" className="shrink-0 text-sm font-semibold text-gold hover:underline">
          View all
        </Link>
      </div>
      <div className="no-scrollbar mt-4 flex snap-x gap-4 overflow-x-auto pb-2">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-44 shrink-0 snap-start sm:w-56">
                <ProductCardSkeleton />
              </div>
            ))
          : data?.map((item) => (
              <div key={item.id} className="w-44 shrink-0 snap-start sm:w-56">
                <ProductCard item={item} />
              </div>
            ))}
      </div>
    </section>
  );
}

function Home() {
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: fetchBrands });

  return (
    <div>
      <section className="border-b border-border bg-gold-tint">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 lg:grid-cols-2 lg:py-16">
          <div>
            <span className="inline-block rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold">
              Delhi&apos;s home &amp; kitchen store
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Cookware, bottles and glassware your kitchen actually uses.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Over 800 genuine SKUs from Pigeon, Dubblin and Yera Glassware, stocked and shipped by
              Swati Enterprises from Chandni Chowk.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                Shop all products
              </Link>
              <Link
                to="/shop"
                search={{ sort: "discount" }}
                className="rounded-xl border border-gold px-5 py-3 text-sm font-semibold text-gold hover:bg-gold/10"
              >
                Today&apos;s best deals
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(brands ?? []).map((b) => (
              <Link
                key={b.id}
                to="/brand/$slug"
                params={{ slug: b.slug }}
                className={`${brandClass(b.slug)} flex aspect-[3/4] flex-col justify-end rounded-2xl bg-brand-tint p-3 transition-transform hover:-translate-y-1`}
              >
                <span className="font-display text-base font-bold text-brand sm:text-lg">
                  {b.name}
                </span>
                <span className="line-clamp-2 text-[11px] text-brand/70">{b.tagline}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
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

      <Rail title="Deals of the week" subtitle="Biggest markdowns across all three brands" kind="deals" />
      <Rail title="Best sellers" subtitle="What Delhi kitchens keep reordering" kind="bestsellers" />
      <Rail title="New arrivals" subtitle="Freshly added to our catalogue" kind="new" />

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-4 lg:grid-cols-3">
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
