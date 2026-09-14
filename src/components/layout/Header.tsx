import { useState, useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ChevronDown,
  Droplets,
  Flame,
  Heart,
  LayoutGrid,
  Menu,
  Minus,
  Package,
  Phone,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  User,
  Wine,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { rupees } from "@/lib/format";

// ── Static data ───────────────────────────────────────────────────────────────

const TICKER = [
  "Authorized Master Distributor — Dubblin · YERA Prima · Stovekraft Pigeon",
  "Free delivery above Rs. 999 · Delhi NCR same-week dispatch",
  "B2B & Dealer enquiries: +91 98105 33519",
];

const BRANDS = [
  {
    slug: "pigeon",
    label: "Stovekraft Pigeon",
    active: "bg-pigeon/10 text-pigeon ring-1 ring-inset ring-pigeon/30",
    activeMobile: "bg-pigeon text-white",
  },
  {
    slug: "dubblin",
    label: "Dubblin",
    active: "bg-dubblin/10 text-dubblin ring-1 ring-inset ring-dubblin/30",
    activeMobile: "bg-dubblin text-white",
  },
  {
    slug: "yera",
    label: "YERA Prima",
    active: "bg-yera/10 text-yera ring-1 ring-inset ring-yera/30",
    activeMobile: "bg-yera text-white",
  },
] as const;

const CATEGORIES = [
  {
    Icon: Droplets,
    label: "Hydration & Bottles",
    slug: "dubblin",
    sub: [
      { label: "Vacuum Flasks", q: "vacuum flask" },
      { label: "Travel Mugs", q: "travel mug" },
      { label: "Glass Bottles", q: "borosilicate" },
    ],
  },
  {
    Icon: Wine,
    label: "Luxury Barware",
    slug: "yera",
    sub: [
      { label: "Whiskey Glasses", q: "whiskey" },
      { label: "Tumblers", q: "tumbler" },
      { label: "Carafes & Sets", q: "carafe" },
    ],
  },
  {
    Icon: Flame,
    label: "Cookware & Cookers",
    slug: "pigeon",
    sub: [
      { label: "Pressure Cookers", q: "pressure cooker" },
      { label: "Non-stick Cookware", q: "non-stick" },
      { label: "Ceramic Cookers", q: "ceramic cooker" },
    ],
  },
  {
    Icon: Zap,
    label: "Smart Appliances",
    slug: "pigeon",
    sub: [
      { label: "Electric Kettles", q: "kettle" },
      { label: "Air Fryers", q: "air fryer" },
      { label: "Biryani Cookers", q: "biryani cooker" },
    ],
  },
  {
    Icon: Package,
    label: "Food Storage & Tiffins",
    slug: "dubblin",
    sub: [
      { label: "Insulated Lunchboxes", q: "lunchbox" },
      { label: "Tiffin Sets", q: "tiffin" },
      { label: "Food Containers", q: "container" },
    ],
  },
] as const;

// ── CartDrawer ────────────────────────────────────────────────────────────────

function CartDrawer({ count }: { count: number }) {
  const { items, subtotal, setQty, remove } = useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open cart"
          className="relative rounded-lg p-2 transition-colors hover:bg-muted"
        >
          <ShoppingCart className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-display text-base">
            Cart
            {count > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {count} {count === 1 ? "item" : "items"}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-muted">
              <ShoppingCart className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm font-medium">Your cart is empty</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add something from our catalogue to get started.
              </p>
            </div>
            <Link to="/shop">
              <Button size="sm" variant="outline">
                Browse products
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
              {items.map(({ variantId, qty, variant }) => (
                <li key={variantId} className="flex gap-3 py-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                    {variant.image_url ? (
                      <img
                        src={variant.image_url}
                        alt={variant.product_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-[10px] text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[13px] font-medium leading-snug">
                      {variant.product_name}
                    </p>
                    {variant.capacity_or_size && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {variant.capacity_or_size}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      {/* Qty stepper */}
                      <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background">
                        <button
                          type="button"
                          aria-label="Decrease"
                          onClick={() =>
                            qty <= 1 ? remove(variantId) : setQty(variantId, qty - 1)
                          }
                          className="rounded-l-lg p-1.5 transition-colors hover:bg-muted"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[1.5rem] text-center text-[13px] font-medium">
                          {qty}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase"
                          onClick={() => setQty(variantId, qty + 1)}
                          className="rounded-r-lg p-1.5 transition-colors hover:bg-muted"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="font-display text-sm font-bold">
                        {rupees(variant.selling_price * qty)}
                      </span>

                      <button
                        type="button"
                        aria-label="Remove"
                        onClick={() => remove(variantId)}
                        className="ml-auto rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-border px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-display text-lg font-bold">{rupees(subtotal)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Shipping &amp; taxes calculated at checkout
              </p>
              <div className="grid gap-2">
                <Link to="/checkout" className="block">
                  <Button className="w-full bg-gold text-white hover:bg-gold/90">
                    Checkout
                  </Button>
                </Link>
                <Link to="/cart" className="block">
                  <Button variant="outline" className="w-full">
                    View full cart
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── MegaMenu ──────────────────────────────────────────────────────────────────

function MegaMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div
      className="absolute inset-x-0 top-full z-50 border-b border-border bg-background shadow-xl"
      onMouseLeave={onClose}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-5 px-4 py-6 gap-px bg-border">
        {CATEGORIES.map((cat) => (
          <div key={cat.label} className="bg-background px-5 py-1">
            <button
              type="button"
              onClick={() => {
                navigate({ to: "/brand/$slug", params: { slug: cat.slug } });
                onClose();
              }}
              className="mb-3 flex items-center gap-2 text-left font-display text-[13px] font-semibold text-foreground transition-colors hover:text-gold"
            >
              <cat.Icon className="h-4 w-4 shrink-0 text-gold" />
              {cat.label}
            </button>
            <ul className="space-y-2">
              {cat.sub.map((s) => (
                <li key={s.label}>
                  <button
                    type="button"
                    onClick={() => {
                      navigate({ to: "/shop", search: { q: s.q } });
                      onClose();
                    }}
                    className="text-left text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom strip */}
      <div className="border-t border-border bg-muted/40">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-9 py-2.5 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">Swati Enterprises</span>
          <span>Authorized Master Distributor, Delhi NCR</span>
          <a
            href="tel:+919810533519"
            className="ml-auto flex items-center gap-1.5 font-medium text-foreground hover:text-gold"
          >
            <Phone className="h-3 w-3" />
            +91 98105 33519
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

export function Header() {
  const { user, isAdmin } = useAuth();
  const { count } = useCart();
  const { ids: wishIds } = useWishlist();
  const navigate = useNavigate();
  const { location } = useRouterState();

  const [term, setTerm] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);

  // Close overlays on navigation
  useEffect(() => {
    setMegaOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;
    navigate({ to: "/shop", search: { q: term.trim() } });
  };

  const activeBrand = location.pathname.startsWith("/brand/")
    ? location.pathname.slice("/brand/".length)
    : null;

  const wishCount = wishIds.length;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/98 backdrop-blur">

      {/* ── Layer 1: Announcement ticker ─────────────────────────────────── */}
      <div className="bg-gold">
        <div className="no-scrollbar flex items-center justify-center gap-6 overflow-x-auto px-4 py-1.5">
          {TICKER.map((msg, i) => (
            <span
              key={i}
              className={cn(
                "shrink-0 text-[11px] font-medium text-white sm:text-xs",
                i > 0 && "hidden sm:block",
              )}
            >
              {i > 0 && <span className="mr-6 text-white/40">·</span>}
              {msg}
            </span>
          ))}
        </div>
      </div>

      {/* ── Layer 2: Main nav ─────────────────────────────────────────────── */}
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">

        {/* Logo + mobile menu toggle */}
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-muted lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold font-display text-sm font-bold text-white shadow-sm">
              SE
            </span>
            <span className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="truncate font-display text-sm font-bold tracking-tight">
                Swati Enterprises
              </span>
              <span className="truncate text-[10px] text-muted-foreground">
                HomeLuxe &amp; Appliances
              </span>
            </span>
          </Link>
        </div>

        {/* Search */}
        <form onSubmit={submitSearch} className="relative hidden min-w-0 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search cookers, flasks, glassware, kettles…"
            className="w-full rounded-xl border border-border bg-muted/50 py-2.5 pl-9 pr-4 text-sm outline-none transition-colors focus:border-gold focus:bg-background"
          />
        </form>

        {/* Action icons */}
        <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {/* B2B phone — desktop only */}
          <a
            href="tel:+919810533519"
            className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground xl:flex"
          >
            <Phone className="h-3.5 w-3.5" />
            +91 98105 33519
          </a>

          {/* Wishlist */}
          <Link
            to="/account/wishlist"
            aria-label={wishCount > 0 ? `Wishlist (${wishCount})` : "Wishlist"}
            className="relative hidden rounded-lg p-2 transition-colors hover:bg-muted sm:block"
          >
            <Heart className="h-5 w-5" />
            {wishCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-pigeon px-1 text-[10px] font-bold text-white">
                {wishCount > 9 ? "9+" : wishCount}
              </span>
            )}
          </Link>

          {/* Account */}
          <Link
            to={user ? "/account" : "/auth"}
            aria-label="Account"
            className="rounded-lg p-2 transition-colors hover:bg-muted"
          >
            <User className="h-5 w-5" />
          </Link>

          {/* Cart drawer */}
          <CartDrawer count={count} />

          {isAdmin && (
            <Link
              to="/admin"
              className="ml-1 hidden rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/10 lg:block"
            >
              Admin
            </Link>
          )}
        </nav>
      </div>

      {/* ── Layer 3: Brand selector + mega-menu (desktop only) ───────────── */}
      <div
        className="relative hidden border-t border-border lg:block"
        onMouseLeave={() => setMegaOpen(false)}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-1.5">

          {/* Categories trigger */}
          <button
            type="button"
            onMouseEnter={() => setMegaOpen(true)}
            onClick={() => setMegaOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              megaOpen
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Categories
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform duration-200", megaOpen && "rotate-180")}
            />
          </button>

          <div className="mx-2 h-4 w-px bg-border" />

          {/* "All Portfolios" pill */}
          <Link
            to="/shop"
            className={cn(
              "rounded-full px-3.5 py-1 text-sm font-medium transition-colors",
              !activeBrand
                ? "bg-gold/10 text-gold ring-1 ring-inset ring-gold/30"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            All Portfolios
          </Link>

          {/* Per-brand pills */}
          {BRANDS.map((b) => (
            <Link
              key={b.slug}
              to="/brand/$slug"
              params={{ slug: b.slug }}
              className={cn(
                "rounded-full px-3.5 py-1 text-sm font-medium transition-colors",
                activeBrand === b.slug ? b.active : "text-muted-foreground hover:text-foreground",
              )}
            >
              {b.label}
            </Link>
          ))}

          {/* Utility links pushed to right */}
          <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
            <Link
              to="/shop"
              search={{ sort: "discount" }}
              className="font-medium text-pigeon transition-colors hover:text-pigeon/80"
            >
              🔥 Deals
            </Link>
            <Link to="/about" className="transition-colors hover:text-foreground">
              About
            </Link>
            <Link to="/contact" className="transition-colors hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>

        {/* Mega-menu dropdown */}
        <MegaMenu open={megaOpen} onClose={() => setMegaOpen(false)} />
      </div>

      {/* ── Layer 4: Mobile menu ──────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="px-4 pb-5 pt-4 space-y-4">

            {/* Mobile search */}
            <form onSubmit={submitSearch} className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search products…"
                className="w-full rounded-xl border border-border bg-muted/50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-gold"
              />
            </form>

            {/* Brand filter pills */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Shop by Brand
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/shop"
                  className={cn(
                    "rounded-full px-3.5 py-1 text-xs font-medium transition-colors",
                    !activeBrand
                      ? "bg-gold text-white"
                      : "border border-border text-muted-foreground hover:border-foreground/30",
                  )}
                >
                  All Portfolios
                </Link>
                {BRANDS.map((b) => (
                  <Link
                    key={b.slug}
                    to="/brand/$slug"
                    params={{ slug: b.slug }}
                    className={cn(
                      "rounded-full px-3.5 py-1 text-xs font-medium transition-colors",
                      activeBrand === b.slug
                        ? b.activeMobile
                        : "border border-border text-muted-foreground hover:border-foreground/30",
                    )}
                  >
                    {b.label}
                  </Link>
                ))}
              </div>
            </div>

            <Separator />

            {/* Category links */}
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Categories
              </p>
              <div className="space-y-0.5">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.label}
                    to="/brand/$slug"
                    params={{ slug: cat.slug }}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <cat.Icon className="h-4 w-4 shrink-0 text-gold" />
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>

            <Separator />

            {/* Utility */}
            <div className="space-y-0.5">
              <Link
                to="/account/wishlist"
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                <Heart className="h-4 w-4" />
                Wishlist{wishCount > 0 ? ` (${wishCount})` : ""}
              </Link>
              <a
                href="tel:+919810533519"
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Phone className="h-4 w-4" />
                Dealer Hotline: +91 98105 33519
              </a>
              <Link
                to="/shop"
                search={{ sort: "discount" }}
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-pigeon transition-colors hover:bg-muted"
              >
                🔥 Deals
              </Link>
              <Link
                to="/about"
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                About
              </Link>
              <Link
                to="/contact"
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Contact
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold/10"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
