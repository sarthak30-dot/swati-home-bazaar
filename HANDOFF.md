# Session handoff — 11 Aug 2026

Two separate work streams. **A** is functionally complete but blocked on a manual
step. **B** is done for the homepage and can be extended.

---

## A. Bulk enquiries persistence (`/bulk-orders`)

Goal: stop the bulk-order form composing a mailto/WhatsApp message and start
saving enquiries to Supabase, with an admin screen to triage them.

### Done

| File | What changed |
| --- | --- |
| `supabase/migrations/20260811120000_bulk_enquiries.sql` | **NEW.** Enum, table, grants, 3 RLS policies, 2 indexes. **Not yet applied.** |
| `src/integrations/supabase/types.ts` | Hand-added `bulk_enquiries` row/insert/update types + `bulk_enquiry_status` enum |
| `src/lib/format.ts` | `ENQUIRY_STATUS_LABELS`, mirroring `ORDER_STATUS_LABELS` |
| `src/routes/bulk-orders.tsx` | Inserts on submit, sonner toasts; email/WhatsApp demoted to secondary buttons |
| `src/routes/admin.enquiries.tsx` | **NEW.** Status filter chips, enquiry list, inline status dropdown. Follows `admin.orders.tsx` |
| `src/routes/admin.tsx` | Added "Enquiries" tab to `TABS` |

### ⚠️ Two things you must do

**1. Fill in the RLS `WITH CHECK` predicate.** The migration ships with a
placeholder at roughly line 34:

```sql
CREATE POLICY "bulk enquiries public insert" ON public.bulk_enquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    true  -- <-- REPLACE THIS
  );
```

`true` lets anyone insert unlimited arbitrary rows, and lets them forge
`status` (e.g. insert `status: 'closed'` so the enquiry never appears in a
triage view — a default is not a constraint). A reasonable starting point:

```sql
WITH CHECK (
  status = 'new'
  AND length(trim(name))  BETWEEN 1 AND 120
  AND length(trim(phone)) BETWEEN 1 AND 20
  AND length(coalesce(message, '')) <= 2000
)
```

Trade-off: every constraint here also becomes a way for a *legitimate* submission
to fail with an opaque Postgres `42501`, so mirror anything you enforce here in
the client where you can show a real message. Rate limiting probably belongs at
the Cloudflare/edge layer, not in RLS.

**2. Apply the migration.** Paste the file into the Supabase SQL editor for
project `nvrkfhjsnepwqgjhjekt`.

> Claude could not do this: no Supabase MCP server is connected, `npx supabase`
> failed to install (`ENOSPC`), and `.env` contains only the anon/publishable
> key — no `service_role` key or DB password, so no DDL path exists from the
> workspace. This is unchanged unless you add a service key.

Until applied, the form shows the error toast and falls back to email/WhatsApp.
**That degraded path was verified working** — see below.

### Verified

- `tsc --noEmit` clean; eslint clean on changed files
- Form renders; submit button correctly disabled until name + phone filled
- Submitting fires a real request to
  `https://nvrkfhjsnepwqgjhjekt.supabase.co/rest/v1/bulk_enquiries` → **404**
  (table absent), proving the wiring points at the right project
- Error toast text confirmed verbatim; **form retains user data on failure**
- `/admin/enquiries` resolves and inherits the admin guard (anon → `/auth`)
- Not yet testable: the success path and the admin list, both of which need the table

---

## B. Homepage visual upgrade

Goal: make the site attractive enough to show a client — animation, product
imagery, a "best of each brand" section.

### Key discovery, which changed the whole plan

You asked for AI-generated images. **You already have 372 real product
photographs** in `public/images/products/` (Pigeon 135, Dubblin 59, Yera 178,
24 MB). Real photos of products you actually sell beat AI renders for a
storefront. Claude also has **no image-generation tool available**, so the AI
route was not possible regardless.

**Image quality varies enormously by brand — this is the single most important
fact for future design work:**

| Brand | >800px (hero-quality) | <400px | Verdict |
| --- | --- | --- | --- |
| Pigeon | **0** of 135 | 93 | Catalogue-page crops, low-res, often show fragments of neighbouring products and SKU-number columns. Unusable at large sizes. |
| Dubblin | **59** of 59 | 0 | Excellent, styled, high-res. **The only hero-grade assets you have.** |
| Yera | 0 of 178 | 19 | Mid-size catalogue crops. Fine on cards, not for hero. |

Every Dubblin file is a **catalogue page**: wholesale header text
(`Ctn. 24 Pcs`, `MRP Rs. 939/-`) occupies the top ~25%, with a styled product
photo below. The code crops this out with `origin-bottom scale-[1.55]
object-bottom` — which also keeps **trade pricing off a retail storefront**,
where it could contradict your own displayed price.

### Done

