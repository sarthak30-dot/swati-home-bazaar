import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import {
  fetchBrands,
  fetchCategories,
  fetchFacetCounts,
  fetchShop,
  PAGE_SIZE,
} from "@/lib/catalog";
import { ProductCard, ProductCardSkeleton } from "@/components/store/ProductCard";
import { rupees } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DEPARTMENTS } from "@/lib/departments";
import { PRODUCT_GRID } from "@/lib/layout";

type ShopSearch = {
  brands?: string | undefined;
  categories?: string | undefined;
  min?: number | undefined;
  max?: number | undefined;
  rating?: number | undefined;
  discount?: number | undefined;
  q?: string | undefined;
  sort?: string | undefined;
  page?: number | undefined;
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

// Bands are non-linear because the catalogue is: prices run Rs. 33 to Rs. 39,995
// with a median near Rs. 1,200, so even quarters would leave the top band empty.
const PRICE_BANDS = [
  { label: "Under Rs. 500", min: undefined, max: 500 },
  { label: "Rs. 500 - 1,500", min: 500, max: 1500 },
  { label: "Rs. 1,500 - 3,000", min: 1500, max: 3000 },
  { label: "Rs. 3,000 - 8,000", min: 3000, max: 8000 },
  { label: "Above Rs. 8,000", min: 8000, max: undefined },
];

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [catFilter, setCatFilter] = useState("");

  const selBrands = search.brands ? search.brands.split(",") : [];
  const selCats = search.categories ? search.categories.split(",") : [];
  const page = search.page ?? 1;

  const setSearch = (patch: Partial<ShopSearch>) =>
    navigate({ search: (prev: ShopSearch) => ({ ...prev, page: undefined, ...patch }) });

  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: fetchBrands });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  // Counts for every category/department pill if it were clicked next, given
  // the brand/price/rating/discount/search filters currently active — not
  // the global tally fetchCategoryCounts gives on the homepage. Left out of
  // its own queryKey: `categories` (a pill's own selection doesn't shrink its
  // own count — only the *other* active filters do).
  const { data: facetCounts } = useQuery({
    queryKey: [
      "shop-facet-counts",
      selBrands,
      search.min,
      search.max,
      search.rating,
      search.discount,
      search.q,
    ],
    queryFn: () =>
      fetchFacetCounts({
        brands: selBrands.length ? selBrands : undefined,
        minPrice: search.min,
        maxPrice: search.max,
        minRating: search.rating,
        minDiscount: search.discount,
        q: search.q,
      }),
  });

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
  // A selected category always stays visible — a search term, or the filter
  // dropping its count to zero, can never hide a pill that is currently
  // applied, or there'd be no way left to switch it back off. Otherwise,
  // until facetCounts has loaded, don't filter on count (it would briefly
  // read every category as 0 and empty the whole list).
  const matchingCats = visibleCats.filter((c) => {
    if (selCats.includes(c.slug)) return true;
    if (!c.name.toLowerCase().includes(catFilter.trim().toLowerCase())) return false;
    return facetCounts == null || (facetCounts[c.slug] ?? 0) > 0;
  });

  const departmentCounts = facetCounts
    ? Object.fromEntries(
        DEPARTMENTS.map((d) => [
          d.slug,
          d.categorySlugs.reduce((n, s) => n + (facetCounts[s] ?? 0), 0),
        ]),
      )
    : null;

  const activeDepartment = DEPARTMENTS.find(
    (d) =>
      d.categorySlugs.length === selCats.length &&
      d.categorySlugs.every((s) => selCats.includes(s)),
  );
  const singleCategory =
    !activeDepartment && selCats.length === 1
      ? (categories ?? []).find((c) => c.slug === selCats[0])
      : undefined;
  const brandLabel =
    selBrands.length === 1
      ? (brands ?? []).find((b) => b.slug === selBrands[0])?.name
      : selBrands.length > 1
        ? `${selBrands.length} brands`
        : undefined;
  const headingParts = [brandLabel, activeDepartment?.name ?? singleCategory?.name].filter(
    (p): p is string => Boolean(p),
  );
  const countLabel = isLoading ? "…" : total.toLocaleString("en-IN");
  const heading = search.q
    ? `Results for "${search.q}"`
    : headingParts.length === 0
      ? `All Products (${countLabel})`
      : headingParts.length === 1
        ? `${headingParts[0]} Products (${countLabel})`
        : `${headingParts.join(" · ")} (${countLabel})`;

  const toggleList = (key: "brands" | "categories", value: string) => {
    const current = key === "brands" ? selBrands : selCats;
    const next = current.includes(value)
      ? current.filter((v: string) => v !== value)
      : [...current, value];
    setSearch({ [key]: next.length ? next.join(",") : undefined } as Partial<ShopSearch>);
  };

  const activeCount =
    selBrands.length +
    selCats.length +
    (search.min != null || search.max != null ? 1 : 0) +
    (search.discount ? 1 : 0) +
    (search.rating ? 1 : 0);

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-sm font-semibold">Brand</h2>
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
        <h2 className="mb-2 text-sm font-semibold">Department</h2>
        <div className="space-y-1">
          {DEPARTMENTS.filter(
            (d) => d.slug === activeDepartment?.slug || (departmentCounts?.[d.slug] ?? 1) > 0,
          ).map((d) => {
            const active = d.slug === activeDepartment?.slug;
            const count = departmentCounts?.[d.slug];
            return (
              <button
                key={d.slug}
                type="button"
                onClick={() =>
                  setSearch({ categories: active ? undefined : d.categorySlugs.join(",") })
                }
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-left text-sm",
                  active ? "border-gold bg-gold-tint font-semibold text-gold" : "border-border",
                )}
              >
                <span className="truncate">{d.name}</span>
                {count != null && (
                  <span className="shrink-0 text-xs text-muted-foreground">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Category</h2>
        {/* 51 categories is past the point where a plain list is scannable, so
            the facet gets its own search box. */}
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            placeholder="Search categories"
            aria-label="Search categories"
            className="w-full rounded-lg border border-border bg-muted/60 py-1.5 pl-8 pr-2 text-xs outline-none focus:border-gold"
          />
        </div>
        <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
          {matchingCats.length === 0 && (
            <p className="py-2 text-xs text-muted-foreground">No categories match.</p>
          )}
          {matchingCats.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selCats.includes(c.slug)}
                onChange={() => toggleList("categories", c.slug)}
                className="h-4 w-4 accent-[var(--gold)]"
              />
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              {facetCounts != null && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {facetCounts[c.slug] ?? 0}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Price</h2>
        <div className="space-y-1.5">
          {PRICE_BANDS.map((band) => {
            const active = search.min === band.min && search.max === band.max;
            return (
              <button
                key={band.label}
                type="button"
                onClick={() =>
                  setSearch(
                    active ? { min: undefined, max: undefined } : { min: band.min, max: band.max },
                  )
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
        <h2 className="mb-2 text-sm font-semibold">Discount</h2>
        <div className="flex flex-wrap gap-2">
          {[10, 20, 30].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSearch({ discount: search.discount === d ? undefined : d })}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm",
                search.discount === d
                  ? "border-gold bg-gold-tint font-semibold text-gold"
                  : "border-border",
              )}
            >
              {d}%+
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Customer rating</h2>
        <div className="flex flex-wrap gap-2">
          {[4, 3].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSearch({ rating: search.rating === r ? undefined : r })}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm",
                search.rating === r
                  ? "border-gold bg-gold-tint font-semibold text-gold"
                  : "border-border",
              )}
            >
              {r}★ &amp; up
            </button>
          ))}
        </div>
      </div>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => navigate({ search: { q: search.q, sort: search.sort } })}
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
          <h1 className="truncate font-display text-2xl font-bold">{heading}</h1>
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
            aria-label="Sort products"
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
            <div className={PRODUCT_GRID}>
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : data && data.items.length ? (
            <>
              <div className={cn(PRODUCT_GRID, isFetching && "opacity-60")}>
                {data.items.map((item) => (
                  <ProductCard key={item.id} item={item} />
                ))}
              </div>
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    navigate({ search: (p: ShopSearch) => ({ ...p, page: page - 1 }) })
                  }
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
                  onClick={() =>
                    navigate({ search: (p: ShopSearch) => ({ ...p, page: page + 1 }) })
                  }
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
