import { useState, useEffect, useMemo, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  PackageCheck,
  Award,
  Building2,
  ExternalLink,
  Flame,
  GlassWater,
  Utensils,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCTS, resolveProductImage, getAiProductImage } from "@/data/products";
import { ALL_BRANDS, BRAND_CLASS, BRAND_NAME_TO_SLUG, type Brand, type MainCategory } from "@/types/product";
import { ProductCard } from "@/components/ProductCard";
import { FilterSidebar, FilterDrawer, PRICE_MIN, PRICE_MAX, type CapacityRange } from "@/components/FilterSidebar";
import { SafeImage } from "@/components/SafeImage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Swati Enterprises — Pigeon, Dubblin & YERA Prima, Delhi" },
      {
        name: "description",
        content:
          "Authorised master distributor for Pigeon cookware, Dubblin insulated bottles and YERA Prima barware. Free delivery above Rs. 999.",
      },
      { property: "og:title", content: "Swati Enterprises — Home & Kitchen essentials" },
      {
        property: "og:description",
        content: "Genuine Pigeon, Dubblin and YERA Prima products at Delhi retail prices.",
      },
    ],
  }),
  component: Home,
});

// ── Hero carousel data ────────────────────────────────────────────────────────

const HERO_SLIDES = [
  {
    slug: "dubblin",
    brand: "Dubblin" as Brand,
    tagline: "Sip Bold, Live Mindfully",
    headline: "Insulated bottles & meal gear for every adventure.",
    cta: "Shop Dubblin",
    accent: "brand-dubblin",
    // Static active-dot class (no template literal)
    dotActive: "bg-dubblin",
  },
  {
    slug: "yera",
    brand: "YERA Prima" as Brand,
    tagline: "Crafted Elegance",
    headline: "Crystal whiskey tumblers, decanters and premium barware.",
    cta: "Shop YERA Prima",
    accent: "brand-yera",
    dotActive: "bg-yera",
  },
  {
    slug: "pigeon",
    brand: "Stovekraft Pigeon" as Brand,
    tagline: "Elevate Everyday Cooking",
    headline: "Cerasteel cookware, pressure cookers and digital air fryers.",
    cta: "Shop Pigeon",
    accent: "brand-pigeon",
    dotActive: "bg-pigeon",
  },
] as const;

// Pre-compute up to 3 product images per brand for hero showcase
const HERO_IMAGES: Record<string, string[]> = Object.fromEntries(
  (["Dubblin", "YERA Prima", "Stovekraft Pigeon"] as Brand[]).map((brand) => [
    BRAND_NAME_TO_SLUG[brand],
    PRODUCTS.filter((p) => p.brand === brand)
      .slice(0, 3)
      .map((p) => resolveProductImage(p)),
  ]),
);

// ── Brand portals data ────────────────────────────────────────────────────────

const BRAND_PORTALS = [
  {
    slug: "dubblin",
    brand: "Dubblin" as Brand,
    icon: GlassWater,
    tagline: "Sip Bold, Live Mindfully",
    description:
      "Vacuum-insulated bottles, lunch boxes, mugs and travel gear designed for the active Indian lifestyle.",
    attributionUrl: "https://dubblin.co.in/",
    attributionLabel: "dubblin.co.in",
  },
  {
    slug: "yera",
    brand: "YERA Prima" as Brand,
    icon: Utensils,
    tagline: "Crafted Elegance",
    description:
      "Premium borosilicate glassware — whiskey tumblers, decanters, wine sets and barware for discerning homes.",
    attributionUrl: "https://www.yera.com/collections/yera-prima-oak",
    attributionLabel: "yera.com · Prima Oak",
  },
  {
    slug: "pigeon",
    brand: "Stovekraft Pigeon" as Brand,
    icon: Flame,
    tagline: "Elevate Everyday Cooking",
    description:
      "Cerasteel non-stick cookware, aluminium pressure cookers and smart kitchen appliances trusted by millions.",
    attributionUrl: "https://stovekraft.com/",
    attributionLabel: "stovekraft.com",
  },
] as const;

// ── Trust badge data ──────────────────────────────────────────────────────────

const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    title: "100% Genuine Factory Stock",
    text: "Direct from brand warehouse — never grey-market or parallel imports.",
  },
  {
    icon: PackageCheck,
    title: "Breakage-Proof Glassware Transit",
    text: "YERA Prima barware packed in bubble-lined corrugated cartons.",
  },
  {
    icon: Award,
    title: "Manufacturer Warranty",
    text: "Full brand warranty on every product; we handle claims on your behalf.",
  },
  {
    icon: Building2,
    title: "B2B Dealer Carton Rates",
    text: "Bulk pricing on full cartons. Call +91 98105 33519 for trade quotes.",
  },
] as const;

// ── Static brand-switcher active classes ──────────────────────────────────────

// Full static strings so the Tailwind scanner picks them up
const SWITCHER_ACTIVE: Record<Brand, string> = {
  "Stovekraft Pigeon": "bg-pigeon text-white border-transparent",
  Dubblin: "bg-dubblin text-white border-transparent",
  "YERA Prima": "bg-yera text-white border-transparent",
};

