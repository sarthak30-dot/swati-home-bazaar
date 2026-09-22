// Builds public/sitemap.xml from the live catalogue plus the site's static
// routes. Re-run with:
//   node scripts/build-sitemap.mjs
//
// This is a build-time snapshot (same trade-off as build-image-manifest.mjs):
// no server route needed, but the sitemap goes stale until the next deploy.
// Fine for a catalogue that changes on the order of days, not seconds.
import { writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DEPARTMENTS } from "../src/lib/departments.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BRANDS = ["pigeon", "dubblin", "yera"];

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

// No production domain is configured anywhere in this repo yet (no
// wrangler.toml custom domain, no canonical tag). Set VITE_SITE_URL once you
// have one — until then this falls back to a placeholder that is easy to
// grep for and obviously wrong if it ships.
const SITE_URL = (env.VITE_SITE_URL || "https://REPLACE-WITH-YOUR-DOMAIN.example").replace(
  /\/$/,
  "",
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

const urls = [];
const add = (loc, changefreq, priority) => urls.push({ loc, changefreq, priority });

// --- static pages -----------------------------------------------------------
add("/", "daily", "1.0");
add("/shop", "daily", "0.9");
add("/bulk-orders", "monthly", "0.6");
add("/about", "monthly", "0.4");
add("/contact", "monthly", "0.4");
add("/shipping-policy", "yearly", "0.2");
add("/returns-policy", "yearly", "0.2");
add("/privacy-policy", "yearly", "0.2");
add("/terms", "yearly", "0.2");

for (const brand of BRANDS) add(`/brand/${brand}`, "weekly", "0.7");
for (const d of DEPARTMENTS) add(`/department/${d.slug}`, "weekly", "0.7");

// --- product pages ------------------------------------------------------------
// A Supabase outage during build should degrade the sitemap (static pages
// only, regenerated correctly next deploy), not fail the whole build — losing
// every deploy because the catalogue API hiccuped is worse than a stale
// sitemap for a few hours.
try {
  for (let offset = 0; ; offset += 1000) {
    const page = await api(
      `catalog_variants?select=sku_id,created_at&is_active=eq.true&limit=1000&offset=${offset}`,
    );
    for (const row of page) {
      add(`/product/${row.sku_id}`, "weekly", "0.8");
    }
    if (page.length < 1000) break;
  }
} catch (error) {
  console.warn(
    `Could not fetch the catalogue for the sitemap (${error instanceof Error ? error.message : error}). ` +
      "Writing static pages only — re-run once Supabase is reachable.",
  );
}

// --- emit ---------------------------------------------------------------------
const body = urls
  .map(
    ({ loc, changefreq, priority }) =>
      `  <url>\n` +
      `    <loc>${SITE_URL}${loc}</loc>\n` +
      `    <changefreq>${changefreq}</changefreq>\n` +
      `    <priority>${priority}</priority>\n` +
      `  </url>`,
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;

writeFileSync(join(root, "public/sitemap.xml"), xml);
console.log(`Wrote public/sitemap.xml with ${urls.length} URLs (base: ${SITE_URL})`);
if (!env.VITE_SITE_URL) {
  console.warn(
    "VITE_SITE_URL is not set in .env — sitemap URLs use a placeholder domain. " +
      "Set VITE_SITE_URL=https://your-real-domain before deploying.",
  );
}
