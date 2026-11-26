// Computes image_status for every active catalog_variants row and prints a
// SQL script to apply it. `product_variants` is admin-write (RLS), so this
// prints SQL for an admin to run via the Supabase SQL editor / a migration,
// the same way scripts/build-image-manifest.mjs prints a report rather than
// writing to the DB itself.
//
// Classification (highest precedence first):
//   needs_shoot      no image_url and no fallback match in the generated
//                     manifest — resolveProductImage() returns null.
//   needs_recrop      curatorial only; this script never sets it. A photo
//                     resolves fine but is a bad crop (box corner, wholesale
//                     header) — nothing here can detect that. Apply by hand,
//                     after this script's output, for whichever SKUs a
//                     visual review flags.
//   variant_shared    the resolved photo is used by >=2 active SKUs,
//                     including same-product size variants.
//   verified          none of the above.
//
// Usage: node scripts/tag-image-status.mjs > /tmp/image-status-update.sql
// Then review the diff against the current image_status (a re-run should
// mostly no-op) before applying, and re-apply any needs_recrop overrides —
// this script does not know about them and will reset such a row to
// whatever it computes.
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const env = Object.fromEntries(
  readFileSync(join(root, ".env"), "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [
      l.slice(0, l.indexOf("=")).trim(),
      l
        .slice(l.indexOf("=") + 1)
        .trim()
        .replace(/^["']|["']$/g, ""),
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

// Mirrors resolveProductImage() in src/components/store/ProductImage.tsx.
const manifestSrc = readFileSync(join(root, "src/lib/product-images.generated.ts"), "utf8").replace(
  /: Record<[^=]*?>(?=\s*=)/g,
  "",
);
const tmpManifest = join(tmpdir(), `img-status-manifest-${process.pid}.mjs`);
writeFileSync(tmpManifest, manifestSrc);
const { IMAGE_BY_VARIANT, IMAGE_BY_SLUG } = await import(`file://${tmpManifest}`);
unlinkSync(tmpManifest);

function resolveImage(v) {
  return (
    v.image_url ||
    (v.variant_code && IMAGE_BY_VARIANT[v.variant_code]) ||
    (v.product_slug && IMAGE_BY_SLUG[v.product_slug]) ||
    null
  );
}

const variants = [];
for (let offset = 0; ; offset += 1000) {
  const page = await api(
    `catalog_variants?select=id,sku_id,variant_code,product_slug,image_url,image_status&is_active=eq.true&order=sku_id&limit=1000&offset=${offset}`,
  );
  variants.push(...page);
  if (page.length < 1000) break;
}

const resolved = variants.map((v) => ({ ...v, resolved: resolveImage(v) }));

const byImage = new Map();
for (const v of resolved) {
  if (!v.resolved) continue;
  const bucket = byImage.get(v.resolved) ?? [];
  bucket.push(v);
  byImage.set(v.resolved, bucket);
}
const sharedIds = new Set();
for (const bucket of byImage.values()) {
  if (bucket.length >= 2) for (const v of bucket) sharedIds.add(v.id);
}

const computed = resolved.map((v) => ({
  id: v.id,
  sku_id: v.sku_id,
  status: !v.resolved ? "needs_shoot" : sharedIds.has(v.id) ? "variant_shared" : "verified",
}));

const changed = computed.filter((v, i) => v.status !== resolved[i].image_status);

console.log(`-- Recomputed image_status for ${computed.length} active variants.`);
console.log(
  `-- ${changed.length} changed from their current value; ${computed.length - changed.length} unchanged.`,
);
console.log(
  `-- NOTE: this does not know about needs_recrop overrides (curatorial, applied by hand) --`,
);
console.log(`-- re-apply those after running this output if any of their SKUs appear below.\n`);

for (const status of ["needs_shoot", "variant_shared", "verified"]) {
  const ids = changed.filter((v) => v.status === status).map((v) => `  '${v.id}'`);
  if (!ids.length) continue;
  console.log(`UPDATE product_variants SET image_status = '${status}' WHERE id = ANY(ARRAY[`);
  console.log(ids.join(",\n"));
  console.log(`]::uuid[]);\n`);
}
