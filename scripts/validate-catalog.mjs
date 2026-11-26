// Scans the live catalogue (the `catalog_variants` view, is_active = true —
// 756 rows as of writing) and reports data-quality issues: images, missing
// descriptions, capacity mismatches, category problems and AI-cliché copy.
// Read-only against Supabase; writes only missing-assets-report.csv.
//
// Usage:
//   node scripts/validate-catalog.mjs [--offline] [--out <path>]
//
// --offline skips the network HEAD check against remote (Supabase storage)
// image URLs and reports them as "unverified" instead of broken/ok.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const OFFLINE = args.includes("--offline");
const outFlagIdx = args.indexOf("--out");
const OUT_PATH = outFlagIdx !== -1 ? args[outFlagIdx + 1] : join(root, "missing-assets-report.csv");

const AI_CLICHES = [
  "celestial sophistication",
  "urban sophistication",
  "coastal elegance",
  "everyday elegance",
  "organize with elegance",
];

const env = Object.fromEntries(
  readFileSync(join(root, ".env"), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [
      l.slice(0, l.indexOf("=")).trim(),
      // values in this .env are quoted
      l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, ""),
    ]),
);

const api = async (path) => {
  const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
};

// --- 1. pull the live catalogue --------------------------------------------
const variants = [];
for (let offset = 0; ; offset += 1000) {
  const page = await api(
    `catalog_variants?select=*&is_active=eq.true&order=sku_id&limit=1000&offset=${offset}`,
  );
  variants.push(...page);
  if (page.length < 1000) break;
}

const categories = await api("categories?select=id,name,slug,brand_id&order=name");
const brands = await api("brands?select=id,name,slug");
const brandNameById = new Map(brands.map((b) => [b.id, b.name]));

// --- 2. the same image fallback the storefront uses -------------------------
// Mirrors resolveProductImage() in src/components/store/ProductImage.tsx. The
// manifest is TypeScript with type annotations on the exports, so strip those
// and import the rest as plain JS rather than re-implementing the matching
// logic here.
const manifestPath = join(root, "src/lib/product-images.generated.ts");
const manifestSrc = readFileSync(manifestPath, "utf8").replace(/: Record<[^=]*?>(?=\s*=)/g, "");
const tmpManifest = join(tmpdir(), `catalog-image-manifest-${process.pid}-${Date.now()}.mjs`);
writeFileSync(tmpManifest, manifestSrc);
let IMAGE_BY_VARIANT, IMAGE_BY_SLUG;
try {
  ({ IMAGE_BY_VARIANT, IMAGE_BY_SLUG } = await import(`file://${tmpManifest}`));
} finally {
  try {
    const { unlinkSync } = await import("node:fs");
    unlinkSync(tmpManifest);
  } catch {
    // best effort cleanup
  }
}

function resolveImage(v) {
  return (
    v.image_url ||
    (v.variant_code && IMAGE_BY_VARIANT[v.variant_code]) ||
    (v.product_slug && IMAGE_BY_SLUG[v.product_slug]) ||
    null
  );
}

// --- 3. size/capacity extraction --------------------------------------------
// Normalises a size mention to a comparable [unitClass, numericValue] pair.
// unitClass groups units that are directly comparable (volume in ml, weight
// in g, bare counts/dimensions with no unit at all).
function parseSizes(text) {
  if (!text) return [];
  const out = [];
  const re = /(\d+(?:\.\d+)?)\s*(ml|millilitre|millilitres|l|litre|litres|liter|liters|kg|kilogram|kilograms|g|gm|gms|gram|grams)\b/gi;
  let m;
  while ((m = re.exec(text))) {
    const value = Number.parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    if (unit === "l" || unit.startsWith("lit")) out.push({ unitClass: "volume_ml", value: value * 1000, raw: m[0] });
    else if (unit === "ml" || unit.startsWith("milli")) out.push({ unitClass: "volume_ml", value, raw: m[0] });
    else if (unit === "kg" || unit.startsWith("kilo")) out.push({ unitClass: "weight_g", value: value * 1000, raw: m[0] });
    else out.push({ unitClass: "weight_g", value, raw: m[0] }); // g/gm/gms/gram(s)
  }
  return out;
}

/** capacity_or_size is a free-form column: "3L", "1.5L", "290", "500ml", ... */
function parseCapacityColumn(raw) {
  if (!raw) return [];
  const sized = parseSizes(raw);
  if (sized.length) return sized;
  const bare = raw.match(/^(\d+(?:\.\d+)?)$/);
  if (bare) return [{ unitClass: "bare", value: Number.parseFloat(bare[1]), raw }];
  return [];
}

