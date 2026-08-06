import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchShop, PAGE_SIZE } from "@/lib/catalog";
import { rupees } from "@/lib/format";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

type Draft = { selling_price: string; stock_qty: string };

function AdminProducts() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [csvBusy, setCsvBusy] = useState(false);

  const { data, isFetching } = useQuery({
    queryKey: ["admin-products", q, page],
    placeholderData: keepPreviousData,
    queryFn: () => fetchShop({ ...(q ? { q } : {}), page, sort: "new" }),
  });

  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const save = async (id: string) => {
    const draft = drafts[id];
    if (!draft) return;
    const price = Number(draft.selling_price);
    const stock = Number(draft.stock_qty);
    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(stock) || stock < 0) {
      toast.error("Enter a valid price and stock");
      return;
    }
    const { error } = await supabase
      .from("product_variants")
      .update({ selling_price: price, stock_qty: Math.round(stock) })
      .eq("id", id);
    if (error) {
      toast.error("Update failed — admin access required");
      return;
    }
    toast.success("SKU updated");
    setDrafts((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const importCsv = async (file: File) => {
    setCsvBusy(true);
    try {
      const text = await file.text();
      const rows = text
        .split(/\r?\n/)
        .map((r) => r.trim())
        .filter(Boolean);
      const header = rows.shift()?.toLowerCase().split(",").map((h) => h.trim()) ?? [];
      const skuIdx = header.indexOf("sku_id");
      const priceIdx = header.indexOf("selling_price");
      const stockIdx = header.indexOf("stock_qty");
      if (skuIdx === -1) {
        toast.error("CSV needs a sku_id column");
        return;
      }
      let updated = 0;
      let failed = 0;
      for (const row of rows) {
        const cols = row.split(",").map((c) => c.trim());
        const sku = cols[skuIdx];
        if (!sku) continue;
        const patch: { selling_price?: number; stock_qty?: number } = {};
        if (priceIdx > -1 && cols[priceIdx]) patch.selling_price = Number(cols[priceIdx]);
        if (stockIdx > -1 && cols[stockIdx]) patch.stock_qty = Math.round(Number(cols[stockIdx]));
        if (!Object.keys(patch).length) continue;
        const { error } = await supabase.from("product_variants").update(patch as never).eq("sku_id", sku);
        if (error) failed += 1;
        else updated += 1;
      }
      toast[failed ? "warning" : "success"](
        `${updated} SKUs updated${failed ? `, ${failed} failed` : ""}`,
      );
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch {
      toast.error("Could not read that CSV");
    } finally {
      setCsvBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search by product name"
          className="w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-gold"
        />
        <label className="shrink-0 cursor-pointer rounded-xl border border-gold px-4 py-2.5 text-center text-sm font-semibold text-gold">
          {csvBusy ? "Importing..." : "Bulk update via CSV"}
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={csvBusy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importCsv(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        CSV columns: <code>sku_id</code>, <code>selling_price</code>, <code>stock_qty</code>.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">SKU</th>
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
              return (
                <tr key={item.id} className="border-t border-border">
                  <td className="max-w-[280px] p-3">
                    <span className="line-clamp-2 font-medium">{item.product_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.brand_name}
                      {item.capacity_or_size ? ` · ${item.capacity_or_size}` : ""}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{item.sku_id}</td>
                  <td className="p-3">{rupees(item.mrp)}</td>
                  <td className="p-3">
                    <input
                      value={draft.selling_price}
                      inputMode="decimal"
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [item.id]: { ...draft, selling_price: e.target.value } }))
                      }
                      className="w-24 rounded-lg border border-border px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      value={draft.stock_qty}
                      inputMode="numeric"
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [item.id]: { ...draft, stock_qty: e.target.value } }))
                      }
                      className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      disabled={!dirty}
                      onClick={() => save(item.id)}
                      className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-30"
                    >
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
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
    </div>
  );
}
