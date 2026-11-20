# Brand image sync

Sources product photography from the three brands' own websites and attaches it
to the matching SKUs. Swati Enterprises is an authorised retailer of all three,
so the manufacturers' product shots are the correct imagery for these listings.

Run from the repository root with `python3`. Each step writes its output into
`.image-sync/` (gitignored) so steps can be re-run independently.

| Step | Script | What it does |
| --- | --- | --- |
| 1 | `1-harvest-pigeon.py` | Walks stovekraft.com's sitemap (~391 product pages) and reads each product's OWN images out of the Alpine.js `slides` array in its `product_slider`. |
| — | *(Yera)* | `https://www.yera.com/products.json?limit=250` — Shopify's product feed, 248 products. No script needed. |
| — | *(Dubblin)* | Not automatable: see "Dubblin" below. |
| 2 | `2-match.py` | Matches harvested products to the 920 SKUs. **Strict** — see below. |
| 3 | `3-download.py` | Downloads the matched images and records dimensions. |
| 4 | `4-upload.py` | Uploads to the Supabase `product-images` bucket and sets `image_url` + `image_source_url`. Needs an admin login. |
| 5 | `5-suppress-priced-scans.sql` | Clears `image_url` on the leftover catalogue scans that have supplier pricing printed inside the image. |
| 6 | `6-missing-images-pdf.py` | Builds `sku-images-missing.pdf`, the supplier-facing list of SKUs still without an image. Needs `reportlab`. |

## Matching is deliberately strict

Attaching a photo of the *wrong* product is worse than attaching none, so only
three signals are trusted:

- **A — code token.** The SKU's `variant_code` equals a whole token in the
  source title (`JR-150` ↔ "…Glass Storage Jars JR-150, 1400ml"). Matching on
  substrings instead gave `JR-150` the photo of `JR1500STK`, so candidate
  tokens are maximal `[A-Za-z0-9-]` runs plus adjacent pairs joined — which
  still resolves "PSR 550-425" to `psr550425`.
- **B — exact name.** Product names identical once case and punctuation are
  dropped.
- **C — name + size.** Every meaningful word matches *and* both sides state a
  size that agrees.

Two guards apply to all three:

- **Size agreement per unit.** If both sides name a size in the same unit the
  numbers must match. Without this, `Steelo Kadai 12"` and `13"` both took the
  **10"** photo, because the field used as a discriminator held `2mm` — a
  thickness, not a size.
- **Combo-ness must agree.** A single item never takes a combo's photo. Without
  this, `Jina Jar` matched "Indiana Steel Handi Combination (B14FH + …)" and
  each of the three Polo bowls took the photo of the 3-bowl set.

Everything else is left unmatched on purpose. `2-match.py` prints the tally.

## Scans with pricing printed in them

The images under `public/images/products/` are crops of wholesale catalogue
pages, and most carry header text: bulk and carton quantities, trade prices,
and often a neighbouring product's code and price. Reading all 40 remaining
local scans with `tesseract` found **26 containing pricing** — several
contradicting the retail price on the same card.

Step 5 clears those so the card falls back to its coloured tile. A tile is
better than a photo quoting a price that is not ours. To re-check after adding
photography:

```sh
tesseract public/images/products/yera/<sku>.jpg stdout --psm 6
```

## Dubblin

Not automatable as of this writing. `dubblin.co.in/shop` and every category and
filter route render **zero** products — the catalogue browse is client-side and
returns nothing — and there is no sitemap (`/sitemap.xml` and the usual
alternates all return the SPA's 404 page). Individual `/product/<slug>` pages do
work and serve clean per-product images, so Dubblin can be covered once a list
of product slugs exists. It is also the least urgent: 93 of its 105 variants
already have images.

## Network

These hosts must be reachable: `www.stovekraft.com`, `www.yera.com`,
`cdn.shopify.com`, and `d2x7cze2eyr23w.cloudfront.net` (Dubblin's image CDN).
