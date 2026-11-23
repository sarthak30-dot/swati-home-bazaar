"""Step 11: write the sourced descriptions and feature bullets to the catalogue.

Reads .image-sync/chosen-details.json (step 9) and sets, per product:

  products.description     the manufacturer's own copy
  products.specifications  MERGED with {"features": [...]} where bullets exist

The merge matters: specifications already holds keys such as {"series":
"Titanium"} and overwriting would drop them.

Needs an ADMIN login, since `products` is admin-write:

    export SWATI_ADMIN_EMAIL=you@example.com
    export SWATI_ADMIN_PASSWORD=...

Re-running is safe — every write is idempotent.
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

details = json.load(open(os.path.join(WORK, "chosen-details.json")))
print("products to update:", len(details))

# Existing specifications, so the merge preserves keys already there.
existing = {}
offset = 0
while True:
    page = json.loads(
        call("GET", f"/rest/v1/products?select=id,specifications&limit=1000&offset={offset}")
    )
    for row in page:
        existing[row["id"]] = row.get("specifications") or {}
    if len(page) < 1000:
        break
    offset += 1000


def write(item):
    pid, d = item
    desc = (d.get("desc") or "").strip()
    if not desc:
        return ("skipped", pid, "no description")
    specs = dict(existing.get(pid) or {})
    feats = [f for f in (d.get("features") or []) if f]
    if feats:
        specs["features"] = feats
    body = json.dumps({"description": desc, "specifications": specs}).encode()
    try:
        call(
            "PATCH",
            "/rest/v1/products?id=eq." + urllib.parse.quote(pid),
            body,
            {**AUTH, "Content-Type": "application/json", "Prefer": "return=minimal"},
        )
        return ("ok", pid, "features" if feats else "description only")
    except urllib.error.HTTPError as exc:
        return ("failed", pid, f"{exc.code} {exc.read()[:90].decode()}")


results = []
with cf.ThreadPoolExecutor(max_workers=6) as pool:
    for i, res in enumerate(pool.map(write, details.items()), 1):
        results.append(res)
        if i % 100 == 0:
            print(f"  {i}/{len(details)}", flush=True)

tally = collections.Counter(r[0] for r in results)
with_feats = sum(1 for r in results if r[0] == "ok" and r[2] == "features")
print(f"\nwritten {tally['ok']}  skipped {tally['skipped']}  failed {tally['failed']}")
print(f"  of those, carrying feature bullets: {with_feats}")
for r in results:
    if r[0] == "failed":
        print("   FAILED", r[1], r[2])
        break
