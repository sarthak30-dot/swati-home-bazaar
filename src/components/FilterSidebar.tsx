import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { rupees } from "@/lib/format";
import { ALL_BRANDS, ALL_CATEGORIES, type Brand, type MainCategory } from "@/types/product";

// Static brand checkbox checked-state classes (no template literals for Tailwind scanner)
const BRAND_CHECKBOX: Record<Brand, string> = {
  "Stovekraft Pigeon":
    "data-[state=checked]:bg-pigeon data-[state=checked]:border-pigeon",
  Dubblin: "data-[state=checked]:bg-dubblin data-[state=checked]:border-dubblin",
  "YERA Prima": "data-[state=checked]:bg-yera data-[state=checked]:border-yera",
};

const MATERIALS = [
  "Borosilicate Glass",
  "304 Stainless Steel",
  "Ceramic",
  "Cast Iron",
] as const;

const CAPACITY_OPTIONS = [
  { label: "Under 500 ml", value: "lt500" },
  { label: "500 ml – 1 L", value: "500to1l" },
  { label: "1 L – 3 L", value: "1to3l" },
  { label: "Above 3 L", value: "gt3l" },
] as const;

export type CapacityRange = (typeof CAPACITY_OPTIONS)[number]["value"];

export const PRICE_MIN = 200;
export const PRICE_MAX = 15000;

export interface FilterState {
  brands: Brand[];
  categories: MainCategory[];
  materials: string[];
  capacity: CapacityRange | null;
  priceRange: [number, number];
}

export interface FilterCallbacks {
  onBrandToggle: (b: Brand) => void;
  onCategoryToggle: (c: MainCategory) => void;
  onMaterialToggle: (m: string) => void;
  onCapacityChange: (v: CapacityRange | null) => void;
  onPriceChange: (r: [number, number]) => void;
  onClearAll: () => void;
}

type FilterContentProps = FilterState & FilterCallbacks;

function FilterContent(props: FilterContentProps) {
  const {
    brands,
    categories,
    materials,
    capacity,
    priceRange,
    onBrandToggle,
    onCategoryToggle,
    onMaterialToggle,
    onCapacityChange,
    onPriceChange,
    onClearAll,
  } = props;

  const hasFilters =
    brands.length > 0 ||
    categories.length > 0 ||
    materials.length > 0 ||
    capacity !== null ||
    priceRange[0] !== PRICE_MIN ||
    priceRange[1] !== PRICE_MAX;

  return (
    <div className="flex flex-col gap-5">
      {hasFilters && (
        <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={onClearAll}>
          <X className="h-3.5 w-3.5" />
          Clear all filters
        </Button>
      )}

      {/* Brand */}
      <section>
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Brand
        </h3>
        <div className="flex flex-col gap-2">
          {ALL_BRANDS.map((brand) => (
            <label key={brand} className="flex cursor-pointer items-center gap-2.5">
              <Checkbox
                checked={brands.includes(brand)}
                onCheckedChange={() => onBrandToggle(brand)}
                className={BRAND_CHECKBOX[brand]}
              />
              <span className="text-sm">{brand}</span>
            </label>
          ))}
        </div>
      </section>

      <Separator />

      {/* Category */}
      <section>
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Category
        </h3>
        <div className="flex flex-col gap-2">
          {ALL_CATEGORIES.map((cat) => (
            <label key={cat} className="flex cursor-pointer items-center gap-2.5">
              <Checkbox
                checked={categories.includes(cat)}
                onCheckedChange={() => onCategoryToggle(cat)}
              />
              <span className="text-sm">{cat}</span>
            </label>
          ))}
        </div>
      </section>

      <Separator />

      {/* Capacity / Size */}
      <section>
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Capacity / Size
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {CAPACITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onCapacityChange(capacity === opt.value ? null : opt.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                capacity === opt.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:border-foreground/40",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <Separator />

      {/* Material */}
      <section>
        <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Material
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {MATERIALS.map((mat) => (
            <button
              key={mat}
              onClick={() => onMaterialToggle(mat)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                materials.includes(mat)
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:border-foreground/40",
              )}
            >
              {mat}
            </button>
          ))}
        </div>
      </section>

      <Separator />

      {/* Price range — dual-thumb Radix Slider */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Price
          </h3>
          <span className="text-xs text-muted-foreground">
            {rupees(priceRange[0])} – {rupees(priceRange[1])}
          </span>
        </div>
        <SliderPrimitive.Root
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={100}
          value={priceRange}
          onValueChange={(v) => onPriceChange(v as [number, number])}
          className="relative flex w-full touch-none select-none items-center py-1"
        >
          <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
            <SliderPrimitive.Range className="absolute h-full bg-primary" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
        </SliderPrimitive.Root>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{rupees(PRICE_MIN)}</span>
          <span>{rupees(PRICE_MAX)}</span>
        </div>
      </section>
    </div>
  );
}

/** Desktop inline sidebar — place in a CSS grid alongside the product grid. */
export function FilterSidebar({
  className,
  ...props
}: FilterContentProps & { className?: string }) {
  return (
    <aside className={cn("w-56 shrink-0", className)}>
      <div className="sticky top-20">
        <h2 className="mb-4 font-semibold">Filters</h2>
        <FilterContent {...props} />
      </div>
    </aside>
  );
}

/** Mobile sheet drawer — renders a trigger button; hides on sm+ screens. */
export function FilterDrawer(props: FilterContentProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 sm:hidden">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 overflow-y-auto">
        <SheetHeader className="mb-5">
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <FilterContent {...props} />
      </SheetContent>
    </Sheet>
  );
}

/** Convenience hook for managing filter state locally (for pages not using URL search params). */
export function useFilterState(): FilterState & FilterCallbacks {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<MainCategory[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [capacity, setCapacity] = useState<CapacityRange | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  return {
    brands,
    categories,
    materials,
    capacity,
    priceRange,
    onBrandToggle: (b) => setBrands((prev) => toggle(prev, b)),
    onCategoryToggle: (c) => setCategories((prev) => toggle(prev, c)),
    onMaterialToggle: (m) => setMaterials((prev) => toggle(prev, m)),
    onCapacityChange: setCapacity,
    onPriceChange: setPriceRange,
    onClearAll: () => {
      setBrands([]);
      setCategories([]);
      setMaterials([]);
      setCapacity(null);
      setPriceRange([PRICE_MIN, PRICE_MAX]);
    },
  };
}

