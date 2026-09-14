import { useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ZoomIn,
  Heart,
  ShoppingCart,
  Check,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RotateCcw,
  Building2,
  ChevronRight,
  AlertTriangle,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { rupees } from "@/lib/format";
import { PRODUCTS } from "@/data/products";
import { BRAND_CLASS, BRAND_NAME_TO_SLUG, type Brand, type Product } from "@/types/product";
import { ProductCard } from "@/components/ProductCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// ── DB-fallback imports (used when sku is not a local product) ────────────────
import { fetchProductBySku, fetchRelated, fetchSiblings } from "@/lib/catalog";
import { ProductImage, brandClass } from "@/components/store/ProductImage";
import { ProductCard as DbProductCard } from "@/components/store/ProductCard";
import { RatingChip } from "@/components/store/RatingChip";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";

// ── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/product/$sku")({
  head: ({ params }) => {
    const p = PRODUCTS.find((x) => x.sku === params.sku || x.id === params.sku);
    const title = p ? `${p.name} — Swati Enterprises` : `${params.sku} — Swati Enterprises`;
    const desc = p
      ? `${p.name} by ${p.brand}. ${p.features?.[0] ?? "Genuine stock with brand warranty."}`
      : `Product details for ${params.sku} at Swati Enterprises Delhi.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { sku } = Route.useParams();
  const local = PRODUCTS.find((p) => p.sku === sku || p.id === sku);
  return local ? <LocalPDP product={local} /> : <DbPDP sku={sku} />;
}

// ── Care & Safety content ─────────────────────────────────────────────────────

type CareSection = { heading: string; warning?: boolean; items: string[] };

function getCareContent(product: Product): CareSection[] {
  const mat = (product.material ?? "").toLowerCase();

  if (mat.includes("borosilicate")) {
    return [
      {
        heading: "Thermal Resistance",
        items: [
          "Safe for temperatures from −20 °C to +120 °C",
          "Resistant to moderate thermal shock (cold to room temperature)",
          "Do NOT place directly over open flame or a gas stovetop burner",
          "Avoid filling with boiling water while the bottle is ice-cold — acclimate first",
          "Not intended for oven or microwave use (metal lid/sleeve excluded)",
        ],
      },
      {
        heading: "Cleaning",
        items: [
          "Dishwasher safe — top rack only, at ≤65 °C",
          "Use mild dish soap; avoid abrasive scrubbers",
          "Rinse promptly after acidic beverages (citrus juice, vinegar) to prevent etching",
          "Air-dry inverted — do not store with lid sealed when wet",
        ],
      },
      {
        heading: "Storage & Handling",
        items: [
          "Inspect for chips or cracks before each use — do not use if damaged",
          "Keep away from the edges of countertops",
          "Silicone sleeves reduce impact risk — keep the sleeve on during use",
        ],
      },
    ];
  }

  if (mat.includes("glass") || mat.includes("crystal")) {
    return [
      {
        heading: "Thermal Handling",
        warning: true,
        items: [
          "Do not pour boiling liquids directly into room-temperature glassware",
          "Pre-warm glasses with warm (not hot) water before adding hot beverages",
          "Not suitable for microwave or oven use",
          "Avoid extreme cold — do not freeze",
        ],
      },
      {
        heading: "Cleaning",
        items: [
          "Hand wash recommended with mild detergent for long-term clarity",
          "Dishwasher safe on gentle cycle — top rack only",
          "Avoid abrasive pads that can scratch the surface",
          "Dry with a lint-free cloth for a streak-free finish",
          "Remove lipstick or coloured-drink stains with a small amount of baking soda paste",
        ],
      },
      {
        heading: "Glassware Safety",
        warning: true,
        items: [
          "Inspect each glass for chips along the rim before serving",
          "Do not stack glasses of different shapes — chips cause breakage",
          "Handle by the body, not the rim, when moving multiple glasses",
          "Keep out of reach of children when not in use",
        ],
      },
    ];
  }

  if (mat.includes("stainless") || mat.includes("steel")) {
    return [
      {
        heading: "Temperature Performance",
        items: [
          "Double-wall vacuum insulation keeps hot beverages warm for up to 12 hours",
          "Cold retention up to 24 hours when pre-chilled",
          "Do not microwave — stainless steel reflects microwave energy",
          "Safe for hot and cold beverages; avoid carbonated drinks in sealed containers",
        ],
      },
      {
        heading: "Cleaning",
        items: [
          "Hand wash with warm water and mild detergent after every use",
          "Not dishwasher safe — high heat degrades vacuum insulation over time",
          "Use a bottle brush to clean the interior — avoid bleach or chlorine",
          "Remove tea/coffee stains with a baking soda and warm water soak",
          "Air-dry with the lid off to prevent odour build-up",
        ],
      },
      {
        heading: "Care for Longevity",
        items: [
          "Do not drop — dents compromise insulation performance",
          "Avoid prolonged storage of acidic foods (sauces, marinades)",
          "18/8 (304-grade) stainless steel is food-safe and rust-resistant under normal use",
        ],
      },
    ];
  }

  if (mat.includes("ceramic")) {
    return [
      {
        heading: "Cooking Guidelines",
        items: [
          "Compatible with gas and induction cooktops",
          "Start on low-medium heat — ceramics heat evenly and require less energy",
          "Avoid sudden temperature changes (e.g., hot pan into cold water)",
          "Do not use metal utensils — they scratch the ceramic coating",
        ],
      },
      {
        heading: "Cleaning",
        items: [
          "Let cookware cool completely before washing",
          "Hand wash with warm soapy water and a soft sponge",
          "Avoid abrasive cleaners and steel wool pads",
          "Stubborn residue: soak with warm water for 15 minutes before washing",
        ],
      },
      {
        heading: "Coating Longevity",
        warning: true,
        items: [
          "Non-stick performance lasts longest with silicone or wooden utensils",
          "Store with a cloth layer between stacked pans to prevent scratches",
          "Discontinue use if the coating chips or peels significantly",
        ],
      },
    ];
  }

  // Default / appliances
  return [
    {
      heading: "General Safety",
      items: [
        "Read the product manual before first use",
        "Keep away from water sources unless specified as water-resistant",
        "Do not operate with damaged cords or plugs",
        "Unplug when not in use and before cleaning",
      ],
    },
    {
      heading: "Cleaning",
      items: [
        "Wipe exterior with a lightly damp cloth",
        "Remove and wash detachable parts as per manual instructions",
        "Do not immerse the electrical base in water",
      ],
    },
  ];
}

// ── Warranty content ──────────────────────────────────────────────────────────

const WARRANTY: Record<Brand, { period: string; covers: string[]; excludes: string[]; claim: string }> = {
  Dubblin: {
    period: "1 year from purchase date",
    covers: [
      "Manufacturing defects in materials and workmanship",
      "Vacuum insulation failure within warranty period",
      "Lid mechanism defects under normal use",
    ],
    excludes: [
      "Physical damage from drops, impacts, or misuse",
      "Surface scratches and cosmetic wear from regular use",
      "Damage from using harsh chemicals or dishwasher (where not specified)",
    ],
    claim:
      "Present your Swati Enterprises purchase receipt. We process Dubblin warranty claims directly — contact us at +91 98105 33519 or visit our Chandni Chowk store.",
  },
  "YERA Prima": {
    period: "Against manufacturing defects at time of delivery",
    covers: [
      "Visible glass imperfections present at point of unboxing",
      "Printing or etching quality defects",
      "Missing items from sealed sets",
    ],
    excludes: [
      "Breakage from impact, drops, or stacking",
      "Thermal shock breakage (pouring boiling liquid into cold glass)",
      "Colour fading or cloudiness from dishwasher use on coloured glassware",
      "Chips and cracks from handling after delivery",
    ],
    claim:
      "Report manufacturing defects within 48 hours of delivery with clear photos. Breakage during normal use is not covered. For gifting purchases, unbox and inspect promptly.",
  },
  "Stovekraft Pigeon": {
    period: "1 year (cookware) · 2 years (electrical appliances)",
    covers: [
      "Manufacturing defects in components",
      "Electrical failures not caused by misuse or power surge",
      "Coating defects within first 6 months of purchase",
    ],
    excludes: [
      "Physical damage from misuse or improper handling",
      "Damage from power surges or incorrect voltage",
      "Normal wear of non-stick coatings after 6 months",
      "Accessories like gaskets and safety valves (consumable parts)",
    ],
    claim:
      "Register your product at stovekraft.com for the full 2-year warranty on appliances. Swati Enterprises assists with warranty claims for products purchased from us — keep your invoice.",
  },
};

// ── Compatibility helper ──────────────────────────────────────────────────────

function getCompat(product: Product) {
  const mat = (product.material ?? "").toLowerCase();
  const feats = (product.features ?? []).join(" ").toLowerCase();
  return {
    dishwasher:
      mat.includes("borosilicate") ||
      mat.includes("glass") ||
      feats.includes("dishwasher"),
    induction:
      mat.includes("ceramic") ||
      mat.includes("aluminium") ||
      feats.includes("induction"),
    microwave: mat.includes("borosilicate") && !mat.includes("lid"),
    gasSafe:
      !mat.includes("glass") ||
      mat.includes("borosilicate"),
  };
}

// ── ImageGallery ──────────────────────────────────────────────────────────────

function ImageGallery({ product }: { product: Product }) {
  const images = [product.images.primary, product.images.hover].filter(Boolean) as string[];
  const [selected, setSelected] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const src = images[selected] ?? "";

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted cursor-zoom-in select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoom(null)}
      >
        {src ? (
          <img
            src={src}
            alt={product.name}
            draggable={false}
            className="h-full w-full object-contain transition-transform duration-150 ease-out"
            style={
              zoom
                ? { transform: "scale(2.2)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                : {}
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand-tint">
            <span className="font-display text-2xl font-bold text-brand/30">{product.brand}</span>
          </div>
        )}

        {/* Out-of-stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <span className="rounded-full bg-foreground/80 px-4 py-1.5 text-sm font-semibold text-background">
              Out of Stock
            </span>
          </div>
        )}

        {/* Discount ribbon */}
        {product.discountPercentage > 0 && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white">
            {product.discountPercentage}% OFF
          </span>
        )}

        {/* Zoom hint */}
        {src && (
          <div
            className={cn(
              "absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] transition-opacity",
              zoom
                ? "bg-background/90 text-foreground opacity-100"
                : "bg-background/60 text-muted-foreground opacity-70",
            )}
          >
            <ZoomIn className="h-3 w-3" />
            {zoom ? "Zoomed" : "Hover to zoom"}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={cn(
                "h-16 w-16 overflow-hidden rounded-xl border-2 transition-all",
                i === selected
                  ? "border-brand shadow-sm"
                  : "border-border hover:border-brand/40",
              )}
            >
              <img
                src={img}
                alt={`View ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── B2B Inquiry Modal ─────────────────────────────────────────────────────────

function B2BModal({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    firm: "",
    qty: "",
    location: "",
    phone: "",
  });

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setTimeout(() => {
      setPending(false);
      setOpen(false);
      setForm({ name: "", firm: "", qty: "", location: "", phone: "" });
      toast.success("Dealer inquiry received!", {
        description: `We'll call ${form.name || "you"} back within 24 hours for ${form.qty} units.`,
      });
    }, 700);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-foreground/30 px-4 py-2.5 text-sm font-semibold text-foreground/70 transition-colors hover:border-brand hover:text-brand">
          <Building2 className="h-4 w-4" />
          Request Dealer / Carton Pricing
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-brand" />
            B2B / Wholesale Inquiry
          </DialogTitle>
        </DialogHeader>

        <p className="mt-1 text-sm text-muted-foreground">
          Get carton-rate pricing for{" "}
          <strong className="text-foreground">{product.name}</strong>. Our dealer
          team responds within 24 hours on business days.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                required
                value={form.name}
                onChange={field("name")}
                placeholder="Your name"
                className="rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold">Firm / Shop Name</label>
              <Input
                value={form.firm}
                onChange={field("firm")}
                placeholder="Business name"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold">
                Required Quantity <span className="text-destructive">*</span>
              </label>
              <Input
                required
                type="number"
                min="1"
                value={form.qty}
                onChange={field("qty")}
                placeholder="e.g. 50 units"
                className="rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold">
                Location / City <span className="text-destructive">*</span>
              </label>
              <Input
                required
                value={form.location}
                onChange={field("location")}
                placeholder="City, State"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold">Phone Number</label>
            <Input
              type="tel"
              value={form.phone}
              onChange={field("phone")}
              placeholder="+91 XXXXX XXXXX"
              className="rounded-xl"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-1 flex w-full items-center justify-center rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send Inquiry"}
          </button>

          <p className="text-center text-[11px] text-muted-foreground">
            Or call directly:{" "}
            <a href="tel:+919810533519" className="font-semibold text-foreground">
              +91 98105 33519
            </a>{" "}
            · Swati Enterprises, Chandni Chowk
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── ProductTabs ───────────────────────────────────────────────────────────────

function ProductTabs({ product }: { product: Product }) {
  const care = getCareContent(product);
  const warranty = WARRANTY[product.brand];
  const compat = getCompat(product);

  const specRows: { label: string; value: string }[] = [
    { label: "Brand", value: product.brand },
    { label: "SKU Code", value: product.sku },
    { label: "Category", value: product.category },
    ...(product.subcategory ? [{ label: "Sub-category", value: product.subcategory }] : []),
    ...(product.material ? [{ label: "Material", value: product.material }] : []),
    ...(product.capacity ? [{ label: "Capacity", value: product.capacity }] : []),
    ...(product.packSize ? [{ label: "Pack Size", value: `Set of ${product.packSize}` }] : []),
    {
      label: "Dishwasher Safe",
      value: compat.dishwasher ? "Yes" : "No",
    },
    {
      label: "Induction Compatible",
      value: compat.induction ? "Yes" : "No",
    },
    {
      label: "Gas Stove Safe",
      value: compat.gasSafe ? "Yes" : "Not suitable for direct flame",
    },
    {
      label: "Microwave Safe",
      value: compat.microwave ? "Yes (without metal lid)" : "No",
    },
    { label: "Stock Status", value: product.inStock ? "In Stock" : "Out of Stock" },
  ];

  return (
    <Tabs defaultValue="specs" className="w-full">
      <TabsList className="h-auto flex-wrap gap-1 bg-muted p-1">
        <TabsTrigger value="specs" className="rounded-md px-4 py-1.5 text-sm">
          Specifications
        </TabsTrigger>
        <TabsTrigger value="care" className="rounded-md px-4 py-1.5 text-sm">
          Care &amp; Safety
        </TabsTrigger>
        <TabsTrigger value="warranty" className="rounded-md px-4 py-1.5 text-sm">
          Warranty &amp; Authenticity
        </TabsTrigger>
      </TabsList>

      {/* Specifications */}
      <TabsContent value="specs" className="mt-4">
        <dl className="divide-y divide-border rounded-2xl border border-border">
          {specRows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[130px_1fr] gap-4 px-4 py-2.5 text-sm sm:grid-cols-[180px_1fr]"
            >
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
        {product.features && product.features.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 text-sm font-semibold">Key Features</h3>
            <ul className="space-y-1.5">
              {product.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </TabsContent>

      {/* Care & Safety */}
      <TabsContent value="care" className="mt-4">
        <div className="space-y-5">
          {care.map((section) => (
            <div key={section.heading}>
              <div className="mb-2 flex items-center gap-2">
                {section.warning && (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                <h3 className="text-sm font-semibold">{section.heading}</h3>
              </div>
              <ul className="space-y-1.5 pl-1">
                {section.items.map((item, i) => (
                  <li
                    key={i}
                    className={cn(
                      "flex items-start gap-2 text-sm",
                      section.warning ? "text-amber-800 dark:text-amber-300" : "text-foreground/80",
                    )}
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </TabsContent>

      {/* Warranty & Authenticity */}
      <TabsContent value="warranty" className="mt-4">
        <div className="space-y-5">
          {/* Warranty period highlight */}
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950/30">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                Warranty Period
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
                {warranty.period}
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">What&apos;s Covered</h3>
            <ul className="space-y-1.5">
              {warranty.covers.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Not Covered</h3>
            <ul className="space-y-1.5">
              {warranty.excludes.map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  {e}
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 text-sm font-semibold">How to Claim</h3>
            <p className="text-sm text-foreground/80">{warranty.claim}</p>
          </div>

          <div className="rounded-xl border border-brand/20 bg-brand-tint px-4 py-3">
            <p className="text-xs font-semibold text-brand">Authenticity Guarantee</p>
            <p className="mt-0.5 text-xs text-foreground/70">
              Swati Enterprises is an authorised master distributor for {product.brand}. Every
              product is sourced directly from the factory with original packaging and carries the
              full manufacturer warranty. We never deal in parallel imports or grey-market stock.
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

// ── LocalPDP ──────────────────────────────────────────────────────────────────

// Static brand pill classes — full strings for Tailwind scanner
const BRAND_PILL: Record<Brand, string> = {
  "Stovekraft Pigeon": "bg-pigeon text-white",
  Dubblin: "bg-dubblin text-white",
  "YERA Prima": "bg-yera text-white",
};

function LocalPDP({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const [addState, setAddState] = useState<"idle" | "adding" | "added">("idle");
  const [wishlisted, setWishlisted] = useState(false);

  const brandSlug = BRAND_NAME_TO_SLUG[product.brand];
  const savings = product.mrp - product.sellingPrice;

  const related = PRODUCTS.filter(
    (p) => p.brand === product.brand && p.id !== product.id,
  ).slice(0, 4);

  function handleAddToCart() {
    if (!product.inStock || addState !== "idle") return;
    setAddState("adding");
    setTimeout(() => {
      setAddState("added");
      toast.success(`${product.name} × ${qty} added to cart`, {
        description: rupees(product.sellingPrice * qty),
      });
      setTimeout(() => setAddState("idle"), 1800);
    }, 400);
  }

  function handleBuyNow() {
    if (!product.inStock) return;
    toast.success("Proceeding to checkout…", {
      description: `${product.name} × ${qty}`,
    });
  }

  return (
    <div className={BRAND_CLASS[product.brand]}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-brand">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/brand/$slug" params={{ slug: brandSlug }} className="hover:text-brand">
            {product.brand === "Stovekraft Pigeon" ? "Pigeon" : product.brand}
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        {/* Main two-column layout */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Gallery */}
          <ImageGallery product={product} />

          {/* Right: Product details */}
          <div className="flex flex-col gap-4">
            {/* Brand badge + stock */}
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide",
                  BRAND_PILL[product.brand],
                )}
              >
                {product.brand === "Stovekraft Pigeon" ? "Pigeon" : product.brand}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold",
                  product.inStock ? "text-emerald-600" : "text-destructive",
                )}
              >
                {product.inStock ? "● In Stock" : "● Out of Stock"}
              </span>
            </div>

            <h1 className="font-display text-2xl font-bold leading-snug sm:text-3xl">
              {product.name}
            </h1>

            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>

            {/* Price block */}
            <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-display text-3xl font-bold">
                  {rupees(product.sellingPrice)}
                </span>
                {savings > 0 && (
                  <>
                    <span className="text-base text-muted-foreground line-through">
                      {rupees(product.mrp)}
                    </span>
                    <span className="text-sm font-bold text-emerald-600">
                      {product.discountPercentage}% off
                    </span>
                  </>
                )}
              </div>
              {savings > 0 && (
                <p className="mt-0.5 text-sm font-medium text-emerald-600">
                  You save {rupees(savings)}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>
            </div>

            {/* Pack size + capacity chips */}
            {(product.capacity || (product.packSize && product.packSize > 1)) && (
              <div className="flex flex-wrap gap-2">
                {product.capacity && (
                  <span className="rounded-xl border border-brand bg-brand-tint px-3 py-1.5 text-sm font-semibold text-brand">
                    {product.capacity}
                  </span>
                )}
                {product.packSize && product.packSize > 1 && (
                  <span className="rounded-xl border border-brand bg-brand-tint px-3 py-1.5 text-sm font-semibold text-brand">
                    Set of {product.packSize}
                  </span>
                )}
              </div>
            )}

            {/* Key features */}
            {product.features && product.features.length > 0 && (
              <ul className="space-y-1.5">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>
            )}

            <Separator />

            {/* Quantity + CTA */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-border">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2.5"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQty((q) => Math.min(10, q + 1))}
                  className="px-3 py-2.5"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                Total: <strong>{rupees(product.sellingPrice * qty)}</strong>
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                disabled={!product.inStock || addState === "adding"}
                onClick={handleAddToCart}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-all active:scale-[0.98]",
                  !product.inStock
                    ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                    : addState === "added"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30"
                      : "border-brand text-brand hover:bg-brand-tint",
                )}
              >
                {addState === "added" ? (
                  <><Check className="h-4 w-4" /> Added to Cart</>
                ) : (
                  <><ShoppingCart className="h-4 w-4" /> {addState === "adding" ? "Adding…" : "Add to Cart"}</>
                )}
              </button>

              <button
                type="button"
                disabled={!product.inStock}
                onClick={handleBuyNow}
                className="flex flex-1 items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Buy Now
              </button>

              <button
                type="button"
                aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
                onClick={() => setWishlisted((w) => !w)}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border transition-colors hover:border-rose-300"
              >
                <Heart
                  className={cn(
                    "h-5 w-5 transition-colors",
                    wishlisted ? "fill-rose-500 text-rose-500" : "text-muted-foreground",
                  )}
                />
              </button>
            </div>

            {/* Delivery strip */}
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-muted/20 p-3 text-center">
              <div className="flex flex-col items-center gap-1">
                <Truck className="h-4 w-4 text-gold" />
                <p className="text-[11px] leading-snug">Free delivery above Rs. 999</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-gold" />
                <p className="text-[11px] leading-snug">Brand warranty included</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="h-4 w-4 text-gold" />
                <p className="text-[11px] leading-snug">7-day replacement</p>
              </div>
            </div>

            {/* B2B modal */}
            <B2BModal product={product} />
          </div>
        </div>

        {/* Tabbed specs section */}
        <div className="mt-10">
          <ProductTabs product={product} />
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-12">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-lg font-bold">
                More from{" "}
                {product.brand === "Stovekraft Pigeon" ? "Pigeon" : product.brand}
              </h2>
              <Link
                to="/brand/$slug"
                params={{ slug: brandSlug }}
                className="text-sm font-semibold text-brand hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <Link
                  key={p.id}
                  to="/product/$sku"
                  params={{ sku: p.sku }}
                  className="block"
                >
                  <ProductCard product={p} />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ── DbPDP (fallback for non-local SKUs) ───────────────────────────────────────

function DbPDP({ sku }: { sku: string }) {
  const navigate = useNavigate();
  const { add } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const [qty, setQty] = useState(1);

  const { data: item, isLoading } = useQuery({
    queryKey: ["product", sku],
    queryFn: () => fetchProductBySku(sku),
  });

  const { data: siblings } = useQuery({
    queryKey: ["siblings", item?.product_id],
    enabled: Boolean(item?.product_id),
    queryFn: () => fetchSiblings(item!.product_id),
  });

  const { data: related } = useQuery({
    queryKey: ["related", item?.category_slug, item?.product_id],
    enabled: Boolean(item?.product_id),
    queryFn: () => fetchRelated(item!.category_slug, item!.product_id),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
          <div className="space-y-4">
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-10 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) throw notFound();

  const out = item.stock_qty <= 0;
  const specs = item.specifications ?? {};

  return (
    <div className={brandClass(item.brand_slug)}>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-gold">Home</Link>
          <span>/</span>
          <Link to="/brand/$slug" params={{ slug: item.brand_slug }} className="hover:text-gold">
            {item.brand_name}
          </Link>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="aspect-square">
              <ProductImage
                name={item.product_name}
                capacity={item.capacity_or_size}
                brandSlug={item.brand_slug}
                imageUrl={item.image_url}
              />
            </div>
          </div>

          <div>
            <span className="inline-block rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              {item.brand_name}
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">{item.product_name}</h1>
            <div className="mt-2 flex items-center gap-3">
              <RatingChip rating={item.rating} count={item.rating_count} />
              <span className="text-xs text-muted-foreground">SKU {item.sku_id}</span>
            </div>

            <div className="mt-4 flex flex-wrap items-baseline gap-2">
              <span className="font-display text-3xl font-bold">{rupees(item.selling_price)}</span>
              <span className="text-base text-muted-foreground line-through">{rupees(item.mrp)}</span>
              {item.discount_pct > 0 && (
                <span className="text-base font-bold text-success">{item.discount_pct}% off</span>
              )}
            </div>

            {siblings && siblings.length > 1 && (
              <div className="mt-5">
                <p className="mb-2 text-sm font-semibold">Available options</p>
                <div className="flex flex-wrap gap-2">
                  {siblings.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => navigate({ to: "/product/$sku", params: { sku: v.sku_id } })}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm",
                        v.id === item.id
                          ? "border-brand bg-brand-tint font-semibold text-brand"
                          : "border-border",
                      )}
                    >
                      {v.capacity_or_size ?? v.color ?? v.variant_code ?? v.sku_id}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-border">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2.5">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                <button type="button" onClick={() => setQty((q) => Math.min(item.stock_qty || 10, q + 1))} className="p-2.5">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className={cn("text-sm font-medium", out ? "text-destructive" : "text-success")}>
                {out ? "Out of stock" : `In stock (${item.stock_qty} available)`}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={out}
                onClick={async () => { await add(item.id, qty); toast.success("Added to cart"); }}
                className="flex-1 rounded-xl border border-brand px-6 py-3 text-sm font-semibold text-brand hover:bg-brand-tint disabled:opacity-40"
              >
                Add to cart
              </button>
              <button
                type="button"
                disabled={out}
                onClick={async () => { await add(item.id, qty); navigate({ to: "/cart" }); }}
                className="flex-1 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                Buy now
              </button>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                className="grid h-12 w-12 place-items-center rounded-xl border border-border"
              >
                <Heart className={cn("h-5 w-5", isWishlisted(item.id) ? "fill-brand text-brand" : "text-muted-foreground")} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-3">
              {[
                { icon: Truck, text: "Free delivery above Rs. 999" },
                { icon: ShieldCheck, text: "Brand warranty included" },
                { icon: RotateCcw, text: "7-day replacement" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <p className="text-xs">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {(item.description || Object.keys(specs).length > 0) && (
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {item.description && (
              <section>
                <h2 className="font-display text-lg font-bold">Description</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </section>
            )}
            {Object.keys(specs).length > 0 && (
              <section>
                <h2 className="font-display text-lg font-bold">Specifications</h2>
                <dl className="mt-2 divide-y divide-border rounded-2xl border border-border">
                  {Object.entries(specs).map(([k, v]) => (
                    <div key={k} className="grid grid-cols-2 gap-2 px-4 py-2.5 text-sm">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="font-medium">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>
        )}

        {related && related.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-lg font-bold">You may also like</h2>
            <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto pb-2">
              {related.map((r) => (
                <div key={r.id} className="w-44 shrink-0 sm:w-56">
                  <DbProductCard item={r} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
