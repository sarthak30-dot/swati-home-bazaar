#!/usr/bin/env python3
"""
Extract the product from supplier-catalogue crops.

Most Pigeon and Yera files in public/images/products are crops of printed
catalogue pages: next to the product they carry spec text, trade prices
("M.R.P.: Rs. 325.00 / Carton - 24"), SKU columns, coloured side bars, hairline
rules and fragments of neighbouring products. Showing those on a retail
storefront looks broken and can contradict the shop's own price.

This script finds the main product in each crop, discards text / bars / rules /
edge fragments, and writes a clean square image on white. Files it cannot
extract confidently are reported (and listed in src/lib/image-quality.ts) so the
storefront shows a "photo coming soon" tile rather than a scan.

Usage (needs opencv-python-headless + numpy + pillow):
  python3 scripts/clean-catalogue-crops.py <brand> [--out DIR] [--report FILE]
Originals are never modified unless --in-place is passed.
"""
import argparse, json, os, sys
import cv2
import numpy as np
from PIL import Image

SIZE = 800          # output canvas
FILL = 0.84         # product occupies at most this share of the canvas
MAX_UPSCALE = 3.0


def foreground_mask(rgb):
    """Anything that is not (near) white paper."""
    mn = rgb.min(axis=2)
    mx = rgb.max(axis=2)
    return ((mn < 238) | ((mx - mn) > 28)).astype(np.uint8)


def clean(rgb):
    h, w = rgb.shape[:2]
    m = foreground_mask(rgb)

    # --- 1. remove solid bars and hairline rules -------------------------------
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        fill = area / max(1, bw * bh)
        is_rule = (bh <= 5 and bw > 0.25 * w) or (bw <= 5 and bh > 0.25 * h)
        is_bar = fill > 0.8 and (bh > 0.45 * h or bw > 0.45 * w) and min(bw, bh) >= 6
        is_solid_block = fill > 0.85 and area > 0.015 * w * h and min(bw, bh) >= 12
        if is_rule or is_bar or is_solid_block:
            m[lab == i] = 0

    # --- 2. remove text and flat graphics ---------------------------------------
    # Glyph-sized dark components are printed text (spec lines, prices, SKU
    # columns, captions). Flat single-colour shapes (arrows, swatches) are
    # catalogue graphics, not products.
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        sel = lab == i
        if bh <= 28 and bw <= 230 and gray[sel].min() < 150:
            m[sel] = 0
            continue
        if area > 300:
            px = rgb[sel].astype(np.int16)
            near_median = (np.abs(px - np.median(px, axis=0)).max(axis=1) < 14).mean()
            if near_median > 0.85:
                m[sel] = 0  # flat single-colour graphic

    close_small = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    close_big = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    n, lab, stats, cent = cv2.connectedComponentsWithStats(close_big, connectivity=8)
    n_s, lab_s, stats_s, _ = cv2.connectedComponentsWithStats(close_small, connectivity=8)

    cands = []
    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        if bw < 40 or bh < 40:
            continue
        region = lab == i
        # largest small-close piece inside this blob
        pieces = np.unique(lab_s[region & (lab_s > 0)])
        biggest = max((max(stats_s[p][2], stats_s[p][3]) for p in pieces), default=0)
        if biggest < 0.55 * max(bw, bh) and biggest < 60:
            continue  # all small fragments -> leftover text
        edge = 6  # a product this close to the crop edge was cut off by the crop
        touches = (x <= edge) + (y <= edge) + (x + bw >= w - edge) + (y + bh >= h - edge)
        cands.append(dict(i=i, box=(x, y, bw, bh), area=int(area), touches=int(touches), biggest=int(biggest)))
    return m, cands


