import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My account — Swati Enterprises" },
      { name: "description", content: "Manage your Swati Enterprises orders, addresses and wishlist." },
      { property: "og:title", content: "My account — Swati Enterprises" },
      { property: "og:description", content: "Orders, addresses and wishlist in one place." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountLayout,
});

const TABS = [
  { to: "/account", label: "Profile", exact: true },
  { to: "/account/orders", label: "Orders", exact: false },
  { to: "/account/addresses", label: "Addresses", exact: false },
  { to: "/account/wishlist", label: "Wishlist", exact: false },
] as const;

function AccountLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <h1 className="truncate font-display text-2xl font-bold">My account</h1>
        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate({ to: "/", replace: true });
          }}
          className="shrink-0 rounded-xl border border-border px-4 py-2 text-sm font-semibold"
        >
          Sign out
        </button>
      </div>

      <nav className="no-scrollbar mt-6 flex gap-2 overflow-x-auto border-b border-border pb-2">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.to : pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-sm font-medium",
                active ? "bg-gold-tint text-gold" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