// ── Capacity filter helper ────────────────────────────────────────────────────

function capToMl(cap: string | undefined): number | null {
  if (!cap) return null;
  const ml = cap.match(/(\d+(?:\.\d+)?)\s*ml/i);
  if (ml) return parseFloat(ml[1]);
  const l = cap.match(/(\d+(?:\.\d+)?)\s*l\b/i);
  if (l) return parseFloat(l[1]) * 1000;
  return null;
}

function inCapRange(cap: string | undefined, range: CapacityRange | null): boolean {
  if (!range) return true;
  const ml = capToMl(cap);
  if (ml === null) return true; // no capacity data — don't filter out
  if (range === "lt500") return ml < 500;
  if (range === "500to1l") return ml >= 500 && ml <= 1000;
  if (range === "1to3l") return ml > 1000 && ml <= 3000;
  if (range === "gt3l") return ml > 3000;
  return true;
}

// ── HeroBanner ────────────────────────────────────────────────────────────────

function HeroBanner() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent((c) => (c + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + HERO_SLIDES.length) % HERO_SLIDES.length), []);
  const next = useCallback(() => setCurrent((c) => (c + 1) % HERO_SLIDES.length), []);

  return (
    <section className="relative overflow-hidden" style={{ minHeight: 480 }}>
      {HERO_SLIDES.map((slide, i) => {
        const images = HERO_IMAGES[slide.slug] ?? [];
        return (
          <div
            key={slide.slug}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              slide.accent,
              i === current ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none",
            )}
          >
            <div className="h-full bg-brand-tint">
              <div className="mx-auto grid h-full max-w-7xl items-center gap-6 px-4 py-10 grid-cols-2 sm:gap-8 lg:py-20">
                {/* Text */}
                <div className="max-w-lg">
                  <span className="inline-block rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand">
                    {slide.tagline}
                  </span>
                  <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">
                    {slide.headline}
                  </h1>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to="/brand/$slug"
                      params={{ slug: slide.slug }}
                      className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                    >
                      {slide.cta}
                    </Link>
                    <Link
                      to="/shop"
                      search={{ brands: slide.slug }}
                      className="rounded-xl border border-brand px-6 py-3 text-sm font-semibold text-brand hover:bg-brand/10 transition-colors"
                    >
                      View all products
                    </Link>
                  </div>
                </div>

                {/* Product showcase */}
                <div className="relative h-56 sm:h-72 lg:h-80">
                  {images[0] && (
                    <SafeImage
                      src={images[0]}
                      alt=""
                      priority
                      className="absolute right-0 top-0 h-44 w-44 sm:h-64 sm:w-64 lg:h-72 lg:w-72 rounded-3xl object-cover shadow-2xl rotate-1 ring-4 ring-brand/10"
                    />
                  )}
                  {images[1] && (
                    <SafeImage
                      src={images[1]}
                      alt=""
                      priority
                      className="absolute bottom-0 right-32 sm:right-44 lg:right-48 h-28 w-28 sm:h-40 sm:w-40 lg:h-44 lg:w-44 rounded-2xl object-cover shadow-xl -rotate-2 ring-2 ring-brand/10"
                    />
                  )}
                  {images[2] && (
                    <SafeImage
                      src={images[2]}
                      alt=""
                      priority
                      className="absolute bottom-6 right-2 sm:bottom-10 sm:right-4 h-24 w-24 sm:h-32 sm:w-32 lg:h-36 lg:w-36 rounded-2xl object-cover shadow-lg rotate-3 ring-2 ring-brand/10"
                    />
                  )}
                  {images.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-3xl bg-brand/10">
                      <span className="text-4xl font-display font-bold text-brand/30">{slide.brand}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Prev / Next */}
      <button
        onClick={prev}
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow backdrop-blur-sm transition-colors hover:bg-background"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow backdrop-blur-sm transition-colors hover:bg-background"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.slug}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === current ? `w-6 ${slide.dotActive}` : "w-2 bg-foreground/25",
            )}
          />
        ))}
      </div>
    </section>
  );
}

// ── BrandPortalsStrip ─────────────────────────────────────────────────────────

