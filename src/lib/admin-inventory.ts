import { supabase } from "@/integrations/supabase/client";
import type { CatalogVariant } from "@/lib/catalog";
import { readTable } from "@/lib/csv";
import { LOW_STOCK_THRESHOLD } from "@/lib/format";
import { nextSellingPrice, type BulkPriceMode } from "@/lib/pricing";

export const ADMIN_PAGE_SIZE = 24;

/* ------------------------------------------------------------------ reads */

export type AdminFilters = {
  q?: string | undefined;
  brandSlug?: string | undefined;
  categorySlug?: string | undefined;
  lowStockOnly?: boolean | undefined;
  page?: number | undefined;
};

/**
 * PostgREST's `or=(...)` takes a comma-separated list inside parentheses, so a
 * search term containing `,`, `(` or `)` would be parsed as filter syntax
 * rather than as text. Strip those rather than reject the search — an admin
 * typing "cooker, 3L" means to search for both words, not to get an error.
 */
function sanitiseSearch(raw: string | undefined): string {
  return (raw ?? "").replace(/[,()"]/g, " ").trim();
}

/**
 * The inventory table, unlike the storefront's `fetchShop`, deliberately does
 * NOT filter on `is_active`: an admin has to be able to find and edit a
 * product precisely because it has been deactivated.
 */
export async function fetchAdminVariants(filters: AdminFilters) {
  let query = supabase.from("catalog_variants").select("*", { count: "exact" });

  if (filters.brandSlug) query = query.eq("brand_slug", filters.brandSlug);
  if (filters.categorySlug) query = query.eq("category_slug", filters.categorySlug);
  if (filters.lowStockOnly) query = query.lt("stock_qty", LOW_STOCK_THRESHOLD);

  const q = sanitiseSearch(filters.q);
  if (q) {
    query = query.or(`product_name.ilike.%${q}%,sku_id.ilike.%${q}%,variant_code.ilike.%${q}%`);
  }

  // In the low-stock view the whole point is "what runs out first", so sort by
  // stock ascending there and newest-first everywhere else.
  query = filters.lowStockOnly
    ? query.order("stock_qty", { ascending: true })
    : query.order("created_at", { ascending: false });
  query = query.order("sku_id", { ascending: true });

  const page = filters.page ?? 1;
  const from = (page - 1) * ADMIN_PAGE_SIZE;
  const { data, error, count } = await query.range(from, from + ADMIN_PAGE_SIZE - 1);
  if (error) throw error;
  return { items: (data ?? []) as CatalogVariant[], total: count ?? 0 };
}

export async function countLowStock(): Promise<number> {
  const { count, error } = await supabase
    .from("catalog_variants")
    .select("id", { count: "exact", head: true })
    .lt("stock_qty", LOW_STOCK_THRESHOLD);
  if (error) throw error;
  return count ?? 0;
}

/* ------------------------------------------------- create / delete helpers */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export type NewVariantInput = {
  skuId: string;
  variantCode: string | null;
  capacity: string | null;
  color: string | null;
  mrp: number;
  costPrice: number | null;
  sellingPrice: number | null;
  stockQty: number;
  packQty: number | null;
};

function variantRow(productId: string, v: NewVariantInput) {
  return {
    product_id: productId,
    sku_id: v.skuId,
    variant_code: v.variantCode,
    capacity_or_size: v.capacity,
    color: v.color,
    mrp: v.mrp,
    cost_price: v.costPrice,
    // selling_price is NOT NULL; an import that only publishes MRP (which is
    // all Dubblin and Yera catalogues give) sells at MRP until priced.
    selling_price: v.sellingPrice ?? v.mrp,
    stock_qty: v.stockQty,
    pack_or_carton_qty: v.packQty,
  };
}

const UNIQUE_VIOLATION = "23505";

/**
 * `products.slug` is UNIQUE, and two genuinely different products can share a
 * name ("Classic 3L" under two brands). Rather than pre-checking — which
 * races against a second admin saving at the same time — insert and let the
 * constraint arbitrate, retrying with a numeric suffix.
 */
async function insertProductWithUniqueSlug(base: {
  brand_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
}): Promise<string> {
  const root = slugify(base.name) || "product";
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const slug = attempt === 0 ? root : `${root}-${attempt + 1}`;
    const { data, error } = await supabase
      .from("products")
      .insert({ ...base, slug })
      .select("id")
      .single();
    if (!error && data) return data.id;
    if (error?.code !== UNIQUE_VIOLATION) throw error;
  }
  throw new Error(`Could not find a free slug for "${base.name}"`);
}

export async function createProductWithVariant(input: {
  brandId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  variant: NewVariantInput;
}): Promise<string> {
  const productId = await insertProductWithUniqueSlug({
    brand_id: input.brandId,
    category_id: input.categoryId,
    name: input.name,
    description: input.description,
  });

  const { error } = await supabase
    .from("product_variants")
    .insert(variantRow(productId, input.variant));

  if (error) {
    // No transactions over the REST API, so undo the product by hand —
    // otherwise a duplicate sku_id leaves behind a product with no sellable
    // variant, which renders as a broken catalogue row.
    await supabase.from("products").delete().eq("id", productId);
    throw error;
  }
  return productId;
}

export async function createVariant(productId: string, v: NewVariantInput): Promise<void> {
  const { error } = await supabase.from("product_variants").insert(variantRow(productId, v));
  if (error) throw error;
}

export async function updateVariant(
  id: string,
  patch: Partial<{
    selling_price: number;
    stock_qty: number;
    mrp: number;
    cost_price: number | null;
    pack_or_carton_qty: number | null;
  }>,
): Promise<void> {
  const { error } = await supabase.from("product_variants").update(patch).eq("id", id);
  if (error) throw error;
}

/**
 * Deleting a SKU does not damage order history: `order_items` references it
 * ON DELETE SET NULL and keeps its own `product_name` / `sku_id` / `brand_name`
 * snapshot, so past invoices still read correctly.
 */
export async function deleteVariant(id: string): Promise<void> {
  const { error } = await supabase.from("product_variants").delete().eq("id", id);
  if (error) throw error;
}

/** Cascades to every variant of the product (FK is ON DELETE CASCADE). */
export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function setProductActive(productId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", productId);
  if (error) throw error;
}

export async function countVariantsForProduct(productId: string): Promise<number> {
  const { count, error } = await supabase
    .from("product_variants")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);
  if (error) throw error;
  return count ?? 0;
}

