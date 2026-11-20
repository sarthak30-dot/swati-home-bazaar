import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchBrands, fetchCategories } from "@/lib/catalog";
import {
  createProductWithVariant,
  createVariant,
  type NewVariantInput,
} from "@/lib/admin-inventory";

/**
 * Two jobs, one form: create a brand-new product with its first sellable
 * variant, or add another variant (a second size/colour) to a product that
 * already exists. They share every price/stock field, so splitting them into
 * two dialogs would duplicate the whole form for the sake of three inputs.
 */
export type VariantFormTarget =
  { kind: "product" } | { kind: "variant"; productId: string; productName: string };

const schema = z.object({
  sku_id: z
    .string()
    .trim()
    .min(2, "SKU ID is required")
    .max(40)
    // The storage path for a SKU's photo is `${sku_id}.${ext}`, so a slash or
    // space here would create a nested or unreachable object in the bucket.
    .regex(/^[A-Za-z0-9._-]+$/, "SKU ID: use letters, numbers, dot, dash or underscore"),
  mrp: z.number().positive("MRP must be greater than zero"),
  selling_price: z.number().positive().nullable(),
  cost_price: z.number().positive().nullable(),
  stock_qty: z.number().int().min(0, "Stock cannot be negative"),
  pack_qty: z.number().int().positive().nullable(),
});

const EMPTY = {
  name: "",
  description: "",
  brandId: "",
  categoryId: "",
  sku_id: "",
  variant_code: "",
  capacity: "",
  color: "",
  mrp: "",
  selling_price: "",
  cost_price: "",
  stock_qty: "0",
  pack_qty: "",
};

function num(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function VariantFormDialog({
  target,
  onClose,
  onSaved,
}: {
  target: VariantFormTarget | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);

  const isNewProduct = target?.kind === "product";

  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: fetchBrands });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  // Categories may be brand-specific or shared (brand_id is nullable), so show
  // the selected brand's own categories plus the shared ones.
  const visibleCategories = (categories ?? []).filter(
    (c) => !c.brand_id || c.brand_id === form.brandId,
  );

  const set =
    (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const close = () => {
    setForm({ ...EMPTY });
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;

    const parsed = schema.safeParse({
      sku_id: form.sku_id,
      mrp: num(form.mrp) ?? 0,
      selling_price: num(form.selling_price),
      cost_price: num(form.cost_price),
      stock_qty: num(form.stock_qty) ?? 0,
      pack_qty: num(form.pack_qty),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the SKU details");
      return;
    }
    const selling = parsed.data.selling_price;
    if (selling != null && selling > parsed.data.mrp) {
      toast.error("Selling price cannot exceed MRP");
      return;
    }
    if (isNewProduct && (!form.name.trim() || !form.brandId)) {
      toast.error("A new product needs a name and a brand");
      return;
    }

    const variant: NewVariantInput = {
      skuId: parsed.data.sku_id,
      variantCode: form.variant_code.trim() || null,
      capacity: form.capacity.trim() || null,
      color: form.color.trim() || null,
      mrp: parsed.data.mrp,
      costPrice: parsed.data.cost_price,
      sellingPrice: selling,
      stockQty: parsed.data.stock_qty,
      packQty: parsed.data.pack_qty,
    };

    setBusy(true);
    try {
      if (target.kind === "product") {
        await createProductWithVariant({
          brandId: form.brandId,
          categoryId: form.categoryId || null,
          name: form.name.trim(),
          description: form.description.trim() || null,
          variant,
        });
        toast.success("Product created");
      } else {
        await createVariant(target.productId, variant);
        toast.success("SKU added");
      }
      onSaved();
      close();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      toast.error(
        message.includes("duplicate key") || message.includes("23505")
          ? "That SKU ID is already in use"
          : "Could not save — admin access required",
      );
    } finally {
      setBusy(false);
    }
  };

  const field = (
    k: keyof typeof EMPTY,
    label: string,
    opts: { placeholder?: string; mode?: "numeric" | "decimal"; required?: boolean } = {},
  ) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground" htmlFor={`vf-${k}`}>
        {label}
        {opts.required ? " *" : ""}
      </label>
      <input
        id={`vf-${k}`}
        value={form[k]}
        onChange={set(k)}
        {...(opts.placeholder ? { placeholder: opts.placeholder } : {})}
        {...(opts.mode ? { inputMode: opts.mode } : {})}
        className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold"
      />
    </div>
  );

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isNewProduct ? "New product" : "Add SKU"}
          </DialogTitle>
          <DialogDescription>
            {isNewProduct
              ? "Creates the product and its first sellable SKU."
              : `Another size or colour of ${target?.kind === "variant" ? target.productName : ""}.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {isNewProduct && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                {field("name", "Product name", { required: true })}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground" htmlFor="vf-brand">
                  Brand *
                </label>
                <select
                  id="vf-brand"
                  value={form.brandId}
                  onChange={set("brandId")}
                  className="mt-1 w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">Select a brand</option>
                  {(brands ?? []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground" htmlFor="vf-category">
                  Category
                </label>
                <select
                  id="vf-category"
                  value={form.categoryId}
                  onChange={set("categoryId")}
                  className="mt-1 w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">Uncategorised</option>
                  {visibleCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor="vf-description"
                >
                  Description
                </label>
                <textarea
                  id="vf-description"
                  value={form.description}
                  onChange={set("description")}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold"
                />
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            {field("sku_id", "SKU ID", { placeholder: "PGN-00231", required: true })}
            {field("variant_code", "Variant code", { placeholder: "19000338" })}
            {field("capacity", "Capacity / size", { placeholder: "5L" })}
            {field("color", "Colour", { placeholder: "Steel" })}
            {field("mrp", "MRP", { mode: "decimal", required: true })}
            {field("selling_price", "Selling price", { mode: "decimal", placeholder: "= MRP" })}
            {field("cost_price", "Cost price", { mode: "decimal" })}
            {field("stock_qty", "Stock qty", { mode: "numeric", required: true })}
            {field("pack_qty", "Pack / carton qty", { mode: "numeric" })}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={close}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? "Saving…" : isNewProduct ? "Create product" : "Add SKU"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
