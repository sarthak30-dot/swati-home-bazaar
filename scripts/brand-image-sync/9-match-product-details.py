"""Step 9: match harvested detail to products and write a review CSV.

Pigeon matches on variant_code; Yera on a code token in the feed title, or
failing that on the page its image already came from (image_source_url).
Nothing is written to the database here -- the output is
product-details-sourced.csv for review.
"""
import json, re, html, urllib.request, collections, csv
D=json.load(open("harvest/details.json"))
PIG=D["pigeon_by_code"]; YERA=D["yera"]
ENV={}
for l in open("/home/user/swati-home-bazaar/.env"):
    if "=" in l:
        k,v=l.strip().split("=",1); ENV[k]=v.strip().strip('"').strip("'")
U,K=ENV["VITE_SUPABASE_URL"],ENV["VITE_SUPABASE_PUBLISHABLE_KEY"]
rows,off=[],0
while True:
    r=urllib.request.Request(U+f"/rest/v1/product_variants?select=sku_id,variant_code,product_id,image_source_url,products(name,brands(slug))&limit=1000&offset={off}",headers={"apikey":K})
    p=json.load(urllib.request.urlopen(r,timeout=60)); rows+=p
    if len(p)<1000: break
    off+=1000
# flatten the embedded product/brand
for v in rows:
    pr=v.get("products") or {}
    v["product_name"]=pr.get("name")
    v["brand_slug"]=((pr.get("brands") or {}) or {}).get("slug")
norm=lambda s:re.sub(r"[^a-z0-9]","",(s or "").lower())

yby_handle={y["handle"]:y for y in YERA}
ycode={}
for y in YERA:
    for t in re.findall(r"[A-Za-z0-9][A-Za-z0-9.\-]*",y["title"]):
        ycode.setdefault(norm(t),y)

# product_id -> chosen detail, with the rule that produced it
chosen={}
for v in rows:
    pid=v["product_id"]; b=v["brand_slug"]
    if pid in chosen: continue
    if b=="pigeon":
        d=PIG.get(v.get("variant_code") or "")
        if d: chosen[pid]=("pigeon:code", d["description"], d, v)
        elif v.get("image_source_url"):
            m=[x for x in PIG.values() if x["url"]==(v.get("image_source_url") or "\0")]
            if m: chosen[pid]=("pigeon:image-page", m[0]["description"], m[0], v)
    elif b=="yera":
        y=ycode.get(norm(v.get("variant_code") or ""))
        if y: chosen[pid]=("yera:code", y["desc"], y, v)
        elif (v.get("image_source_url") or "").startswith("https://www.yera.com/products/"):
            h=v["image_source_url"].rsplit("/",1)[-1]
            if h in yby_handle: chosen[pid]=("yera:image-page", yby_handle[h]["desc"], yby_handle[h], v)

prods=collections.defaultdict(list)
for v in rows: prods[v["product_id"]].append(v)
tot_prod=len(prods)
by_brand=collections.Counter()
for pid,vs in prods.items(): by_brand[vs[0]["brand_slug"]]+=1
cov=collections.Counter(); rule=collections.Counter()
for pid,(r,desc,d,v) in chosen.items():
    cov[v["brand_slug"]]+=1; rule[r]+=1

print(f"products total: {tot_prod}")
for b in ("pigeon","yera","dubblin"):
    print(f"  {b:8} {cov[b]:4} of {by_brand[b]:4} products have a sourced description  ({100*cov[b]//max(by_brand[b],1)}%)")
print(f"  TOTAL    {len(chosen):4} of {tot_prod}  ({100*len(chosen)//tot_prod}%)")
print("\nby rule:", dict(rule))

feats=sum(1 for _,(r,desc,d,v) in chosen.items() if d.get("features"))
print("products that also have feature bullets:",feats)

with open("/home/user/swati-home-bazaar/product-details-sourced.csv","w",newline="") as f:
    w=csv.writer(f); w.writerow(["product_name","brand","match_rule","description","features","source"])
    for pid,(r,desc,d,v) in sorted(chosen.items(), key=lambda kv:(kv[1][3]["brand_slug"],kv[1][3]["product_name"])):
        w.writerow([v["product_name"],v["brand_slug"],r,desc or "",
                    " | ".join(d.get("features") or []) if isinstance(d.get("features"),list) else "",
                    d.get("url") or ("https://www.yera.com/products/"+d.get("handle","")) ])
print("\nwrote product-details-sourced.csv")
json.dump({str(k):{"rule":v[0],"desc":v[1],"features":v[2].get("features") or [],
                   "source":v[2].get("url") or ("https://www.yera.com/products/"+(v[2].get("handle") or "")),
                   "name":v[3]["product_name"],"brand":v[3]["brand_slug"]}
           for k,v in chosen.items()}, open("harvest/chosen-details.json","w"))
print("\n--- samples ---")
seen=set()
for pid,(r,desc,d,v) in chosen.items():
    if r in seen: continue
    seen.add(r)
    print(f"\n[{r}] {v['product_name']} ({v['brand_slug']})")
    print(f"  {(desc or '')[:230]}")
    if d.get("features"): print(f"  features: {d['features'][:4]}")
