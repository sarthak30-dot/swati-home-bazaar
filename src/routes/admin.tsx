import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Swati Enterprises" },
      { name: "description", content: "Internal dashboard for catalogue, orders and coupons." },
      { property: "og:title", content: "Admin — Swati Enterprises" },
      { property: "og:description", content: "Internal operations dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/products", label: "Inventory", exact: false },
  { to: "/admin/orders", label: "Orders", exact: false },
  { to: "/admin/coupons", label: "Coupons", exact: false },
] as const;

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-muted-foreground">Loading...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is limited to Swati Enterprises staff accounts.
        </p>
        <Link to="/" className="mt-6 inline-block text-sm font-semibold text-gold">
          Back to store
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Store admin</h1>
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
