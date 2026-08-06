import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useWishlist } from "@/hooks/useWishlist";
import { fetchVariantsByIds } from "@/lib/catalog";
import { ProductCard, ProductCardSkeleton } from "@/components/store/ProductCard";

export const Route = createFileRoute("/account/wishlist")({
  component: Wishlist,
});

function Wishlist() {
  const { ids, loading } = useWishlist();

  const { data, isLoading } = useQuery({
    queryKey: ["wishlist-items", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: () => fetchVariantsByIds(ids),
  });

  if (loading || (ids.length > 0 && isLoading)) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!ids.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="font-display text-lg font-semibold">Your wishlist is empty</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap the heart on any product to save it here.
        </p>
        <Link to="/shop" className="mt-4 inline-block text-sm font-semibold text-gold">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {(data ?? []).map((item) => (
        <ProductCard key={item.id} item={item} />
      ))}
    </div>
  );
}