| File | What changed |
| --- | --- |
| `scripts/build-image-manifest.mjs` | **NEW.** Matches catalogue rows to on-disk photos. Re-run with `node scripts/build-image-manifest.mjs` |
| `src/lib/product-images.generated.ts` | **GENERATED (16 KB).** Do not hand-edit |
| `src/components/store/ProductImage.tsx` | Added `resolveProductImage()`; new `variantCode`/`productSlug` props; hover zoom; Dubblin catalogue-crop handling |
| `src/components/store/HomeHero.tsx` | **NEW.** Animated hero: rotating tagline, drifting photo collage, stats, gradient mesh |
| `src/components/store/BrandSpotlight.tsx` | **NEW.** One featured product per brand, auto-picked to guarantee a real photo |
| `src/lib/catalog.ts` | Added `fetchBrandBest(brandSlug, limit)` |
| `src/styles.css` | Keyframes `se-float`, `se-rise`, `se-word`, `se-mesh`; utilities; `prefers-reduced-motion` guard |
| `src/routes/index.tsx` | Old plain hero replaced by `<HomeHero />`; `<BrandSpotlight />` added |
| `ProductCard.tsx`, `cart.tsx`, `product.$sku.tsx` | Pass `variantCode` + `productSlug` through |

### Photo coverage: 25% → 34%

Only 231 of 920 variants had `image_url` set in Supabase; the other 689 rendered
a coloured text tile. **That was the real reason the site looked plain.** The
generated manifest closes part of that gap client-side (no DB write needed):

```
pigeon    565 variants |   8 had | + 74 matched | 483 uncovered |  15%
yera      250 variants | 130 had | +  0 matched | 120 uncovered |  52%
dubblin   105 variants |  93 had | + 12 matched |   0 uncovered | 100%
TOTAL     920          | 231 (25%) -> 317 (34%)  [+86 now showing a photo]
```

`resolveProductImage` checks `imageUrl || byVariant || bySlug`, so a real
`image_url` **always wins** — when you later backfill the column properly, the
fallback silently steps aside with no cleanup.

Matching rules, in confidence order:
1. `variant_code` == filename (this is how the original 231 were populated, e.g. Yera `JR-150` → `JR-150.jpg`)
2. product slug minus brand prefix == filename (Dubblin: `dubblin-crest` → `crest.jpg`)
3. leading word match (Pigeon: `pigeon-amelia-hard-anodised` → `amelia-cooker.jpg`)

**Deliberately excluded:** ~122 Pigeon generic category shots (`cookware2-07`,
`nonstick-14`, `p13-mixer-02`). Attaching one to a specific SKU would show a
shopper **a photograph of a different product**. They are exported separately as
`DECORATIVE_IMAGES` for decoration only, where nothing claims to be a given item.

### Verified

- `tsc --noEmit` clean; eslint clean (2 harmless `react-refresh` warnings)
- Hero: 5 floating tiles, 3 rotator words, **0 broken images**
- Rotator sampled across a full cycle: **0 dead frames** (an earlier version left
  ~1.2s where the headline read "Built for" and nothing) and **0 frames with two
  words legible at once**
- Trade pricing successfully cropped out of hero tiles
- Spotlight picks: Pigeon "Titanium 3L Hard Anodised", Dubblin "Bold", Yera "Pantry Jar"
- **Not yet checked: mobile (390px).** Was interrupted mid-test. Desktop 1280px verified.

---

## Suggested next steps

1. **Apply the migration** (with your `WITH CHECK` predicate) — unblocks stream A entirely.
2. **Verify mobile at 390px** — the hero collage uses `auto-rows-[7rem]` on small screens but this was never confirmed visually.
3. **Photo coverage is the biggest remaining visual win.** 603 variants still show coloured tiles, 483 of them Pigeon. This is a *content* gap, not a code one — the matcher already extracts everything derivable from the current filenames. Options:
   - Get higher-resolution Pigeon photography (its 135 files are all <400px)
   - Name new files after `variant_code` — rule 1 then picks them up with zero code changes
4. **Consider backfilling `image_url` in Supabase** from the manifest, so the mapping lives server-side. Needs a `service_role` key.
5. **Deploy.** Disk was the blocker at 77 MiB but is now **1.3 GiB free (92%)**, so `npm run build` is worth attempting. Untested this session.

---

## Environment gotchas (cost real time — worth knowing)

- **`.claude/launch.json` was rewritten.** The preview server could not start:
  macOS TCC protects `~/Desktop`, so the process the preview harness spawns gets
  `EPERM` from `getcwd()`, and npm calls `process.cwd()` during startup. Fix was
  to bypass bash *and* npm, invoking Node directly on Vite's entry with the project
  root as a **positional** argument (`--root` is not a valid Vite flag):

  ```json
  "runtimeExecutable": "/usr/local/bin/node",
  "runtimeArgs": [".../node_modules/vite/bin/vite.js", "dev",
                  "/Users/bharatjain/Desktop/Swati Enterprises/swati-home-bazaar-main",
                  "--port", "8080"]
  ```

  Paths are absolute and machine-specific — unavoidable, since relative paths are
  exactly what cannot resolve without a valid cwd. **Permanent fix:** grant the
  app Desktop/Full Disk Access in System Settings → Privacy & Security, or move
  the project out of `~/Desktop`.

- **`.env` values are quoted** — strip quotes when parsing in scripts.
- **New route files need the dev server to run once** to regenerate
  `src/routeTree.gen.ts`, otherwise `tsc` fails on a `Link` to the new route.
- Disk was at 77 MiB / 100% for most of the session. Now 1.3 GiB.
- `.import-work/combined_schema.sql` was **not** updated with the new table — it
  reads as a point-in-time import snapshot. `supabase/migrations/` is the live source.
- Pre-existing lint error at `src/routes/admin.tsx:37` (prettier wrap on the
  Loading div) — not from this session's changes.
