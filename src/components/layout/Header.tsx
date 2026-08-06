import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

const BRAND_LINKS = [
  { slug: "pigeon", name: "Pigeon" },
  { slug: "dubblin", name: "Dubblin" },
  { slug: "yera", name: "Yera" },
];

export function Header() {
  const { user, isAdmin } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/shop", search: { q: term || undefined } });
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="bg-gold text-center text-[11px] font-medium text-white sm:text-xs">
        <p className="py-1.5">Free delivery on orders above Rs. 999 &middot; Delhi NCR same-week dispatch</p>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            aria-label="Menu"
            className="shrink-0 lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold font-display text-sm font-bold text-white">
              SE
            </span>
            <span className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="truncate font-display text-sm font-bold">Swati Enterprises</span>
              <span className="truncate text-[10px] text-muted-foreground">Home &amp; Kitchen, Delhi</span>
            </span>
          </Link>
        </div>

        <form onSubmit={submitSearch} className="relative hidden min-w-0 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search cookers, bottles, glassware..."
            className="w-full rounded-xl border border-border bg-muted/60 py-2 pl-9 pr-3 text-sm outline-none focus:border-gold"
          />
        </form>

        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            to="/account/wishlist"
            className="hidden rounded-lg p-2 hover:bg-muted sm:block"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
          </Link>
          <Link
            to={user ? "/account" : "/auth"}
            className="rounded-lg p-2 hover:bg-muted"
            aria-label="Account"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link to="/cart" className="relative rounded-lg p-2 hover:bg-muted" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>

      <div className="hidden border-t border-border lg:block">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-2 text-sm font-medium">
          <Link to="/shop" className="hover:text-gold">
            All products
          </Link>
          {BRAND_LINKS.map((b) => (
            <Link key={b.slug} to="/brand/$slug" params={{ slug: b.slug }} className="hover:text-gold">
              {b.name}
            </Link>
          ))}
          <Link to="/shop" search={{ sort: "discount" }} className="hover:text-gold">
            Deals
          </Link>
          <Link to="/about" className="ml-auto text-muted-foreground hover:text-gold">
            About
          </Link>
          <Link to="/contact" className="text-muted-foreground hover:text-gold">
            Contact
          </Link>
          {isAdmin && (
            <Link to="/admin" className="font-semibold text-gold">
              Admin
            </Link>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="space-y-3 border-t border-border px-4 py-4 lg:hidden">
          <form onSubmit={submitSearch} className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search products"
              className="w-full rounded-xl border border-border bg-muted/60 py-2 pl-9 pr-3 text-sm outline-none focus:border-gold"
            />
          </form>
          <div className="grid gap-2 text-sm font-medium">
            <Link to="/shop" onClick={() => setMenuOpen(false)}>
              All products
            </Link>
            {BRAND_LINKS.map((b) => (
              <Link
                key={b.slug}
                to="/brand/$slug"
                params={{ slug: b.slug }}
                onClick={() => setMenuOpen(false)}
              >
                {b.name}
              </Link>
            ))}
            <Link to="/account/wishlist" onClick={() => setMenuOpen(false)}>
              Wishlist
            </Link>
            <Link to="/about" onClick={() => setMenuOpen(false)}>
              About
            </Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)}>
              Contact
            </Link>
            {isAdmin && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="text-gold">
                Admin
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
