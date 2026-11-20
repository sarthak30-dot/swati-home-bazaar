import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchBrands, fetchCategories } from "@/lib/catalog";
import {
  ADMIN_PAGE_SIZE,
  countLowStock,
  fetchAdminVariants,
  setProductActive,
  updateVariant,
} from "@/lib/admin-inventory";
import { LOW_STOCK_THRESHOLD, rupees } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BulkPricePanel } from "@/components/admin/BulkPricePanel";
import { CsvImportPanel } from "@/components/admin/CsvImportPanel";
import { DeleteSkuDialog, type DeleteTarget } from "@/components/admin/DeleteSkuDialog";
import { VariantFormDialog, type VariantFormTarget } from "@/components/admin/VariantFormDialog";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

type Draft = { selling_price: string; stock_qty: string };

function AdminProducts() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [brandSlug, setBrandSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [uploadBusy, setUploadBusy] = useState<Set<string>>(new Set());
  const [formTarget, setFormTarget] = useState<VariantFormTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const filters = {
    ...(q ? { q } : {}),
    ...(brandSlug ? { brandSlug } : {}),
    ...(categorySlug ? { categorySlug } : {}),
    ...(lowStockOnly ? { lowStockOnly } : {}),
    page,
  };

  const { data, isFetching } = useQuery({
    queryKey: ["admin-products", q, brandSlug, categorySlug, lowStockOnly, page],
    placeholderData: keepPreviousData,
    queryFn: () => fetchAdminVariants(filters),
  });

  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: fetchBrands });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: lowStockCount } = useQuery({
    queryKey: ["admin-low-stock-count"],
    queryFn: countLowStock,
  });

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));

  /**
   * Every storefront cache that reads the catalogue, so a price, stock or
   * visibility change in admin is reflected without a reload. Keys are
   * prefixes — React Query matches partially, so ["shop"] also clears
   * ["shop", filters].
   */
  const refresh = () => {
    for (const key of [
      "admin-products",
      "admin-low-stock-count",
      "admin-stats",
      // A CSV import can create categories (and a future brand import,
      // brands), so the filter dropdowns and the new-product dialog have to
      // re-read these or the new category is invisible until a page reload.
      "categories",
      "brands",
      "shop",
      "rail",
      "product",
      "siblings",
      "related",
      "brand-products",
      "brand-best",
      "category-counts",
    ]) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };

  const resetToFirstPage = () => setPage(1);

  const save = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    const price = Number(draft.selling_price);
    const stock = Number(draft.stock_qty);
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0) {
      toast.error("Enter a valid price and stock");
      return;
    }
    try {
      await updateVariant(id, { selling_price: price, stock_qty: Math.round(stock) });
      toast.success("SKU updated");
      setDrafts((d) => {
        const next = { ...d };
        delete next[id];
        return next;
      });
      refresh();
    } catch {
      toast.error("Update failed — admin access required");
    }
  };

  const toggleActive = async (productId: string, next: boolean) => {
    try {
      await setProductActive(productId, next);
      toast.success(next ? "Product is live" : "Product hidden from the store");
      refresh();
    } catch {
      toast.error("Could not change visibility — admin access required");
    }
  };

  const uploadImage = async (id: string, skuId: string, file: File) => {
    setUploadBusy((prev) => new Set(prev).add(id));
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${skuId}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(path);
      const { error: updateErr } = await supabase
        .from("product_variants")
        .update({ image_url: publicUrl })
        .eq("id", id);
      if (updateErr) throw updateErr;
      toast.success("Image saved");
      refresh();
    } catch {
      toast.error("Upload failed — check storage bucket permissions");
    } finally {
      setUploadBusy((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const visibleCategories = (categories ?? []).filter((c) => {
    if (!brandSlug) return true;
    const brandId = brands?.find((b) => b.slug === brandSlug)?.id;
    return !c.brand_id || c.brand_id === brandId;
  });

  return (
    <div className="space-y-5">
      {/* --- filters --- */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            resetToFirstPage();
          }}
          placeholder="Search by product name, SKU ID or variant code"
          className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
        <select
          value={brandSlug}
          aria-label="Filter by brand"
          onChange={(e) => {
            setBrandSlug(e.target.value);
            setCategorySlug("");
            resetToFirstPage();
          }}
          className="rounded-xl border border-border bg-transparent px-3 py-2.5 text-sm"
        >
          <option value="">All brands</option>
          {(brands ?? []).map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={categorySlug}
          aria-label="Filter by category"
          onChange={(e) => {
            setCategorySlug(e.target.value);
            resetToFirstPage();
          }}
          className="rounded-xl border border-border bg-transparent px-3 py-2.5 text-sm"
        >
          <option value="">All categories</option>
          {visibleCategories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setFormTarget({ kind: "product" })}
          className="rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-white"
        >
          New product
        </button>
      </div>

      {/* --- low stock view + tools --- */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setLowStockOnly((v) => !v);
            resetToFirstPage();
          }}
          aria-pressed={lowStockOnly}
          className={cn(
            "rounded-xl border px-4 py-2.5 text-sm font-semibold",
            lowStockOnly
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-border",
          )}
        >
          Low stock
          {typeof lowStockCount === "number" ? ` (${lowStockCount})` : ""}
        </button>
        <BulkPricePanel onApplied={refresh} />
      </div>

      <CsvImportPanel onImported={refresh} />

      {lowStockOnly && (
        <p className="text-xs text-muted-foreground">
          Showing SKUs under {LOW_STOCK_THRESHOLD} units, lowest first.
        </p>
      )}

      {/* --- table --- */}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[840px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Image</th>
              <th className="p-3">MRP</th>
              <th className="p-3">Selling price</th>
              <th className="p-3">Stock</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className={isFetching ? "opacity-60" : ""}>
            {(data?.items ?? []).map((item) => {
              const draft = drafts[item.id] ?? {
                selling_price: String(item.selling_price),
                stock_qty: String(item.stock_qty),
              };
              const dirty = Boolean(drafts[item.id]);
              const low = item.stock_qty < LOW_STOCK_THRESHOLD;
              return (
                <tr
                  key={item.id}
                  className={cn("border-t border-border", low && "bg-destructive/5")}
                >
                  <td className="max-w-[280px] p-3">
                    <span className="line-clamp-2 font-medium">{item.product_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.brand_name}
                      {item.capacity_or_size ? ` · ${item.capacity_or_size}` : ""}
                    </span>
                    {!item.is_active && (
                      <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{item.sku_id}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt=""
                          className="h-9 w-9 rounded-lg border border-border object-cover"
                        />
                      )}
                      <label className="cursor-pointer text-xs font-medium text-gold hover:underline">
                        {uploadBusy.has(item.id)
                          ? "Uploading…"
                          : item.image_url
                            ? "Replace"
                            : "Upload"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadBusy.has(item.id)}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadImage(item.id, item.sku_id, file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </td>
                  <td className="p-3">{rupees(item.mrp)}</td>
                  <td className="p-3">
                    <input
                      value={draft.selling_price}
                      inputMode="decimal"
                      aria-label={`Selling price for ${item.sku_id}`}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [item.id]: { ...draft, selling_price: e.target.value },
                        }))
                      }
                      className="w-24 rounded-lg border border-border px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      value={draft.stock_qty}
                      inputMode="numeric"
                      aria-label={`Stock for ${item.sku_id}`}
                      onChange={(e) =>
                        setDrafts((d) => ({
                          ...d,
                          [item.id]: { ...draft, stock_qty: e.target.value },
                        }))
                      }
                      className={cn(
                        "w-20 rounded-lg border px-2 py-1.5 text-sm",
                        low ? "border-destructive font-semibold text-destructive" : "border-border",
                      )}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col items-start gap-1.5">
                      <button
                        type="button"
                        disabled={!dirty}
                        onClick={() => save(item.id)}
                        className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-30"
                      >
                        Save
                      </button>
                      <div className="flex gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() =>
                            setFormTarget({
                              kind: "variant",
                              productId: item.product_id,
                              productName: item.product_name,
                            })
                          }
                          className="font-medium text-muted-foreground hover:text-foreground"
                        >
                          + SKU
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleActive(item.product_id, !item.is_active)}
                          className="font-medium text-muted-foreground hover:text-foreground"
                        >
                          {item.is_active ? "Hide" : "Show"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              variantId: item.id,
                              productId: item.product_id,
                              productName: item.product_name,
                              skuId: item.sku_id,
                            })
                          }
                          className="font-medium text-destructive hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!isFetching && !data?.items.length && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">
                  {lowStockOnly
                    ? "Nothing is running low — every SKU is above the threshold."
                    : "No SKUs match these filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {pages} · {total.toLocaleString("en-IN")} SKUs
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          Next
        </button>
      </div>

      <VariantFormDialog
        target={formTarget}
        onClose={() => setFormTarget(null)}
        onSaved={refresh}
      />
      <DeleteSkuDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={refresh}
      />
    </div>
  );
}
