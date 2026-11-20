import { useState } from "react";
import { toast } from "sonner";
import { importInventory, IMPORT_COLUMNS, type ImportReport } from "@/lib/admin-inventory";

/**
 * Inventory spreadsheet upload.
 *
 * Takes the column set the project README promises ("so I can upload my
 * existing inventory spreadsheet directly"), matching rows on `variant_code`
 * — the code the supplier catalogues actually print — and creating products
 * and categories for rows that are new.
 */
export function CsvImportPanel({ onImported }: { onImported: () => void }) {
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);

  const run = async (file: File) => {
    setBusy(true);
    setReport(null);
    try {
      const text = await file.text();
      const result = await importInventory(text);
      setReport(result);
      const touched = result.created + result.updated;
      if (!touched && result.failed.length) toast.error("Nothing imported — see the report below");
      else if (result.failed.length)
        toast.warning(`${touched} rows imported, ${result.failed.length} skipped`);
      else toast.success(`${touched} rows imported`);
      if (touched) onImported();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read that CSV");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="shrink-0 cursor-pointer rounded-xl border border-gold px-4 py-2.5 text-center text-sm font-semibold text-gold">
          {busy ? "Importing…" : "Import inventory CSV"}
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) run(file);
              e.target.value = "";
            }}
          />
        </label>
        {report && (
          <button
            type="button"
            onClick={() => setReport(null)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Dismiss report
          </button>
        )}
      </div>

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium">CSV format</summary>
        <div className="mt-2 space-y-2">
          <p>
            Columns:{" "}
            {IMPORT_COLUMNS.map((c, i) => (
              <span key={c}>
                <code>{c}</code>
                {i < IMPORT_COLUMNS.length - 1 ? ", " : ""}
              </span>
            ))}
            .
          </p>
          <p>
            Rows are matched on <code>variant_code</code>: an existing code updates that SKU&rsquo;s
            prices and stock, anything else is created, along with its product and category if those
            are new. A <code>sku_id</code> column, if you include one, takes priority over
            <code> variant_code</code> and is used verbatim instead of a generated id.
          </p>
          <p>
            A new SKU needs at least <code>brand</code>, <code>product_name</code> and{" "}
            <code>mrp</code>. Quoted fields, embedded commas and <code>Rs.</code> prefixes are all
            handled; blank cells are left untouched rather than zeroed.
          </p>
        </div>
      </details>

      {report && (
        <div className="rounded-xl border border-border p-4 text-sm">
          <p className="font-medium">
            {report.updated} updated · {report.created} created
            {report.newProducts ? ` · ${report.newProducts} new products` : ""}
            {report.newCategories ? ` · ${report.newCategories} new categories` : ""}
          </p>
          {report.failed.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-medium text-destructive">
                {report.failed.length} rows skipped
              </p>
              <ul className="mt-1 max-h-40 space-y-0.5 overflow-y-auto text-xs text-muted-foreground">
                {report.failed.slice(0, 50).map((f) => (
                  <li key={f.line}>
                    Line {f.line}: {f.reason}
                  </li>
                ))}
                {report.failed.length > 50 && <li>…and {report.failed.length - 50} more.</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