/* --------------------------------------------------------- bulk price tool */

export type { BulkPriceMode };

export type BulkPriceScope = {
  brandSlug?: string | undefined;
  categorySlug?: string | undefined;
};

type PriceTarget = { id: string; mrp: number; selling_price: number };

async function scopedPriceTargets(scope: BulkPriceScope): Promise<PriceTarget[]> {
  if (!scope.brandSlug && !scope.categorySlug) {
    // Guard rail: "apply to everything" is almost never what someone means
    // when they open a bulk tool, and it is not undoable.
    throw new Error("Choose a brand or a category first");
  }
  let query = supabase.from("catalog_variants").select("id, mrp, selling_price");
  if (scope.brandSlug) query = query.eq("brand_slug", scope.brandSlug);
  if (scope.categorySlug) query = query.eq("category_slug", scope.categorySlug);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PriceTarget[];
}

export type BulkPricePreview = {
  count: number;
  clamped: number;
  unchanged: number;
  examples: { id: string; from: number; to: number }[];
};

export async function previewBulkPrice(
  scope: BulkPriceScope,
  mode: BulkPriceMode,
  pct: number,
): Promise<BulkPricePreview> {
  const targets = await scopedPriceTargets(scope);
  let clamped = 0;
  let unchanged = 0;
  const examples: BulkPricePreview["examples"] = [];
  for (const t of targets) {
    const next = nextSellingPrice(t, mode, pct);
    if (next.clamped) clamped += 1;
    if (next.price === Math.round(Number(t.selling_price))) unchanged += 1;
    else if (examples.length < 5)
      examples.push({ id: t.id, from: Number(t.selling_price), to: next.price });
  }
  return { count: targets.length, clamped, unchanged, examples };
}

/**
 * Writes the new prices. PostgREST has no "UPDATE ... SET x = expr(y)", and an
 * upsert would need every NOT NULL column, so each row is a PATCH — issued in
 * small concurrent batches to stay well inside connection limits.
 */
