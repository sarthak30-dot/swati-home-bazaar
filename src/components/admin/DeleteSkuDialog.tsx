import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { countVariantsForProduct, deleteProduct, deleteVariant } from "@/lib/admin-inventory";

export type DeleteTarget = {
  variantId: string;
  productId: string;
  productName: string;
  skuId: string;
};

export function DeleteSkuDialog({
  target,
  onClose,
  onDeleted,
}: {
  target: DeleteTarget | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [busy, setBusy] = useState(false);

  // Whether this is the product's last SKU decides what deleting actually
  // means: remove one size, or retire the product entirely.
  const { data: siblingCount } = useQuery({
    queryKey: ["variant-count", target?.productId],
    queryFn: () => countVariantsForProduct(target?.productId ?? ""),
    enabled: Boolean(target),
  });

  const isLast = siblingCount === 1;

  const run = async (scope: "variant" | "product") => {
    if (!target) return;
    setBusy(true);
    try {
      if (scope === "product") await deleteProduct(target.productId);
      else await deleteVariant(target.variantId);
      toast.success(scope === "product" ? "Product deleted" : "SKU deleted");
      onDeleted();
      onClose();
    } catch {
      toast.error("Could not delete — admin access required");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog open={Boolean(target)} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">Delete {target?.skuId}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">{target?.productName}</span> — this
                removes the SKU from the catalogue, along with any cart and wishlist entries
                pointing at it.
              </p>
              <p>
                Past orders are unaffected: each order line keeps its own copy of the product name,
                SKU and price, so invoices and order history still read correctly.
              </p>
              {isLast && (
                <p className="rounded-xl bg-muted/60 p-3 text-foreground">
                  This is the product&rsquo;s only SKU. Deleting it leaves a product with nothing to
                  sell — delete the whole product instead, or deactivate it to hide it from the
                  store while keeping the record.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          {isLast && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run("product")}
              className="rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Delete product
            </button>
          )}
          <AlertDialogAction
            disabled={busy}
            onClick={(e) => {
              e.preventDefault();
              run("variant");
            }}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {busy ? "Deleting…" : "Delete SKU"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