def extract(path):
    img = Image.open(path).convert("RGB")
    rgb = np.array(img)
    h, w = rgb.shape[:2]
    m, cands = clean(rgb)
    if not cands:
        return None, "no-product"
    # Prefer blobs that do not touch the crop edge (edge blobs are neighbour fragments).
    inner = [c for c in cands if c["touches"] == 0]
    pool = inner or cands
    best = max(pool, key=lambda c: c["area"])
    status = "ok" if inner else "edge-only"
    # If another inner blob is comparable (e.g. a set of items), keep them together.
    x0, y0, bw, bh = best["box"]
    x1, y1 = x0 + bw, y0 + bh
    for c in pool:
        if c is best or c["area"] < 0.35 * best["area"]:
            continue
        cx, cy, cw, ch = c["box"]
        # Keep a set together only when the pieces sit close to each other.
        gap_x = max(0, max(cx, x0) - min(cx + cw, x1))
        gap_y = max(0, max(cy, y0) - min(cy + ch, y1))
        if max(gap_x, gap_y) < 0.25 * max(bw, bh, cw, ch):
            x0, y0, x1, y1 = min(x0, cx), min(y0, cy), max(x1, cx + cw), max(y1, cy + ch)
    pad = 10
    x0, y0, x1, y1 = max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad)
    crop = img.crop((x0, y0, x1, y1))
    cw, ch = crop.size
    # Whiten anything that was removed (text / bars) inside the crop window.
    arr = np.array(crop)
    keep = np.zeros((h, w), np.uint8)
    for c in pool:
        bx, by, bbw, bbh = c["box"]
        if bx >= x0 - 1 and by >= y0 - 1 and bx + bbw <= x1 + 1 and by + bbh <= y1 + 1:
            keep[by:by + bbh, bx:bx + bbw] = 1
    keep_c = cv2.dilate(keep[y0:y1, x0:x1], np.ones((15, 15), np.uint8))
    arr[keep_c == 0] = 255
    crop = Image.fromarray(arr)
    scale = min(FILL * SIZE / cw, FILL * SIZE / ch, MAX_UPSCALE)
    nw, nh = max(1, round(cw * scale)), max(1, round(ch * scale))
    crop = crop.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGB", (SIZE, SIZE), (255, 255, 255))
    canvas.paste(crop, ((SIZE - nw) // 2, (SIZE - nh) // 2))
    info = dict(status=status, src_box=[int(x0), int(y0), int(x1), int(y1)], scale=round(scale, 2),
                src_size=[w, h], blobs=len(cands))
    return canvas, info


def strip_rules(path):
    """Paint out hairline rules only (never bars), keeping size and everything else.

    For files that are already real product photos but carry a stray catalogue
    rule along one edge.
    """
    img = Image.open(path).convert("RGB")
    rgb = np.array(img)
    h, w = rgb.shape[:2]
    m = foreground_mask(rgb)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    changed = 0
    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        if (bh <= 5 and bw > 0.25 * w) or (bw <= 5 and bh > 0.25 * h):
            rgb[lab == i] = 255
            changed += 1
    return Image.fromarray(rgb), changed


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("brand")
    ap.add_argument("--root", default="public/images/products")
    ap.add_argument("--out", default=None)
    ap.add_argument("--report", default=None)
    ap.add_argument("--in-place", action="store_true")
    ap.add_argument("--only", nargs="*", help="Restrict to these file names")
    ap.add_argument("--rules-only", action="store_true", help="Only paint out hairline rules; keep size")
    a = ap.parse_args()
    src = os.path.join(a.root, a.brand)
    out = src if a.in_place else (a.out or os.path.join("/tmp", f"clean-{a.brand}"))
    os.makedirs(out, exist_ok=True)
    report = {}
    for f in sorted(os.listdir(src)):
        if not f.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        if a.only and f not in a.only:
            continue
        if a.rules_only:
            img, n = strip_rules(os.path.join(src, f))
            img.save(os.path.join(out, f), "JPEG", quality=90, optimize=True, progressive=True)
            report[f] = {"status": "rules-stripped", "rules": n}
            continue
        canvas, info = extract(os.path.join(src, f))
        if canvas is None:
            report[f] = {"status": info}
            continue
        canvas.save(os.path.join(out, f), "JPEG", quality=86, optimize=True, progressive=True)
        report[f] = info
    if a.report:
        json.dump(report, open(a.report, "w"), indent=1)
    from collections import Counter
    print(Counter(v["status"] for v in report.values()))

if __name__ == "__main__":
    main()
