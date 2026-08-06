import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useWishlist() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from("wishlist_items").select("product_variant_id");
      if (error) throw error;
      return (data ?? []).map((r) => r.product_variant_id as string);
    },
  });

  const ids = query.data ?? [];

  const toggle = useMutation({
    mutationFn: async (variantId: string) => {
      if (!user) throw new Error("SIGN_IN_REQUIRED");
      if (ids.includes(variantId)) {
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("customer_id", user.id)
          .eq("product_variant_id", variantId);
        if (error) throw error;
        return "removed" as const;
      }
      const { error } = await supabase
        .from("wishlist_items")
        .insert({ customer_id: user.id, product_variant_id: variantId });
      if (error) throw error;
      return "added" as const;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(result === "added" ? "Saved to wishlist" : "Removed from wishlist");
    },
    onError: (error: Error) => {
      if (error.message === "SIGN_IN_REQUIRED") toast.error("Sign in to use your wishlist");
      else toast.error("Could not update wishlist");
    },
  });

  return {
    ids,
    isWishlisted: (id: string) => ids.includes(id),
    toggle: (id: string) => toggle.mutate(id),
    loading: query.isLoading,
  };
}
