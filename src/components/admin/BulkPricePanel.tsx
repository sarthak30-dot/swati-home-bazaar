import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchBrands, fetchCategories } from "@/lib/catalog";
import {
  applyBulkPrice,
  previewBulkPrice,
  type BulkPriceMode,
  type BulkPricePreview,
  type BulkPriceScope,
} from "@/lib/admin-inventory";
import { rupees } from "@/lib/format";

/**
 * Apply one price change across a brand or category.
 *
 * Deliberately two-step: a bulk write over hundreds of SKUs has no undo, so
 * nothing is written until a preview has been produced and confirmed, and the
 * preview reports exactly how many rows change, how many would have been
 * pushed above MRP (and so get clamped), and how many are already correct.
 */
export function BulkPricePanel({ onApplied }: { onApplied: () => void }) {
  const [open, setOpen] = useState(false);
  const [brandSlug, setBrandSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [mode, setMode] = useState<BulkPriceMode>("discount_off_mrp");
  const [pct, setPct] = useState("10");
  const [preview, setPreview] = useState<BulkPricePreview | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: fetchBrands });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const scope: BulkPriceScope = {
    ...(brandSlug ? { brandSlug } : {}),
    ...(categorySlug ? { categorySlug } : {}),
  };
  const pctNum = Number(pct);
  const pctValid =
    Number.isFinite(pctNum) &&
    (mode === "discount_off_mrp" ? pctNum >= 0 && pctNum < 100 : pctNum > -100);

  // Any change to the scope or the maths invalidates a preview that is already
  // on screen — otherwise "Apply" could write a different change than the one
  // the numbers describe.
  const resetPreview = () => setPreview(null);

  const runPreview = async () => {
    if (!pctValid) {
      toast.error("Enter a percentage between 0 and 100");
      return;
    }
    setBusy(true);
    try {
      setPreview(await previewBulkPrice(scope, mode, pctNum));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read the affected SKUs");
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    setBusy(true);
    try {
      const res = await applyBulkPrice(scope, mode, pctNum);
      toast[res.failed ? "warning" : "success"](
        `${res.updated} SKUs repriced${res.failed ? `, ${res.failed} failed` : ""}`,
      );
      setPreview(null);
      onApplied();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bulk update failed");
    } finally {
      setBusy(false);
    }
  };

  const scopeLabel =
    [
      brands?.find((b) => b.slug === brandSlug)?.name,
      categories?.find((c) => c.slug === categorySlug)?.name,
    ]
      .filter(Boolean)
      .join(" · ") || "no scope selected";

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold"
      >
        Bulk price update
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-border p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold">Bulk price update</h2>
          <p className="text-xs text-muted-foreground">
            Repricing <span className="font-medium text-foreground">{scopeLabel}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            resetPreview();
          }}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="bp-brand">
            Brand
          </label>
          <select
            id="bp-brand"
            value={brandSlug}
            onChange={(e) => {
              setBrandSlug(e.target.value);
              resetPreview();
            }}
            className="mt-1 w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Any brand</option>
            {(brands ?? []).map((b) => (
              <option key={b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="bp-category">
            Category
          </label>
          <select
            id="bp-category"
            value={categorySlug}
            onChange={(e) => {
              setCategorySlug(e.target.value);
              resetPreview();
            }}
            className="mt-1 w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Any category</option>
            {(categories ?? []).map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="bp-mode">
            Change
          </label>
          <select
            id="bp-mode"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as BulkPriceMode);
              resetPreview();
            }}
            className="mt-1 w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm"
          >
            <option value="discount_off_mrp">% off MRP</option>
            <option value="adjust_current">% change on current price</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground" htmlFor="bp-pct">
            Percent
          </label>
          <input
            id="bp-pct"
            value={pct}
            inputMode="decimal"
            onChange={(e) => {
              setPct(e.target.value);
              resetPreview();
            }}
            className="mt-1 w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-gold"
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {mode === "discount_off_mrp"
          ? "Sets selling price to MRP minus this percentage."
          : "Raises or lowers the current selling price by this percentage (use a negative number to cut). Never goes above MRP."}
      </p>

      {preview && (
        <div className="mt-4 rounded-xl bg-muted/60 p-4 text-sm">
          <p className="font-medium">
            {preview.count - preview.unchanged} of {preview.count} SKUs in scope would change.
          </p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {preview.unchanged > 0 && <li>{preview.unchanged} already at this price.</li>}
            {preview.clamped > 0 && (
              <li className="text-foreground">
                {preview.clamped} would exceed MRP and will be capped at MRP.
              </li>
            )}
            {preview.examples.map((ex) => (
              <li key={ex.id}>
                {rupees(ex.from)} → {rupees(ex.to)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={runPreview}
          disabled={busy}
          className="rounded-xl border border-gold px-4 py-2.5 text-sm font-semibold text-gold disabled:opacity-50"
        >
          {busy && !preview ? "Checking…" : "Preview"}
        </button>
        <button
          type="button"
          onClick={apply}
          disabled={busy || !preview || preview.count === preview.unchanged}
          className="rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy && preview ? "Applying…" : "Apply to all in scope"}
        </button>
      </div>
    </section>
  );
}