// A size "disagrees" only when a capacity/title value has NO match anywhere
// among the description's same-unit sizes — not merely when some pair in the
// cross product differs. A shared description legitimately listing several
// sizes ("available in 2L, 3L, and 5L") must not be flagged just because the
// first-mentioned size isn't this particular variant's.
function sizesDisagree(a, b) {
  for (const sa of a) {
    const sameClass = b.filter((sb) => sb.unitClass === sa.unitClass);
    if (sameClass.length === 0) continue;
    const anyMatch = sameClass.some((sb) => Math.abs(sa.value - sb.value) <= 0.01);
    if (!anyMatch) return { sa, sb: sameClass[0] };
  }
  return null;
}

// --- 4. run checks over every active row ------------------------------------
const missingImage = [];
const brokenLocalImage = [];
const brokenRemoteImage = [];
const unverifiedRemoteImage = [];
const emptyDescription = [];
const clicheHits = [];
const capacityMismatches = [];

const imageUsage = new Map(); // resolved image path -> [{sku_id, product_id, product_name}]

for (const v of variants) {
  const img = resolveImage(v);
  if (!img) {
    missingImage.push(v);
  } else {
    if (img.startsWith("/")) {
      const onDisk = join(root, "public", img.replace(/^\//, ""));
      if (!existsSync(onDisk)) brokenLocalImage.push({ v, img });
    }
    const bucket = imageUsage.get(img) ?? [];
    bucket.push(v);
    imageUsage.set(img, bucket);
  }

  const desc = (v.description ?? "").trim();
  if (!desc) emptyDescription.push(v);

  for (const phrase of AI_CLICHES) {
    if (desc.toLowerCase().includes(phrase)) clicheHits.push({ v, phrase });
  }

  const titleSizes = parseSizes(v.product_name);
  const capSizes = parseCapacityColumn(v.capacity_or_size);
  const specsText = v.specifications ? JSON.stringify(v.specifications) : "";
  const specSizes = parseSizes(specsText);
  const descSizes = parseSizes(desc);

  if (descSizes.length) {
    const vsTitle = sizesDisagree(titleSizes, descSizes);
    const vsCap = sizesDisagree(capSizes.filter((s) => s.unitClass !== "bare"), descSizes);
    const vsSpecs = sizesDisagree(specSizes, descSizes);
    const mismatch = vsCap ?? vsTitle ?? vsSpecs;
    if (mismatch) {
      capacityMismatches.push({
        v,
        source: mismatch === vsCap ? "capacity_or_size" : mismatch === vsTitle ? "title" : "specifications",
        sourceValue: mismatch.sa.raw,
        descriptionValue: mismatch.sb.raw,
      });
    }
  }
}

// Remote image reachability (HEAD), bounded concurrency.
async function checkRemote(entries) {
  if (OFFLINE) {
    for (const e of entries) unverifiedRemoteImage.push(e);
    return;
  }
  const CONCURRENCY = 10;
  let i = 0;
  async function worker() {
    while (i < entries.length) {
      const idx = i++;
      const { v, img } = entries[idx];
      try {
        const res = await fetch(img, { method: "HEAD" });
        if (!res.ok) brokenRemoteImage.push({ v, img, status: res.status });
      } catch {
        brokenRemoteImage.push({ v, img, status: "network error" });
      }
    }
  }
  const remoteEntries = entries;
  const workers = Array.from({ length: Math.min(CONCURRENCY, remoteEntries.length) }, worker);
  await Promise.all(workers);
}

const remoteCandidates = [];
for (const v of variants) {
  const img = resolveImage(v);
  if (img && /^https?:\/\//.test(img)) remoteCandidates.push({ v, img });
}
await checkRemote(remoteCandidates);

// Image reuse across distinct SKUs.
const reusedSameProduct = [];
const reusedCrossProduct = [];
for (const [img, rows] of imageUsage) {
  if (rows.length < 2) continue;
  const distinctProducts = new Set(rows.map((r) => r.product_id));
  const entry = { img, skus: rows.map((r) => r.sku_id), productNames: [...new Set(rows.map((r) => r.product_name))] };
  if (distinctProducts.size > 1) reusedCrossProduct.push(entry);
  else reusedSameProduct.push(entry);
}

// Categories with 0 products, and duplicate category names.
const productCountByCategory = new Map();
for (const v of variants) {
  if (!v.category_id) continue;
  const set = productCountByCategory.get(v.category_id) ?? new Set();
  set.add(v.product_id);
  productCountByCategory.set(v.category_id, set);
}
const emptyCategories = categories.filter((c) => (productCountByCategory.get(c.id)?.size ?? 0) === 0);

const nameGroups = new Map();
for (const c of categories) {
  const key = c.name.trim().toLowerCase();
  const list = nameGroups.get(key) ?? [];
  list.push(c);
  nameGroups.set(key, list);
}
const duplicateCategoryNames = [...nameGroups.values()].filter((list) => list.length > 1);

const uncategorized = variants.filter((v) => !v.category_id);

// --- 5. report ----------------------------------------------------------------
const brandOf = (v) => v.brand_name ?? v.brand_slug;

console.log(`Catalogue validation — ${variants.length} active SKUs across ${categories.length} categories\n`);

console.log("## Images");
console.log(`  Missing image (no image_url, no fallback match): ${missingImage.length}`);
console.log(`  Broken local image (file not found on disk):     ${brokenLocalImage.length}`);
if (OFFLINE) {
  console.log(`  Remote image URLs (not checked, --offline):      ${unverifiedRemoteImage.length}`);
} else {
  console.log(`  Broken remote image (HEAD failed):               ${brokenRemoteImage.length} of ${remoteCandidates.length} checked`);
}
console.log(`  Image reused within the same product (ok, e.g. size variants): ${reusedSameProduct.length} image(s)`);
console.log(`  Image reused across DIFFERENT products (risky):   ${reusedCrossProduct.length} image(s)`);

console.log("\n## Descriptions");
console.log(`  Empty or missing description: ${emptyDescription.length}`);
console.log(`  AI cliché phrase hits:        ${clicheHits.length}`);
if (clicheHits.length) {
  const byPhrase = new Map();
  for (const h of clicheHits) byPhrase.set(h.phrase, (byPhrase.get(h.phrase) ?? 0) + 1);
  for (const [phrase, n] of byPhrase) console.log(`    - "${phrase}": ${n}`);
}

console.log("\n## Capacity / size mismatches (title or specs vs. description)");
console.log(`  Mismatches found: ${capacityMismatches.length}`);
for (const m of capacityMismatches.slice(0, 20)) {
  console.log(
    `    ${m.v.sku_id.padEnd(22)} ${brandOf(m.v).padEnd(8)} "${m.v.product_name}" — ${m.source}: ${m.sourceValue} vs description: ${m.descriptionValue}`,
  );
}
if (capacityMismatches.length > 20) console.log(`    ... and ${capacityMismatches.length - 20} more`);

console.log("\n## Categories");
console.log(`  Categories with 0 active products: ${emptyCategories.length}`);
for (const c of emptyCategories) {
  console.log(`    - ${c.name} (${c.slug}, brand: ${brandNameById.get(c.brand_id) ?? "—"})`);
}
console.log(`  Duplicate category names: ${duplicateCategoryNames.length}`);
for (const group of duplicateCategoryNames) {
  console.log(`    - "${group[0].name}" used by: ${group.map((c) => c.slug).join(", ")}`);
}
if (uncategorized.length) console.log(`  SKUs with no category at all: ${uncategorized.length}`);

console.log("\n## Summary counts");
console.log(`  Total active SKUs:              ${variants.length}`);
console.log(`  Needing a new/fixed photo:       ${missingImage.length + brokenLocalImage.length + brokenRemoteImage.length}`);
console.log(`  Needing a description:           ${emptyDescription.length}`);
console.log(`  Needing a copy rewrite (cliché):  ${new Set(clicheHits.map((h) => h.v.sku_id)).size}`);
console.log(`  Needing a capacity/copy check:    ${capacityMismatches.length}`);

// --- 6. missing-assets-report.csv ---------------------------------------------
const csvRows = [["sku_id", "brand", "product_name", "category_name", "capacity_or_size", "issue", "image_path", "detail"]];

const csvEscape = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;

for (const v of missingImage) {
  csvRows.push([v.sku_id, brandOf(v), v.product_name, v.category_name, v.capacity_or_size, "missing_image", "", "No image_url and no fallback match in product-images.generated.ts"]);
}
for (const { v, img } of brokenLocalImage) {
  csvRows.push([v.sku_id, brandOf(v), v.product_name, v.category_name, v.capacity_or_size, "broken_local_image", img, "File does not exist under public/"]);
}
for (const { v, img, status } of brokenRemoteImage) {
  csvRows.push([v.sku_id, brandOf(v), v.product_name, v.category_name, v.capacity_or_size, "broken_remote_image", img, `HEAD ${status}`]);
}
for (const entry of reusedCrossProduct) {
  for (const sku of entry.skus) {
    const v = variants.find((x) => x.sku_id === sku);
    csvRows.push([
      sku,
      v ? brandOf(v) : "",
      v?.product_name ?? "",
      v?.category_name ?? "",
      v?.capacity_or_size ?? "",
      "reused_cross_product_image",
      entry.img,
      `Shared with: ${entry.productNames.filter((n) => n !== v?.product_name).join(" / ") || entry.skus.filter((s) => s !== sku).join(", ")} — needs its own photo`,
    ]);
  }
}

writeFileSync(OUT_PATH, csvRows.map((r) => r.map(csvEscape).join(",")).join("\n") + "\n");
console.log(`\nWrote ${csvRows.length - 1} rows to ${OUT_PATH}`);