export async function applyBulkPrice(
  scope: BulkPriceScope,
  mode: BulkPriceMode,
  pct: number,
): Promise<{ updated: number; failed: number; skipped: number }> {
  const targets = await scopedPriceTargets(scope);
  const writes = targets
    .map((t) => ({
      id: t.id,
      price: nextSellingPrice(t, mode, pct).price,
      was: Math.round(Number(t.selling_price)),
    }))
    .filter((w) => w.price !== w.was);

  let updated = 0;
  let failed = 0;
  const BATCH = 20;
  for (let i = 0; i < writes.length; i += BATCH) {
    const batch = writes.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((w) =>
        supabase.from("product_variants").update({ selling_price: w.price }).eq("id", w.id),
      ),
    );
    for (const r of results) {
      if (r.error) failed += 1;
      else updated += 1;
    }
  }
  return { updated, failed, skipped: targets.length - writes.length };
}

/* ------------------------------------------------------------ CSV importer */

/** The column set the README promises an admin can upload directly. */
export const IMPORT_COLUMNS = [
  "brand",
  "category",
  "product_name",
  "variant_code",
  "capacity",
  "mrp",
  "cost_price",
  "selling_price",
  "stock_qty",
  "pack_carton_qty",
] as const;

export type ImportReport = {
  created: number;
  updated: number;
  newProducts: number;
  newCategories: number;
  failed: { line: number; reason: string }[];
};

/** "Rs. 1,234.50" / "₹1234" / "1,234" -> 1234.5; "" and junk -> null. */
function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseCount(raw: string): number | null {
  const n = parseMoney(raw);
  return n == null ? null : Math.round(n);
}

const SKU_PREFIX: Record<string, string> = {
  pigeon: "PGN",
  dubblin: "DUB",
  yera: "YRA",
};

function skuPrefixFor(brandSlug: string): string {
  return SKU_PREFIX[brandSlug] ?? brandSlug.slice(0, 3).toUpperCase();
}

/**
 * Highest sequence number already issued under a prefix, so generated sku_ids
 * continue the existing series instead of colliding with it.
 */
