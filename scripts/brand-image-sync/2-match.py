"""Strict matcher, v2. Rebuilt after an audit of v1 found two false-match
classes:

  * a size-blind rule gave the 10-inch Steelo Kadai photo to the 12" and 13"
    SKUs, because the field used as a discriminator held "2mm" (a thickness);
  * a code appearing inside a COMBO title ("Polo Combo Set (B16FL + B35FL +
    B55FL)") matched each single bowl to the photo of the three-piece set.

So sizes are now compared per unit, and combo-ness must agree on both sides.
"""
import json, re, urllib.request, collections

ENV = {}
for line in open("/home/user/swati-home-bazaar/.env"):
    if "=" in line:
        k, v = line.strip().split("=", 1); ENV[k] = v.strip().strip('"').strip("'")
URL, KEY = ENV["VITE_SUPABASE_URL"], ENV["VITE_SUPABASE_PUBLISHABLE_KEY"]

def rest(path):
    r = urllib.request.Request(URL + "/rest/v1/" + path, headers={"apikey": KEY})
    return json.load(urllib.request.urlopen(r, timeout=60))

rows, off = [], 0
while True:
    p = rest(f"catalog_variants?select=id,sku_id,variant_code,product_name,capacity_or_size,brand_slug,image_url&limit=1000&offset={off}")
    rows += p
    if len(p) < 1000: break
    off += 1000

norm = lambda s: re.sub(r"[^a-z0-9]", "", (s or "").lower())
def words(s): return [w for w in re.split(r"[^a-z0-9]+", (s or "").lower()) if w]

UNIT = {"l":"l","litre":"l","litres":"l","liter":"l","ltr":"l",
        "ml":"ml","cm":"cm","mm":"mm","inch":"in","inches":"in","in":"in","\"":"in"}

def sizes(text):
    """{unit: {numbers}} for every number that carries a unit."""
    t = (text or "").lower().replace('"', " inch ")
    out = collections.defaultdict(set)
    for num, unit in re.findall(r"(\d+(?:\.\d+)?)\s*([a-z\"]+)", t):
        u = UNIT.get(unit)
        if u: out[u].add(float(num))
    return out

def size_conflict(a, b):
    """True when both name a size in the SAME unit and the numbers differ."""
    for u in set(a) & set(b):
        if not (a[u] & b[u]):
            return True
    return False

COMBO = re.compile(r"\b(combo|set|combination|nested|party set|pack of)\b", re.I)
def is_combo(text, code=None):
    return bool(COMBO.search(text or "")) or "+" in (code or "") or "+" in (text or "")

sources = []
for p in json.load(open("harvest/pigeon.json")):
    if p.get("images") and p.get("name"):
        cover = next((i for i in p["images"] if "Cover" in i.get("alt","")), p["images"][0])
        sources.append({"brand":"pigeon","title":p["name"],"page":p["url"],"image":cover["src"]})
for p in json.load(open("sites/yera-all.json")):
    if p.get("images"):
        sources.append({"brand":"yera","title":p["title"],
                        "page":"https://www.yera.com/products/"+p.get("handle",""),
                        "image":p["images"][0]["src"]})
for s in sources:
    s["n"]=norm(s["title"]); s["w"]=set(words(s["title"]))
    # Code tokens: maximal runs of letters/digits/hyphen, plus each adjacent
    # PAIR concatenated, so "PSR 550-425" yields psr550425 while JR1500STK
    # never yields jr150. Substring matching did the opposite and gave the
    # JR-150 jar the photo of JR1500STK.
    toks=[t for t in re.findall(r"[A-Za-z0-9][A-Za-z0-9-]*", s["title"])]
    cand={norm(t) for t in toks}
    cand|={norm(toks[i]+toks[i+1]) for i in range(len(toks)-1)}
    s["codes"]={c for c in cand if c}
    s["sz"]=sizes(s["title"]); s["combo"]=is_combo(s["title"])

STOP={"pigeon","yera","dubblin","set","of","pack","pcs","pc","with","and","the",
      "ml","ltr","l","cm","mm","combo","piece","glass","steel","stainless","series"}

matches, reasons = {}, collections.Counter()
for v in rows:
    pool=[s for s in sources if s["brand"]==v["brand_slug"]]
    if not pool: reasons["no source for brand"]+=1; continue

    vtext = f"{v['product_name']} {v.get('capacity_or_size') or ''}"
    vsz   = sizes(vtext)
    vcombo= is_combo(v["product_name"], v.get("variant_code"))
    code  = norm(v.get("variant_code"))
    hit=None

    def acceptable(s):
        if s["combo"] != vcombo: return False          # combo-ness must agree
        if size_conflict(vsz, s["sz"]): return False    # 12" never takes 10"
        return True

    if code and len(code) >= 4:
        for s in pool:
            if code in s["codes"] and acceptable(s): hit=(s,"A code-token"); break
    if not hit:
        pn=norm(v["product_name"])
        if len(pn)>=6:
            for s in pool:
                if pn==s["n"] and acceptable(s): hit=(s,"B exact-name"); break
    if not hit:
        vw=[w for w in words(v["product_name"]) if w not in STOP and not w.isdigit()]
        # Rule C now REQUIRES a real size on both sides that agrees.
        if len(vw)>=2 and vsz:
            for s in pool:
                if (all(w in s["w"] for w in vw) and s["sz"]
                        and set(vsz) & set(s["sz"]) and acceptable(s)):
                    hit=(s,"C name+size"); break

    if hit:
        s,why=hit
        matches[v["sku_id"]]={"sku_id":v["sku_id"],"variant_code":v.get("variant_code"),
          "product_name":v["product_name"],"capacity":v.get("capacity_or_size"),
          "brand":v["brand_slug"],"rule":why,"source_title":s["title"],
          "source_page":s["page"],"image":s["image"],"had_image":bool(v.get("image_url"))}
        reasons[why]+=1
    else:
        reasons["unmatched"]+=1

json.dump(list(matches.values()), open("harvest/matches.json","w"), indent=1)
print("variants:",len(rows),"| sources:",len(sources))
for k,n in reasons.most_common(): print(f"  {k:22} {n}")
print(f"\nmatched {len(matches)}  | new coverage (no image today): {sum(1 for m in matches.values() if not m['had_image'])}")
dup=collections.Counter(m["image"] for m in matches.values())
print("images used by >1 SKU:",sum(1 for n in dup.values() if n>1))
for i,n in dup.most_common(4):
    if n>1: print(f"   x{n} {[m['sku_id'] for m in matches.values() if m['image']==i][:5]}")
