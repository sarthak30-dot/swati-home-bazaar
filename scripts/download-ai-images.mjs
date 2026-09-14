/**
 * scripts/download-ai-images.mjs
 *
 * One-time script: downloads all Pollinations.ai product images to
 * public/images/products/ and prints the realAsset patch for products.ts.
 *
 * Usage:
 *   node scripts/download-ai-images.mjs
 *
 * After it finishes:
 *   1. Images land in public/images/products/<sku>-primary.webp / <sku>-hover.webp
 *   2. Copy the printed realAsset lines into the matching products in products.ts
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../public/images/products");

fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Replicate the getAiProductImage helper ────────────────────────────────────

function getAiProductImage(prompt, seed = 42) {
  const cleanPrompt = encodeURIComponent(
    `commercial studio product photography of ${prompt}, white to soft gray background, 4k, crisp lighting, e-commerce catalog shot, no text, no watermark`,
  );
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=600&height=600&seed=${seed}&nologo=true`;
}

// ── Image manifest (matches src/data/products.ts AI object) ──────────────────

const IMAGES = [
  // Dubblin
  { sku: "DB-DREAM-LB",    primaryUrl: getAiProductImage("Dubblin stainless steel insulated lunch box double wall vacuum silver metallic cylindrical container with lid", 1),    hoverUrl: getAiProductImage("Dubblin stainless steel insulated lunch box open showing inner compartment", 101) },
  { sku: "DB-RUGBY-MUG2",  primaryUrl: getAiProductImage("pair of stainless steel travel mugs 360 degree sip lid glossy emerald green set of two", 2),                          hoverUrl: getAiProductImage("stainless steel travel mug top-down view showing 360 degree sip lid emerald green", 102) },
  { sku: "DB-YORK-540",    primaryUrl: getAiProductImage("Dubblin York 540ml stainless steel travel mug ergonomic grip handle push button lid matte finish", 3),                hoverUrl: getAiProductImage("540ml stainless steel travel mug side angle showing push button and grip ribs", 103) },
  { sku: "DB-CREST-600",   primaryUrl: getAiProductImage("600ml vacuum flask stainless steel wide mouth screw cap cylindrical slim bottle silver", 4),                           hoverUrl: getAiProductImage("600ml stainless steel vacuum flask disassembled showing wide mouth opening and screw cap", 104) },
  { sku: "DB-ZOOM-550",    primaryUrl: getAiProductImage("550ml slim stainless steel vacuum flask powder coated dark forest green cylindrical sleek", 5),                        hoverUrl: getAiProductImage("550ml slim stainless steel vacuum flask dark green angled view showing bottom and cap", 105) },
  { sku: "DB-CRAZE-450",   primaryUrl: getAiProductImage("450ml stainless steel travel mug with flip lid one-hand operation matte black car holder", 6),                        hoverUrl: getAiProductImage("450ml stainless steel travel mug flip lid open showing interior matte black", 106) },
  { sku: "DB-SLIM-LB",     primaryUrl: getAiProductImage("slim insulated stainless steel lunch box two compartments school lunch tiffin silver rectangular", 7),                hoverUrl: getAiProductImage("insulated lunch box open top view showing two stainless steel inner compartments", 107) },
  { sku: "DB-STREAM-750",  primaryUrl: getAiProductImage("750ml borosilicate glass water bottle with mint green silicone sleeve transparent cylindrical", 8),                   hoverUrl: getAiProductImage("borosilicate glass water bottle 750ml without sleeve showing crystal clear glass", 108) },

  // YERA Prima
  { sku: "YP-PRIMA-OAK-300",        primaryUrl: getAiProductImage("set of 6 premium crystal whiskey glasses 300ml straight edge old fashioned tumbler arranged in triangle", 9),         hoverUrl: getAiProductImage("single crystal whiskey glass 300ml filled with amber whiskey and ice cubes dramatic lighting", 109) },
  { sku: "YP-PRIMA-ORIANA-320",     primaryUrl: getAiProductImage("set of 6 elegant tapered crystal tumbler glasses 320ml arranged in two rows", 10),                                    hoverUrl: getAiProductImage("single elegant tapered crystal tumbler glass 320ml filled with clear water and lemon", 110) },
  { sku: "YP-PRIMA-MRC-BLUE",       primaryUrl: getAiProductImage("set of 6 cobalt blue tinted crystal cocktail glasses 300ml vibrant color arranged in circle", 11),                   hoverUrl: getAiProductImage("single cobalt blue cocktail glass filled with blue cocktail and ice garnished with lime", 111) },
  { sku: "YP-PRIMA-MRC-GREEN",      primaryUrl: getAiProductImage("set of 6 emerald green tinted crystal cocktail glasses 300ml rich color arranged in pyramid", 12),                   hoverUrl: getAiProductImage("single emerald green cocktail glass filled with mojito mint leaves ice cubes", 112) },
  { sku: "YP-PRIMA-GENEVA-285",     primaryUrl: getAiProductImage("set of 6 heavy bottom whiskey glasses octagonal base crystal 285ml arranged in two rows", 13),                       hoverUrl: getAiProductImage("single heavy bottom crystal whiskey glass octagonal European design with whiskey and large ice cube", 113) },
  { sku: "YP-PRIMA-VENICE-300",     primaryUrl: getAiProductImage("set of 6 curved barrel crystal tumbler glasses 300ml water glasses arranged in staggered row", 14),                  hoverUrl: getAiProductImage("single curved barrel crystal tumbler glass filled with orange juice and slice", 114) },
  { sku: "YP-PRIMA-SANTORINI",      primaryUrl: getAiProductImage("crystal glass carafe 1 litre with two matching wine glasses elegant dining gift set", 15),                            hoverUrl: getAiProductImage("crystal glass carafe filled with red wine alongside two matching glasses on dark wood table", 115) },

  // Stovekraft Pigeon
  { sku: "PG-KETTLE-HOT-1.5",       primaryUrl: getAiProductImage("Pigeon electric kettle 1.5 litre stainless steel cordless 360 degree swivel base silver", 16),                       hoverUrl: getAiProductImage("electric kettle 1.5L stainless steel lid open showing interior hidden heating element", 116) },
  { sku: "PG-SWIFT-KETTLE-1.5",     primaryUrl: getAiProductImage("Pigeon multi function electric kettle 1.5 litre stainless steel with temperature dial and steamer basket", 17),      hoverUrl: getAiProductImage("multi cook electric kettle 1.5L with detachable steamer basket shown separately on side", 117) },
  { sku: "PG-MABEL-CER-3L",         primaryUrl: getAiProductImage("Pigeon 3 litre ceramic coated aluminium pressure cooker red lid ISI certified induction gas compatible", 18),        hoverUrl: getAiProductImage("3 litre ceramic pressure cooker open lid top view showing inner ceramic non stick coating", 118) },
  { sku: "PG-MABEL-CER-5L",         primaryUrl: getAiProductImage("Pigeon 5 litre ceramic coated aluminium pressure cooker red lid large family size induction", 19),                   hoverUrl: getAiProductImage("5 litre ceramic pressure cooker angled side view showing safety valve and ergonomic handles", 119) },
  { sku: "PG-JOY-ERC-1.8",          primaryUrl: getAiProductImage("Pigeon Joy electric biryani rice cooker 1.8 litre non stick inner pot with steamer basket digital", 20),             hoverUrl: getAiProductImage("electric biryani cooker 1.8L open showing non stick inner pot with rice inside steam rising", 120) },
  { sku: "PG-JOY-ERC-2.8",          primaryUrl: getAiProductImage("Pigeon Joy electric biryani cooker 2.8 litre large capacity non stick keep warm function", 21),                      hoverUrl: getAiProductImage("2.8L electric biryani cooker with lid open and dual layer steamer basket shown", 121) },
  { sku: "PG-INOX-PRO-STMR-1",      primaryUrl: getAiProductImage("Pigeon INOX Pro 1 litre electric cooker premium stainless steel inner pot compact size", 22),                        hoverUrl: getAiProductImage("compact 1L electric cooker stainless steel inner pot lifted out showing mirror finish interior", 122) },
  { sku: "PG-AIRFRY-CRISPA",        primaryUrl: getAiProductImage("Pigeon Crispa 4 litre air fryer digital touch screen display with non stick frying basket black", 23),               hoverUrl: getAiProductImage("air fryer 4L with basket pulled out showing food rack inside crispy fries", 123) },
];

// ── Download helper ───────────────────────────────────────────────────────────

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log(`  skip (exists): ${path.basename(dest)}`);
      return resolve(dest);
    }

    const file = fs.createWriteStream(dest);
    const request = (targetUrl) => {
      https.get(targetUrl, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          fs.unlinkSync(dest);
          return request(res.headers.location);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          return reject(new Error(`HTTP ${res.statusCode} for ${path.basename(dest)}`));
        }
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve(dest)));
      }).on("error", (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    };
    request(url);
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

const patches = [];

for (const { sku, primaryUrl, hoverUrl } of IMAGES) {
  const primaryDest = path.join(OUT_DIR, `${sku}-primary.webp`);
  const hoverDest   = path.join(OUT_DIR, `${sku}-hover.webp`);

  process.stdout.write(`[${sku}] primary... `);
  try {
    await download(primaryUrl, primaryDest);
    console.log("✓");
  } catch (e) {
    console.log(`✗ ${e.message}`);
  }

  process.stdout.write(`[${sku}] hover...   `);
  try {
    await download(hoverUrl, hoverDest);
    console.log("✓");
  } catch (e) {
    console.log(`✗ ${e.message}`);
  }

  patches.push(
    `  // ${sku}\n  realAsset: "/images/products/${sku}-primary.webp",\n  // hover realAsset: "/images/products/${sku}-hover.webp"`,
  );
}

console.log("\n─────────────────────────────────────────────────────────");
console.log("Done! Add the following realAsset lines to products.ts:");
console.log("─────────────────────────────────────────────────────────\n");
for (const p of patches) console.log(p + "\n");
