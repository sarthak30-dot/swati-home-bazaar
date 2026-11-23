"""Step 8: harvest PRODUCT DETAIL (not images) from stovekraft.com.

Each Pigeon page carries a short marketing description, the HANA product
code -- which is this catalogue's variant_code -- the MRP, feature bullets,
and the sibling sizes with their own codes. Keying on the code means detail
attaches to SKUs exactly, with none of the name matching the images needed:
91% of Pigeon variants match this way against 24% for images.

Yera needs no scraping: its Shopify feed at
https://www.yera.com/products.json?limit=250 already carries body_html for
all 248 products. Dubblin remains unavailable (see README).

Writes .image-sync/pigeon-details.json.
"""
import concurrent.futures as cf, html, json, re, urllib.request

UA = {"User-Agent": "Mozilla/5.0 (compatible; catalogue-detail-sync/1.0)"}
def get(u, t=45):
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=t).read().decode("utf-8","replace")

urls = [r["url"] for r in json.load(open("harvest/pigeon.json"))]
print("pages:", len(urls), flush=True)

H1   = re.compile(r'<h1[^>]*>\s*(.*?)\s*</h1>', re.S)
DESC = re.compile(r'<p class="my-4 text-sm text-gray-600[^"]*">(.*?)</p>', re.S)
CODE = re.compile(r'Product Code:\s*([A-Za-z0-9\-]+)')
MRP  = re.compile(r'MRP\s*:\s*<span[^>]*>\s*₹\s*([0-9,.]+)')
SIB  = re.compile(r'<h4 class="font-medium my-1">\s*<span[^>]*>(.*?)</span>\s*:\s*HANA Code:\s*([A-Za-z0-9\-]+)\s*\|\s*MRP\s*:\s*<span[^>]*>\s*₹\s*([0-9,.]+)', re.S)
ICONS= re.compile(r'<div class="product_icons">(.*?)</div>\s*</div>\s*</div>', re.S)
FEAT = re.compile(r'<p class="text-sm text-center my-3">\s*(.*?)\s*</p>', re.S)

def clean(s):
    s = re.sub(r"<[^>]+>", " ", s or "")
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip().strip('"').strip()

def scrape(u):
    try:
        h = get(u)
    except Exception as e:
        return {"url": u, "error": str(e)[:70]}
    i = h.find("product_info")
    seg = h[i:i+9000] if i > -1 else h
    icons = ICONS.search(h)
    feats = [clean(f) for f in FEAT.findall(icons.group(1))] if icons else []
    crumbs = u.rstrip("/").split("/")
    return {
        "url": u,
        "name": clean((H1.search(seg) or [None,""])[1]) if H1.search(seg) else None,
        "description": clean((DESC.search(seg) or [None,""])[1]) if DESC.search(seg) else None,
        "code": (CODE.search(seg).group(1) if CODE.search(seg) else None),
        "mrp": (MRP.search(seg).group(1).replace(",","") if MRP.search(seg) else None),
        "siblings": [{"size": clean(s), "code": c, "mrp": m.replace(",","")} for s,c,m in SIB.findall(seg)],
        "features": [f for f in feats if f],
        "department": crumbs[-3] if len(crumbs) > 3 else None,
        "category": crumbs[-2],
    }

out=[]
with cf.ThreadPoolExecutor(max_workers=5) as ex:
    for i,r in enumerate(ex.map(scrape, urls), 1):
        out.append(r)
        if i % 70 == 0: print(f"  {i}/{len(urls)}", flush=True)
json.dump(out, open("harvest/pigeon-details.json","w"), indent=1)

ok=[r for r in out if not r.get("error")]
print(f"\nscraped {len(ok)}/{len(out)}  errors={len(out)-len(ok)}")
print("  with description:", sum(1 for r in ok if r.get("description")))
print("  with product code:", sum(1 for r in ok if r.get("code")))
print("  with features    :", sum(1 for r in ok if r.get("features")))
sibs=sum(len(r.get("siblings") or []) for r in ok)
codes={r["code"] for r in ok if r.get("code")} | {s["code"] for r in ok for s in (r.get("siblings") or [])}
print(f"  sibling variants listed: {sibs}   distinct codes overall: {len(codes)}")
for r in ok[:3]:
    print(f"\n  [{r['name']}] code={r['code']} mrp={r['mrp']}")
    print(f"    desc: {(r['description'] or '')[:120]}")
    print(f"    feats: {r['features'][:3]}")
    print(f"    siblings: {r['siblings']}")
