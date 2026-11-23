"""Step 10: report which products would remain if the catalogue were filtered
to those carrying a sourced description, and which of them still lack an image.

Writes two files at the repo root:
  portal-products.csv                 every product that would remain
  portal-products-missing-images.csv  those among them with no image at all

Read-only: this writes nothing to the database. It exists so the trade-off is
visible before anyone hides or deletes products.

The headline finding is in the per-brand split. Dubblin has zero descriptions
— not because its products are undocumented but because its website cannot be
enumerated — while being the best-photographed brand at 89%. Filtering on
descriptions therefore removes a whole brand, and 96 SKUs that do have images,
which is unlikely to be what anyone wants. Prefer `is_active = false` over a
delete: the storefront already filters on it, so the data, SKUs and images
survive and the change is reversible.

Needs .image-sync/chosen-details.json from step 9.
"""

import collections
import csv
import json
import os
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WORK = os.path.join(ROOT, ".image-sync")

ENV = {}
with open(os.path.join(ROOT, ".env")) as fh:
    for line in fh:
        if "=" in line:
            k, v = line.strip().split("=", 1)
            ENV[k] = v.strip().strip('"').strip("'")

URL = ENV["VITE_SUPABASE_URL"]
KEY = ENV["VITE_SUPABASE_PUBLISHABLE_KEY"]


def rest(path):
    """Fetch every page of a PostgREST collection."""
    rows, offset = [], 0
    while True:
        req = urllib.request.Request(
            f"{URL}/rest/v1/{path}&limit=1000&offset={offset}", headers={"apikey": KEY}
        )
        page = json.load(urllib.request.urlopen(req, timeout=60))
        rows += page
        if len(page) < 1000:
            break
        offset += 1000
    return rows


variants = rest("product_variants?select=sku_id,product_id,image_url,variant_code")
products = rest("products?select=id,name,brand_id,category_id")
brands = {b["id"]: b["name"] for b in rest("brands?select=id,name")}
categories = {c["id"]: c["name"] for c in rest("categories?select=id,name")}

with_detail = set(json.load(open(os.path.join(WORK, "chosen-details.json"))))

by_product = collections.defaultdict(list)
for v in variants:
    by_product[v["product_id"]].append(v)

keep = sorted(
    (p for p in products if p["id"] in with_detail),
    key=lambda p: (brands[p["brand_id"]], categories.get(p["category_id"]) or "~", p["name"]),
)

rows = []
for p in keep:
    vs = by_product[p["id"]]
    imaged = [v for v in vs if v["image_url"]]
    rows.append(
        {
            "brand": brands[p["brand_id"]],
            "category": categories.get(p["category_id"]) or "Uncategorised",
            "product": p["name"],
            "skus": len(vs),
            "skus_with_image": len(imaged),
            "image_status": "all" if len(imaged) == len(vs) else ("some" if imaged else "none"),
            "codes": ", ".join(sorted(v["variant_code"] or v["sku_id"] for v in vs)),
        }
    )

fields = ["brand", "category", "product", "skus", "skus_with_image", "image_status", "codes"]
with open(os.path.join(ROOT, "portal-products.csv"), "w", newline="") as fh:
    writer = csv.DictWriter(fh, fieldnames=fields)
    writer.writeheader()
    writer.writerows(rows)

with open(os.path.join(ROOT, "portal-products-missing-images.csv"), "w", newline="") as fh:
    writer = csv.writer(fh)
    writer.writerow(["brand", "category", "product", "skus", "codes"])
    for r in rows:
        if r["image_status"] == "none":
            writer.writerow([r["brand"], r["category"], r["product"], r["skus"], r["codes"]])

total_skus = sum(r["skus"] for r in rows)
per_brand = collections.Counter(r["brand"] for r in rows)
per_skus = collections.Counter()
no_image = collections.Counter()
partial = collections.Counter()
for r in rows:
    per_skus[r["brand"]] += r["skus"]
    if r["image_status"] == "none":
        no_image[r["brand"]] += 1
    elif r["image_status"] == "some":
        partial[r["brand"]] += 1

print(f"unique products that would remain: {len(rows)}")
print(f"sellable SKUs:                     {total_skus}")
print(f"\n  {'brand':10} {'products':>9} {'SKUs':>6} {'no image':>9} {'part image':>11}")
for b in ("Pigeon", "Yera", "Dubblin"):
    print(f"  {b:10} {per_brand[b]:9} {per_skus[b]:6} {no_image[b]:9} {partial[b]:11}")
print(
    f"  {'TOTAL':10} {len(rows):9} {total_skus:6} "
    f"{sum(no_image.values()):9} {sum(partial.values()):11}"
)