async function highestSkuSeq(prefix: string): Promise<number> {
  const { data, error } = await supabase
    .from("product_variants")
    .select("sku_id")
    .like("sku_id", `${prefix}-%`)
    .order("sku_id", { ascending: false })
    .limit(1);
  if (error) throw error;
  const top = data?.[0]?.sku_id;
  const digits = top?.slice(prefix.length + 1) ?? "";
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Imports the admin's inventory spreadsheet.
 *
 * Matching is by `variant_code`, which is what the source catalogues key on —
 * not by `sku_id`, which this store mints itself and a supplier's sheet will
 * not contain. A row whose variant_code already exists is an update (price and
 * stock); anything else is an insert, creating the product and category on the
 * way if they are new. `sku_id` is generated as e.g. `PGN-00231`, continuing
 * the series already in the table.
 *
 * An explicit `sku_id` column, if present, overrides both the match key and
 * the generated id — that is the path for re-importing a sheet this store
 * exported itself.
 */
export async function importInventory(text: string): Promise<ImportReport> {
  const { header, rows, cell } = readTable(text);
  if (!header.includes("product_name") && !header.includes("sku_id")) {
    throw new Error("CSV needs at least a product_name or sku_id column");
  }

  const [brandsRes, catsRes, productsRes, variantsRes] = await Promise.all([
    supabase.from("brands").select("id, name, slug"),
    supabase.from("categories").select("id, name, slug, brand_id"),
    supabase.from("products").select("id, name, brand_id"),
    supabase.from("product_variants").select("id, sku_id, variant_code"),
  ]);
  for (const r of [brandsRes, catsRes, productsRes, variantsRes]) {
    if (r.error) throw r.error;
  }

  const key = (s: string) => s.trim().toLowerCase();
  const brands = new Map<string, { id: string; slug: string }>();
  for (const b of brandsRes.data ?? []) {
    brands.set(key(b.name), { id: b.id, slug: b.slug });
    brands.set(key(b.slug), { id: b.id, slug: b.slug });
  }
  const categories = new Map<string, string>();
  for (const c of catsRes.data ?? []) categories.set(key(c.name), c.id);
  const products = new Map<string, string>();
  for (const p of productsRes.data ?? []) products.set(`${p.brand_id}::${key(p.name)}`, p.id);
  const byVariantCode = new Map<string, string>();
  const bySkuId = new Map<string, string>();
  for (const v of variantsRes.data ?? []) {
    if (v.variant_code) byVariantCode.set(key(v.variant_code), v.id);
    bySkuId.set(key(v.sku_id), v.id);
  }

  const seq = new Map<string, number>();
  const nextSku = async (brandSlug: string) => {
    const prefix = skuPrefixFor(brandSlug);
    if (!seq.has(prefix)) seq.set(prefix, await highestSkuSeq(prefix));
    const next = (seq.get(prefix) ?? 0) + 1;
    seq.set(prefix, next);
    return `${prefix}-${String(next).padStart(5, "0")}`;
  };

  const report: ImportReport = {
    created: 0,
    updated: 0,
    newProducts: 0,
    newCategories: 0,
    failed: [],
  };

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] as string[];
    // +2: one for the header row, one because spreadsheets are 1-indexed.
    const line = i + 2;
    try {
      const variantCode = cell(row, "variant_code");
      const explicitSku = cell(row, "sku_id");
      const existingId =
        (explicitSku ? bySkuId.get(key(explicitSku)) : undefined) ??
        (variantCode ? byVariantCode.get(key(variantCode)) : undefined);

      const mrp = parseMoney(cell(row, "mrp"));
      const selling = parseMoney(cell(row, "selling_price"));
      const cost = parseMoney(cell(row, "cost_price"));
      const stock = parseCount(cell(row, "stock_qty"));
      const pack = parseCount(cell(row, "pack_carton_qty") || cell(row, "pack_or_carton_qty"));

      if (existingId) {
        const patch: Record<string, number | null> = {};
        if (mrp != null) patch["mrp"] = mrp;
        if (selling != null) patch["selling_price"] = selling;
        if (cost != null) patch["cost_price"] = cost;
        if (stock != null) patch["stock_qty"] = stock;
        if (pack != null) patch["pack_or_carton_qty"] = pack;
        if (!Object.keys(patch).length) {
          report.failed.push({ line, reason: "nothing to update on this row" });
          continue;
        }
        const { error } = await supabase
          .from("product_variants")
          .update(patch as never)
          .eq("id", existingId);
        if (error) throw new Error(error.message);
        report.updated += 1;
        continue;
      }

      // --- new SKU: needs enough to build a sellable row ---
      const brandName = cell(row, "brand");
      const brand = brands.get(key(brandName));
      if (!brand) {
        report.failed.push({
          line,
          reason: brandName ? `unknown brand "${brandName}"` : "brand is required for a new SKU",
        });
        continue;
      }
      const productName = cell(row, "product_name");
      if (!productName) {
        report.failed.push({ line, reason: "product_name is required for a new SKU" });
        continue;
      }
      if (mrp == null || mrp <= 0) {
        report.failed.push({ line, reason: "a new SKU needs a valid mrp" });
        continue;
      }

      let categoryId: string | null = null;
      const categoryName = cell(row, "category");
      if (categoryName) {
        const found = categories.get(key(categoryName));
        if (found) categoryId = found;
        else {
          const { data, error } = await supabase
            .from("categories")
            .insert({
              name: categoryName,
              slug: slugify(categoryName) || `category-${Date.now()}`,
              brand_id: brand.id,
            })
            .select("id")
            .single();
          if (error) throw new Error(`category "${categoryName}": ${error.message}`);
          categoryId = data.id;
          categories.set(key(categoryName), data.id);
          report.newCategories += 1;
        }
      }

      const productKey = `${brand.id}::${key(productName)}`;
      let productId = products.get(productKey);
      if (!productId) {
        productId = await insertProductWithUniqueSlug({
          brand_id: brand.id,
          category_id: categoryId,
          name: productName,
          description: null,
        });
        products.set(productKey, productId);
        report.newProducts += 1;
      }

      const skuId = explicitSku || (await nextSku(brand.slug));
      await createVariant(productId, {
        skuId,
        variantCode: variantCode || null,
        capacity: cell(row, "capacity") || cell(row, "capacity_or_size") || null,
        color: cell(row, "color") || null,
        mrp,
        costPrice: cost,
        sellingPrice: selling,
        stockQty: stock ?? 0,
        packQty: pack,
      });
      bySkuId.set(key(skuId), "new");
      if (variantCode) byVariantCode.set(key(variantCode), "new");
      report.created += 1;
    } catch (err) {
      report.failed.push({
        line,
        reason: err instanceof Error ? err.message : "unexpected error",
      });
    }
  }

  return report;
}
