import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { fetchBrands, fetchCategories, fetchShop, PAGE_SIZE } from "@/lib/catalog";
import { ProductCard, ProductCardSkeleton } from "@/components/store/ProductCard";
import { rupees } from "@/lib/format";
import { cn } from "@/lib/utils";

type ShopSearch = {
  brands?: string;
  categories?: string;
  min?: number;
  max?: number;
  rating?: number;
  discount?: number;
  q?: string;
  sort?: string;
  page?: number;
};

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    brands: search["brands"] ? String(search["brands"]) : undefined,
    categories: search["categories"] ? String(search["categories"]) : undefined,
    min: search["min"] != null ? Number(search["min"]) : undefined,
    max: search["max"] != null ? Number(search["max"]) : undefined,
    rating: search["rating"] != null ? Number(search["rating"]) : undefined,
    discount: search["discount"] != null ? Number(search["discount"]) : undefined,
    q: search["q"] ? String(search["q"]) : undefined,
    sort: search["sort"] ? String(search["sort"]) : undefined,
    page: search["page"] != null ? Number(search["page"]) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop all products — Swati Enterprises" },
      {
        name: "description",
        content:
          "Browse the full Swati Enterprises catalogue: Pigeon cookware, Dubblin bottles and Yera glassware with filters for price, brand and discount.",
      },
      { property: "og:title", content: "Shop all products — Swati Enterprises" },
      {
        property: "og:description",
        content: "Filter 800+ home and kitchen SKUs by brand, category, price and discount.",
      },
    ],
  }),
  component: Shop,
});

const SORTS = [
  { value: "new", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "discount", label: "Discount" },
  { value: "rating", label: "Customer rating" },
];

const PRICE_BANDS = [
  { label: "Under Rs. 500", min: undefined, max: 500 },
  { label: "Rs. 500 - 1,500", min: 500, max: 1500 },
  { label: "Rs. 1,500 - 3,000", min: 1500, max: 3000 },
  { label: "Above Rs. 3,000", min: 3000, max: undefined },
];

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const selBrands = search.brands ? search.brands.split(",") : [];
  const selCats = search.categories ? search.categories.split(",") : [];
  const page = search.page ?? 1;

  const setSearch = (patch: Partial<ShopSearch>) =>
    navigate({ search: (prev) => ({ ...prev, page: undefined, ...patch }) });

  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: fetchBrands });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["shop", search],
    placeholderData: keepPreviousData,
    queryFn: () =>
      fetchShop({
        brands: selBrands.length ? selBrands : undefined,
        categories: selCats.length ? selCats : undefined,
        minPrice: search.min,
        maxPrice: search.max,
        minRating: search.rating,
        minDiscount: search.discount,
        q: search.q,
        sort: search.sort,
        page,
      }),
  });

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const brandIds = (brands ?? []).filter((b) => selBrands.includes(b.slug)).map((b) => b.id);
  const visibleCats = (categories ?? []).filter(
    (c) => !brandIds.length || !c.brand_id || brandIds.includes(c.brand_id),
  );

  const toggleList = (key: "brands" | "categories", value: string) => {
    const current = key === "brands" ? selBrands : selCats;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setSearch({ [key]: next.length ? next.join(",") : undefined } as Partial<ShopSearch>);
  };

  const activeCount =
    selBrands.length +
    selCats.length +
    (search.min != null || search.max != null ? 1 : 0) +
    (search.rating ? 1 : 0) +
    (search.discount ? 1 : 0);

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold">Brand</h3>
        <div className="space-y-1.5">
          {(brands ?? []).map((b) => (
            <label key={b.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selBrands.includes(b.slug)}
                onChange={() => toggleList("brands", b.slug)}
                className="h-4 w-4 accent-[var(--gold)]"
              />
              {b.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Category</h3>
        <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
          {visibleCats.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selCats.includes(c.slug)}
                onChange={() => toggleList("categories", c.slug)}
                className="h-4 w-4 accent-[var(--gold)]"
              />
              <span className="min-w-0 truncate">{c.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Price</h3>
        <div className="space-y-1.5">
          {PRICE_BANDS.map((band) => {
            const active = search.min === band.min && search.max === band.max;
            return (
              <button
                key={band.label}
                type="button"
                onClick={() =>
                  setSearch(active ? { min: undefined, max: undefined } : { min: band.min, max: band.max })
                }
                className={cn(
                  "block w-full rounded-lg border px-3 py-1.5 text-left text-sm",
                  active ? "border-gold bg-gold-tint font-semibold text-gold" : "border-border",
                )}
              >
                {band.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Customer rating</h3>
        <div className="flex flex-wrap gap-2">
          {[4.5, 4, 3.5].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSearch({ rating: search.rating === r ? undefined : r })}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm",
                search.rating === r ? "border-gold bg-gold-tint font-semibold text-gold" : "border-border",
              )}
            >
              {r}+
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Discount</h3>
        <div className="flex flex-wrap gap-2">
          {[10, 20, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSearch({ discount: search.discount === d ? undefined : d })}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm",
                search.discount === d ? "border-gold bg-gold-tint font-semibold text-gold" : "border-border",
              )}
            >
              {d}%+
            </button>
          ))}
        </div>
      </div>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() =>
            navigate({ search: { q: search.q, sort: search.sort } })
          }
          className="w-full rounded-lg border border-border py-2 text-sm font-semibold"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold">
            {search.q ? `Results for "${search.q}"` : "All products"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading catalogue..." : `${total.toLocaleString("en-IN")} products`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters{activeCount ? ` (${activeCount})` : ""}
          </button>
          <select
            value={search.sort ?? "new"}
            onChange={(e) => setSearch({ sort: e.target.value })}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">{filterPanel}</aside>

        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : data && data.items.length ? (
            <>
              <div
                className={cn(
                  "grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4",
                  isFetching && "opacity-60",
                )}
              >
                {data.items.map((item) => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </div>
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => navigate({ search: (p) => ({ ...p, page: page - 1 }) })}
                  className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {pages}
                </span>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => navigate({ search: (p) => ({ ...p, page: page + 1 }) })}
                  className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-20 text-center">
              <p className="font-display text-lg font-semibold">No products match these filters</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try widening your price range or clearing a filter.
              </p>
            </div>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-80 max-w-[85vw] overflow-y-auto bg-background p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Filters</h2>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            {filterPanel}
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="mt-6 w-full rounded-xl bg-gold py-3 text-sm font-semibold text-white"
            >
              Show {total.toLocaleString("en-IN")} products
            </button>
          </div>
        </div>
      )}

      {search.min != null || search.max != null ? (
        <p className="mt-4 text-xs text-muted-foreground">
          Price filter: {search.min != null ? rupees(search.min) : "Rs. 0"} -{" "}
          {search.max != null ? rupees(search.max) : "any"}
        </p>
      ) : null}
    </div>
  );
}
