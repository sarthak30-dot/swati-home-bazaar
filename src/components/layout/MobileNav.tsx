import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, ShoppingCart, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

/**
 * Four-item bottom bar for phones. The shop's traffic is mostly mobile, and
 * the cart and categories should always be one thumb-tap away.
 */
export function MobileNav() {
  const { user } = useAuth();
  const { count } = useCart();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const items = [
    { to: "/", label: "Home", icon: Home, active: pathname === "/" },
    {
      to: "/shop",
      label: "Shop",
      icon: LayoutGrid,
      active: pathname.startsWith("/shop") || pathname.startsWith("/department"),
    },
    { to: "/cart", label: "Cart", icon: ShoppingCart, active: pathname.startsWith("/cart") },
    {
      to: user ? "/account" : "/auth",
      label: user ? "Account" : "Sign in",
      icon: User,
      active: pathname.startsWith("/account") || pathname.startsWith("/auth"),
    },
  ] as const;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map(({ to, label, icon: Icon, active }) => (
          <li key={label}>
            <Link
              to={to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                active ? "text-gold" : "text-muted-foreground",
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {label === "Cart" && count > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
