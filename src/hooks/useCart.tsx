import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchVariantsByIds, type CatalogVariant } from "@/lib/catalog";

export type CartLine = { variantId: string; qty: number };

const GUEST_KEY = "swati_cart_v1";

function readGuestCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function writeGuestCart(lines: CartLine[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GUEST_KEY, JSON.stringify(lines));
}

type CartContextValue = {
  lines: CartLine[];
  items: (CartLine & { variant: CatalogVariant })[];
  count: number;
  subtotal: number;
  loading: boolean;
  add: (variantId: string, qty?: number) => Promise<void>;
  setQty: (variantId: string, qty: number) => Promise<void>;
  remove: (variantId: string) => Promise<void>;
  clear: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [guestLines, setGuestLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setGuestLines(readGuestCart());
    setHydrated(true);
  }, []);

  const dbCart = useQuery({
    queryKey: ["cart", user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<CartLine[]> => {
      const { data, error } = await supabase.from("cart_items").select("product_variant_id, qty");
      if (error) throw error;
      return (data ?? []).map((r) => ({ variantId: r.product_variant_id as string, qty: r.qty as number }));
    },
  });

  // Merge the guest cart into the account cart on sign-in.
  useEffect(() => {
    if (!user || !hydrated) return;
    const pending = readGuestCart();
    if (!pending.length) return;
    (async () => {
      for (const line of pending) {
        await supabase
          .from("cart_items")
          .upsert(
            { customer_id: user.id, product_variant_id: line.variantId, qty: line.qty },
            { onConflict: "customer_id,product_variant_id" },
          );
      }
      writeGuestCart([]);
      setGuestLines([]);
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    })();
  }, [user, hydrated, queryClient]);

  const lines = user ? (dbCart.data ?? []) : guestLines;

  const variantsQuery = useQuery({
    queryKey: ["cart-variants", lines.map((l) => l.variantId).sort().join(",")],
    enabled: lines.length > 0,
    queryFn: () => fetchVariantsByIds(lines.map((l) => l.variantId)),
  });

  const items = useMemo(() => {
    const map = new Map((variantsQuery.data ?? []).map((v) => [v.id, v]));
    return lines
      .map((l) => ({ ...l, variant: map.get(l.variantId) }))
      .filter((l): l is CartLine & { variant: CatalogVariant } => Boolean(l.variant));
  }, [lines, variantsQuery.data]);

  const subtotal = items.reduce((sum, i) => sum + Number(i.variant.selling_price) * i.qty, 0);

  const persistGuest = useCallback((next: CartLine[]) => {
    writeGuestCart(next);
    setGuestLines(next);
  }, []);

  const add = useCallback(
    async (variantId: string, qty = 1) => {
      if (user) {
        const existing = lines.find((l) => l.variantId === variantId);
        const nextQty = (existing?.qty ?? 0) + qty;
        await supabase
          .from("cart_items")
          .upsert(
            { customer_id: user.id, product_variant_id: variantId, qty: nextQty },
            { onConflict: "customer_id,product_variant_id" },
          );
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
      } else {
        const next = [...guestLines];
        const idx = next.findIndex((l) => l.variantId === variantId);
        if (idx >= 0) next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        else next.push({ variantId, qty });
        persistGuest(next);
      }
    },
    [user, lines, guestLines, persistGuest, queryClient],
  );

  const setQty = useCallback(
    async (variantId: string, qty: number) => {
      if (qty < 1) return;
      if (user) {
        await supabase
          .from("cart_items")
          .update({ qty })
          .eq("customer_id", user.id)
          .eq("product_variant_id", variantId);
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
      } else {
        persistGuest(guestLines.map((l) => (l.variantId === variantId ? { ...l, qty } : l)));
      }
    },
    [user, guestLines, persistGuest, queryClient],
  );

  const remove = useCallback(
    async (variantId: string) => {
      if (user) {
        await supabase
          .from("cart_items")
          .delete()
          .eq("customer_id", user.id)
          .eq("product_variant_id", variantId);
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
      } else {
        persistGuest(guestLines.filter((l) => l.variantId !== variantId));
      }
    },
    [user, guestLines, persistGuest, queryClient],
  );

  const clear = useCallback(async () => {
    if (user) {
      await supabase.from("cart_items").delete().eq("customer_id", user.id);
      await queryClient.invalidateQueries({ queryKey: ["cart"] });
    } else {
      persistGuest([]);
    }
  }, [user, persistGuest, queryClient]);

  const value: CartContextValue = {
    lines,
    items,
    count: lines.reduce((n, l) => n + l.qty, 0),
    subtotal,
    loading: (user ? dbCart.isLoading : !hydrated) || (lines.length > 0 && variantsQuery.isLoading),
    add,
    setQty,
    remove,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
