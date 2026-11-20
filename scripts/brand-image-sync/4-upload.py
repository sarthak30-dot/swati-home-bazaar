"""Step 4: upload matched images to Supabase Storage and attach them to SKUs.

Reads .image-sync/downloaded.json (step 3), uploads each file to the
`product-images` bucket under a `brand-sourced/` prefix, then sets both
`image_url` and `image_source_url` on the variant.

Needs an ADMIN login: the bucket's RLS policy is
`bucket_id = 'product-images' AND has_role(auth.uid(),'admin')`, and
`product_variants` is likewise admin-write. Set these before running:

    export SWATI_ADMIN_EMAIL=you@example.com
    export SWATI_ADMIN_PASSWORD=...

Re-running is safe: uploads use x-upsert, and the PATCH is idempotent.
"""

import collections
import concurrent.futures as cf
import json
import os
import urllib.error
import urllib.parse
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
EMAIL = os.environ.get("SWATI_ADMIN_EMAIL")
PASSWORD = os.environ.get("SWATI_ADMIN_PASSWORD")
if not EMAIL or not PASSWORD:
    raise SystemExit("set SWATI_ADMIN_EMAIL and SWATI_ADMIN_PASSWORD first")

BUCKET = "product-images"

CONTENT_TYPE = {
    "webp": "image/webp",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
}


def call(method, path, data=None, headers=None):
    head = {"apikey": KEY}
    head.update(headers or {})
    req = urllib.request.Request(URL + path, data=data, headers=head, method=method)
    return urllib.request.urlopen(req, timeout=120).read()


token = json.loads(
    call(
        "POST",
        "/auth/v1/token?grant_type=password",
        json.dumps({"email": EMAIL, "password": PASSWORD}).encode(),
        {"Content-Type": "application/json"},
    )
)["access_token"]
AUTH = {"Authorization": "Bearer " + token}
print("signed in as", EMAIL)

rows = [r for r in json.load(open(os.path.join(WORK, "downloaded.json"))) if r.get("file")]
print("to upload:", len(rows))


def upload(row):
    ext = row["file"].rsplit(".", 1)[-1].lower()
    # Namespaced so a hand-upload from the admin panel, which writes
    # "<sku>.<ext>" at the bucket root, can never be silently overwritten.
    key = f"brand-sourced/{row['sku_id'].replace('/', '_')}.{ext}"
    try:
        # The bucket name is part of the path. Omitting it makes Storage read
        # the first path segment as the bucket and return "Bucket not found".
        call(
            "POST",
            f"/storage/v1/object/{BUCKET}/{urllib.parse.quote(key)}",
            open(row["file"], "rb").read(),
            {**AUTH, "Content-Type": CONTENT_TYPE.get(ext, "image/jpeg"), "x-upsert": "true"},
        )
        return {
            **row,
            "key": key,
            "public": f"{URL}/storage/v1/object/public/{BUCKET}/{urllib.parse.quote(key)}",
        }
    except urllib.error.HTTPError as exc:
        return {**row, "key": None, "err": f"{exc.code} {exc.read()[:120].decode()}"}


results = []
with cf.ThreadPoolExecutor(max_workers=5) as pool:
    for i, res in enumerate(pool.map(upload, rows), 1):
        results.append(res)
        if i % 40 == 0:
            print(f"  uploaded {i}/{len(rows)}", flush=True)

ok = [r for r in results if r.get("key")]
bad = [r for r in results if not r.get("key")]
print(f"uploaded {len(ok)}/{len(rows)}, failed {len(bad)}")
for b in bad[:5]:
    print("   ERR", b["sku_id"], b.get("err"))
json.dump(results, open(os.path.join(WORK, "uploaded.json"), "w"), indent=1)

updated = failed = 0
for r in ok:
    body = json.dumps(
        {"image_url": r["public"], "image_source_url": r["source_page"]}
    ).encode()
    try:
        call(
            "PATCH",
            "/rest/v1/product_variants?sku_id=eq." + urllib.parse.quote(r["sku_id"]),
            body,
            {**AUTH, "Content-Type": "application/json", "Prefer": "return=minimal"},
        )
        updated += 1
    except urllib.error.HTTPError as exc:
        failed += 1
        if failed < 4:
            print("   patch failed", r["sku_id"], exc.code, exc.read()[:100].decode())

print(f"image_url set on {updated} variants, {failed} failed")
print("by brand:", dict(collections.Counter(r["brand"] for r in ok)))
