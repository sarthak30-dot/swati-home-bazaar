"""Harvest Pigeon products from stovekraft.com.

Each product page embeds its OWN images in an Alpine.js `slides` array inside
<div class="product_slider">, labelled 'Cover Image' / 'Gallery Image N'. That
is the only block on the page that belongs to this product -- the other
/storage/products/ URLs are nav carousels and related items -- so the array is
parsed directly rather than scraping every <img> on the page.
"""
import concurrent.futures as cf, html, json, re, sys, urllib.request

SITEMAP = "https://www.stovekraft.com/sitemap.xml"
UA = {"User-Agent": "Mozilla/5.0 (compatible; catalogue-image-sync/1.0)"}

def get(url, timeout=40):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout).read().decode("utf-8", "replace")

sm = get(SITEMAP)
urls = re.findall(r"<loc>([^<]+)</loc>", sm)
# Product pages sit at /pigeon/category/<dept>/<cat>/<product>; anything with
# fewer segments is a department or category index.
prod = [u for u in urls if re.search(r"/pigeon/category/[^/]+/[^/]+/[^/]+$", u)]
print(f"sitemap urls={len(urls)} product pages={len(prod)}", flush=True)

SLIDES = re.compile(r"slides:\s*\[(.*?)\]", re.S)
IMG = re.compile(r"imgSrc:\s*'([^']+)'\s*,\s*imgAlt:\s*'([^']*)'")
H1 = re.compile(r"<h1[^>]*>\s*(.*?)\s*</h1>", re.S)

def scrape(u):
    try:
        h = get(u)
    except Exception as e:
        return {"url": u, "error": str(e)[:80]}
    m = SLIDES.search(h)
    imgs = []
    if m:
        for src, alt in IMG.findall(m.group(1)):
            if "/storage/products/" in src:
                imgs.append({"src": "https://www.stovekraft.com" + src, "alt": alt})
    t = H1.search(h)
    name = html.unescape(re.sub(r"<[^>]+>", "", t.group(1))).strip() if t else None
    crumbs = u.rstrip("/").split("/")
    return {"url": u, "name": name, "slug": crumbs[-1],
            "department": crumbs[-3] if len(crumbs) > 3 else None,
            "category": crumbs[-2], "images": imgs}

out = []
with cf.ThreadPoolExecutor(max_workers=5) as ex:
    for i, r in enumerate(ex.map(scrape, prod), 1):
        out.append(r)
        if i % 60 == 0: print(f"  {i}/{len(prod)}", flush=True)

json.dump(out, open("harvest/pigeon.json", "w"), indent=1)
ok = [r for r in out if r.get("images")]
print(f"scraped={len(out)} with_images={len(ok)} errors={sum(1 for r in out if r.get('error'))}")
print(f"total images={sum(len(r['images']) for r in ok)}")
for r in ok[:5]:
    print(f"  {r['name'][:46]:46} {len(r['images'])} imgs  [{r['category']}]")