function BrandPortalsStrip() {
  return (
    <section className="border-y border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Our Brand Partners</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Authorised master distributor — genuine stock, full manufacturer support.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {BRAND_PORTALS.map((portal) => (
            <div
              key={portal.slug}
              className={cn(
                "group flex flex-col rounded-2xl border border-border p-6 transition-shadow hover:shadow-lg",
                BRAND_CLASS[portal.brand],
              )}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="rounded-xl bg-brand/10 p-2.5">
                  <portal.icon className="h-6 w-6 text-brand" />
                </div>
                <a
                  href={portal.attributionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-brand transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>{portal.attributionLabel}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <h3 className="font-display text-xl font-bold text-brand">{portal.brand}</h3>
              <p className="mt-0.5 text-xs font-semibold uppercase tracking-widest text-brand/60">
                {portal.tagline}
              </p>
              <p className="mt-3 flex-1 text-sm text-foreground/80">{portal.description}</p>

              <Link
                to="/brand/$slug"
                params={{ slug: portal.slug }}
                className="mt-5 inline-flex items-center text-sm font-semibold text-brand hover:underline"
              >
                Explore {portal.brand === "Stovekraft Pigeon" ? "Pigeon" : portal.brand} &rarr;
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CatalogSection ────────────────────────────────────────────────────────────

function CatalogSection() {
  const [selectedBrands, setSelectedBrands] = useState<Brand[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<MainCategory[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedCapacity, setSelectedCapacity] = useState<CapacityRange | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);

  function toggleArr<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  const filterProps = {
    brands: selectedBrands,
    categories: selectedCategories,
    materials: selectedMaterials,
    capacity: selectedCapacity,
    priceRange,
    onBrandToggle: (b: Brand) => setSelectedBrands((p) => toggleArr(p, b)),
    onCategoryToggle: (c: MainCategory) => setSelectedCategories((p) => toggleArr(p, c)),
    onMaterialToggle: (m: string) => setSelectedMaterials((p) => toggleArr(p, m)),
    onCapacityChange: setSelectedCapacity,
    onPriceChange: setPriceRange,
    onClearAll: () => {
      setSelectedBrands([]);
      setSelectedCategories([]);
      setSelectedMaterials([]);
      setSelectedCapacity(null);
      setPriceRange([PRICE_MIN, PRICE_MAX]);
    },
  };

  // Brand switcher: clicking a brand sets it exclusively (not toggle)
  function switchBrand(brand: Brand | null) {
    setSelectedBrands(brand ? [brand] : []);
  }

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
      if (selectedMaterials.length > 0) {
        if (!p.material) return false;
        const lower = p.material.toLowerCase();
        if (!selectedMaterials.some((m) => lower.includes(m.toLowerCase()))) return false;
      }
      if (!inCapRange(p.capacity, selectedCapacity)) return false;
      if (p.sellingPrice < priceRange[0] || p.sellingPrice > priceRange[1]) return false;
      return true;
    });
  }, [selectedBrands, selectedCategories, selectedMaterials, selectedCapacity, priceRange]);

  const activeSwitcherBrand: Brand | null =
    selectedBrands.length === 1 ? selectedBrands[0] : null;

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Browse Products</h2>
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} of {PRODUCTS.length} products
            </p>
          </div>

          {/* Mobile filter drawer trigger */}
          <FilterDrawer {...filterProps} />
        </div>

        {/* Brand switcher pills */}
        <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => switchBrand(null)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              activeSwitcherBrand === null && selectedBrands.length === 0
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-foreground hover:border-foreground/40",
            )}
          >
            All brands
          </button>

          {ALL_BRANDS.map((brand) => (
            <button
              key={brand}
              onClick={() =>
                switchBrand(activeSwitcherBrand === brand ? null : brand)
              }
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                activeSwitcherBrand === brand
                  ? SWITCHER_ACTIVE[brand]
                  : "border-border bg-background text-foreground hover:border-foreground/40",
              )}
            >
              {brand === "Stovekraft Pigeon" ? "Pigeon" : brand}
            </button>
          ))}
        </div>

        {/* Sidebar + Grid */}
        <div className="flex gap-8">
          {/* Sidebar — desktop only (sm+) */}
          <FilterSidebar {...filterProps} className="hidden sm:block" />

          {/* Product grid */}
          <div className="min-w-0 flex-1">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <p className="text-lg font-semibold">No products match your filters.</p>
                <button
                  onClick={filterProps.onClearAll}
                  className="text-sm font-medium text-muted-foreground underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── TrustBadges ───────────────────────────────────────────────────────────────

function TrustBadges() {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-8 text-center font-display text-xl font-bold sm:text-2xl">
          Why Buy from Swati Enterprises
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_BADGES.map((badge) => (
            <div
              key={badge.title}
              className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-background p-5"
            >
              <div className="rounded-xl bg-gold/10 p-2.5">
                <badge.icon className="h-6 w-6 text-gold" />
              </div>
              <div>
                <p className="font-semibold leading-snug">{badge.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{badge.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────

function Home() {
  return (
    <div>
      <HeroBanner />
      <BrandPortalsStrip />
      <CatalogSection />
      <TrustBadges />

      {/* Footer CTA */}
      <section className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-sm text-muted-foreground">
            B2B enquiries &amp; dealer carton orders:{" "}
            <a href="tel:+919810533519" className="font-semibold text-foreground hover:underline">
              +91 98105 33519
            </a>{" "}
            · Swati Enterprises, Chandni Chowk, Delhi
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Authorised distributor for{" "}
            <a href="https://dubblin.co.in/" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Dubblin
            </a>
            {" · "}
            <a href="https://www.yera.com/collections/yera-prima-oak" target="_blank" rel="noopener noreferrer" className="hover:underline">
              YERA Prima
            </a>
            {" · "}
            <a href="https://stovekraft.com/" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Stovekraft Pigeon
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
