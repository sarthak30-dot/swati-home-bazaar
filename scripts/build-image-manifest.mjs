// Builds src/lib/product-images.generated.ts — a lookup from variant code and
// product slug to the product photos already sitting in public/images/products.
//
// Roughly three quarters of variants have a NULL image_url in Supabase even
// though a matching photo exists on disk, so the storefront falls back to a
// coloured tile. We cannot backfill the column (no service_role key), so the
// mapping is resolved on the client instead. Re-run with:
//   node scripts/build-image-manifest.mjs
import { readdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BRANDS = ["pigeon", "dubblin", "yera"];

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

/** Lowercase and strip every non-alphanumeric char, so "JR-1.5" == "jr15". */
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// --- 1. index the files on disk -------------------------------------------
// A file is "generic" when its name is a category stock shot rather than a
// named product: cookware2-07, nonstick-14, p13-mixer-02. Attaching one of
// those to a specific SKU would show the shopper a DIFFERENT product, so they
// are excluded from product matching and exported for decorative use only.
const isGeneric = (stem) => /-\d{2}$/.test(stem) || /^p\d+-/.test(stem);

const files = {};
const decorative = {};
for (const brand of BRANDS) {
  files[brand] = new Map();
  decorative[brand] = [];
  for (const f of readdirSync(join(root, "public/images/products", brand))) {
    if (!/\.(jpg|jpeg|png|webp)$/i.test(f)) continue;
    const stem = f.replace(/\.[^.]+$/, "");
    if (isGeneric(stem)) decorative[brand].push(`/images/products/${brand}/${f}`);
    else files[brand].set(norm(stem), f);
  }
}

/** Leading word of a hyphenated name: "amelia-cooker" -> "amelia". */
const head = (s) => (s.toLowerCase().match(/[a-z0-9]+/g) ?? [])[0] ?? "";
const headIndex = {};
for (const brand of BRANDS) {
  headIndex[brand] = new Map();
  for (const [, f] of files[brand]) {
    const h = head(f.replace(/\.[^.]+$/, ""));
    if (h.length >= 4 && !headIndex[brand].has(h)) headIndex[brand].set(h, f);
  }
}

// --- 2. pull the catalogue in pages ---------------------------------------
const variants = [];
for (let offset = 0; ; offset += 1000) {
  const page = await api(
    `product_variants?select=variant_code,image_url,products!inner(slug,name,brands!inner(slug))` +
      `&limit=1000&offset=${offset}`,
  );
  variants.push(...page);
  if (page.length < 1000) break;
}

// --- 3. match ---------------------------------------------------------------
// Ordered by confidence: an exact variant-code hit is how the populated rows
// were built, so it is trusted first. The slug rule catches Dubblin, whose
// files are named after the model ("dubblin-crest" -> "crest.jpg").
const byVariant = {};
const bySlug = {};
const stats = {};

for (const v of variants) {
  const brand = v.products?.brands?.slug;
  if (!brand || !files[brand]) continue;
  stats[brand] ??= { total: 0, had: 0, matched: 0, missed: 0 };
  stats[brand].total++;

  if (v.image_url) {
    stats[brand].had++;
    continue; // a real image_url always wins; never shadow it
  }

  const code = norm(v.variant_code ?? "");
  const slugTail = norm((v.products.slug ?? "").replace(new RegExp(`^${brand}-`), ""));

  // Tier 3 matches the product's leading word against the file's leading word
  // ("Amelia Hard Anodised" -> amelia-cooker.jpg). Same product family, real
  // photo — accurate enough to put on a product card.
  const rawTail = (v.products.slug ?? "").replace(new RegExp(`^${brand}-`), "");

  const hit =
    (code && files[brand].get(code)) ||
    (slugTail && files[brand].get(slugTail)) ||
    // Dubblin/Pigeon files sometimes carry a suffix: "bold-1200" for "bold".
    (slugTail &&
      [...files[brand].entries()].find(([k]) => k.startsWith(slugTail) && k.length - slugTail.length <= 5)?.[1]) ||
    headIndex[brand].get(head(rawTail));

  if (!hit) {
    stats[brand].missed++;
    continue;
  }
  stats[brand].matched++;
  const url = `/images/products/${brand}/${hit}`;
  if (code) byVariant[v.variant_code] = url;
  bySlug[v.products.slug] ??= url;
}

// --- 4. emit ----------------------------------------------------------------
const out = `// GENERATED by scripts/build-image-manifest.mjs — do not edit by hand.
// Maps catalogue rows to photos already present in public/images/products for
// the ~75% of variants whose image_url is NULL in Supabase. Regenerate after
// adding photos or changing the catalogue.

/** variant_code -> public image path */
export const IMAGE_BY_VARIANT: Record<string, string> = ${JSON.stringify(byVariant, null, 2)};

/** product slug -> public image path (fallback when the variant has no match) */
export const IMAGE_BY_SLUG: Record<string, string> = ${JSON.stringify(bySlug, null, 2)};

/**
 * Category stock photography, per brand. These are NOT tied to a specific SKU,
 * so they must never be shown as a product's own photo — use them only as
 * decoration (hero collage, category artwork) where nothing claims otherwise.
 */
export const DECORATIVE_IMAGES: Record<string, string[]> = ${JSON.stringify(decorative, null, 2)};
`;
writeFileSync(join(root, "src/lib/product-images.generated.ts"), out);

// --- 5. report --------------------------------------------------------------
let t = 0, h = 0, m = 0;
for (const [brand, s] of Object.entries(stats)) {
  t += s.total; h += s.had; m += s.matched;
  const cov = (((s.had + s.matched) / s.total) * 100).toFixed(0);
  console.log(
    `${brand.padEnd(8)} ${String(s.total).padStart(4)} variants | ` +
      `${String(s.had).padStart(3)} had image_url | +${String(s.matched).padStart(3)} matched | ` +
      `${String(s.missed).padStart(3)} still uncovered | ${cov}% covered`,
  );
}
console.log(
  `\nTOTAL    ${t} variants | ${h} before (${((h / t) * 100).toFixed(0)}%) -> ` +
    `${h + m} after (${(((h + m) / t) * 100).toFixed(0)}%)  [+${m} newly showing a photo]`,
);
console.log(`keys: ${Object.keys(byVariant).length} by variant, ${Object.keys(bySlug).length} by slug`);
