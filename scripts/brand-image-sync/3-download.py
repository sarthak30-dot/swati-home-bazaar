import json, os, urllib.request, concurrent.futures as cf, collections, struct
M=json.load(open("harvest/matches.json"))
os.makedirs("harvest/img", exist_ok=True)
UA={"User-Agent":"Mozilla/5.0 (compatible; catalogue-image-sync/1.0)"}

def dims(b):
    try:
        if b[:2]==b'\xff\xd8':  # jpeg
            i=2
            while i<len(b):
                if b[i]!=0xFF: i+=1; continue
                m=b[i+1]
                if m in (0xC0,0xC1,0xC2,0xC3):
                    h,w=struct.unpack('>HH',b[i+5:i+9]); return w,h
                i+=2+struct.unpack('>H',b[i+2:i+4])[0]
        if b[:8]==b'\x89PNG\r\n\x1a\n':
            w,h=struct.unpack('>II',b[16:24]); return w,h
        if b[:4]==b'RIFF' and b[8:12]==b'WEBP':
            if b[12:16]==b'VP8X':
                w=1+int.from_bytes(b[24:27],'little'); h=1+int.from_bytes(b[27:30],'little'); return w,h
            if b[12:16]==b'VP8 ':
                return struct.unpack('<HH', b[26:30])[0]&0x3fff, struct.unpack('<HH', b[28:32])[0]&0x3fff
            if b[12:16]==b'VP8L':
                n=int.from_bytes(b[21:25],'little'); return (n&0x3FFF)+1, ((n>>14)&0x3FFF)+1
    except Exception: pass
    return None,None

def grab(m):
    url=m["image"]; ext=(url.split("?")[0].rsplit(".",1)[-1] or "jpg").lower()
    if ext not in ("jpg","jpeg","png","webp"): ext="jpg"
    path=f"harvest/img/{m['sku_id'].replace('/','_')}.{ext}"
    try:
        b=urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=60).read()
        open(path,"wb").write(b)
        w,h=dims(b)
        return {**m,"file":path,"bytes":len(b),"w":w,"h":h}
    except Exception as e:
        return {**m,"file":None,"error":str(e)[:70]}

out=[]
with cf.ThreadPoolExecutor(max_workers=6) as ex:
    for i,r in enumerate(ex.map(grab,M),1):
        out.append(r)
        if i%40==0: print("  ",i,"/",len(M),flush=True)
json.dump(out,open("harvest/downloaded.json","w"),indent=1)

ok=[r for r in out if r.get("file")]
err=[r for r in out if not r.get("file")]
print(f"\ndownloaded {len(ok)} / {len(M)}   failed {len(err)}")
print("total MB:", round(sum(r['bytes'] for r in ok)/1e6,1))
big=[r for r in ok if (r.get('w') or 0)>=800]
mid=[r for r in ok if 400<=(r.get('w') or 0)<800]
small=[r for r in ok if 0<(r.get('w') or 0)<400]
unk=[r for r in ok if not r.get('w')]
print(f"  >=800px wide: {len(big)}   400-799: {len(mid)}   <400: {len(small)}   unknown: {len(unk)}")
print("  by brand:", collections.Counter(r['brand'] for r in ok))
for r in ok[:6]: print(f"   {r['sku_id']:12} {r['w']}x{r['h']} {round(r['bytes']/1024)}KB {r['file'].split('/')[-1]}")
for e in err[:4]: print("   ERR",e['sku_id'],e.get('error'))
