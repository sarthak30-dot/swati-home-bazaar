"""Step 6: build the supplier-facing PDF of SKUs that still have no image.

Reads the live catalogue (every variant whose image_url is NULL), groups by
brand and category, and writes sku-images-missing.pdf at the repo root.
Rows marked with a dagger are ones where a catalogue scan exists on file but
was withdrawn by step 5 because supplier pricing is printed inside it.

    pip install reportlab
    python3 scripts/brand-image-sync/6-missing-images-pdf.py
"""
import json, collections, datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate, Paragraph,
                                Spacer, Table, TableStyle, KeepTogether)

import os
SP = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".image-sync")
rows = json.load(open(SP + "/missing.json"))
suppressed = set(json.load(open(SP + "/flagged.json")))

BRAND_HEX = {"Pigeon": "#C41230", "Dubblin": "#9C1150", "Yera": "#163A6B"}
GOLD = colors.HexColor("#B8862F")
INK = colors.HexColor("#1a1a1a")
MUTED = colors.HexColor("#6b6b6b")
RULE = colors.HexColor("#d8d8d8")

styles = getSampleStyleSheet()
H1 = ParagraphStyle("H1", parent=styles["Title"], fontName="Helvetica-Bold",
                    fontSize=20, leading=24, textColor=INK, alignment=0, spaceAfter=2)
SUB = ParagraphStyle("SUB", parent=styles["Normal"], fontSize=9.5, leading=14, textColor=MUTED)
BODY = ParagraphStyle("BODY", parent=styles["Normal"], fontSize=9.5, leading=14, textColor=INK)
BRANDH = ParagraphStyle("BRANDH", parent=styles["Heading1"], fontSize=14, leading=17, spaceBefore=4, spaceAfter=4)
CATH = ParagraphStyle("CATH", parent=styles["Heading2"], fontSize=10, leading=13,
                      textColor=MUTED, spaceBefore=8, spaceAfter=3)
CELL = ParagraphStyle("CELL", parent=styles["Normal"], fontSize=8.4, leading=10.5, textColor=INK)
CELLM = ParagraphStyle("CELLM", parent=CELL, textColor=MUTED)

TODAY = datetime.date.today().strftime("%d %B %Y")

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(RULE); canvas.setLineWidth(0.5)
    canvas.line(18*mm, 14*mm, A4[0]-18*mm, 14*mm)
    canvas.setFont("Helvetica", 7.5); canvas.setFillColor(MUTED)
    canvas.drawString(18*mm, 9.5*mm, "Swati Enterprises  |  SKUs awaiting product photography")
    canvas.drawRightString(A4[0]-18*mm, 9.5*mm, f"Page {canvas.getPageNumber()}")
    canvas.restoreState()

doc = BaseDocTemplate("sku-images-missing.pdf", pagesize=A4,
                      leftMargin=18*mm, rightMargin=18*mm, topMargin=16*mm, bottomMargin=20*mm,
                      title="SKUs awaiting product photography",
                      author="Swati Enterprises")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="f")
doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=footer)])

story = []
story.append(Paragraph("SKUs awaiting product photography", H1))
story.append(Spacer(1, 3))
story.append(Paragraph(
    f"Swati Enterprises &nbsp;·&nbsp; {TODAY} &nbsp;·&nbsp; "
    f"<b>{len(rows)}</b> of 920 catalogue SKUs have no usable product image.", SUB))
story.append(Spacer(1, 9))

by_brand = collections.Counter(r["brand_name"] for r in rows)
summary = [["Brand", "SKUs without an image", "Share of that brand's range"]]
totals = {"Pigeon": 565, "Yera": 250, "Dubblin": 105}
for b in ("Pigeon", "Yera", "Dubblin"):
    summary.append([b, str(by_brand.get(b, 0)), f"{by_brand.get(b,0)} of {totals[b]}"])
summary.append(["Total", str(len(rows)), f"{len(rows)} of 920"])
t = Table(summary, colWidths=[45*mm, 55*mm, 74*mm], hAlign="LEFT")
t.setStyle(TableStyle([
    ("FONT", (0,0), (-1,0), "Helvetica-Bold", 9),
    ("FONT", (0,1), (-1,-1), "Helvetica", 9),
    ("FONT", (0,-1), (-1,-1), "Helvetica-Bold", 9),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("BACKGROUND", (0,0), (-1,0), GOLD),
    ("ROWBACKGROUNDS", (0,1), (-1,-2), [colors.white, colors.HexColor("#faf7f0")]),
    ("LINEABOVE", (0,-1), (-1,-1), 0.6, RULE),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("TOPPADDING", (0,0), (-1,-1), 5), ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ("LEFTPADDING", (0,0), (-1,-1), 7),
]))
story.append(t)
story.append(Spacer(1, 10))
story.append(Paragraph(
    "Images already in place came from the brands' own websites "
    "(stovekraft.com and yera.com). The SKUs below are the remainder: either the "
    "brand does not publish them online, or no confident match could be made. "
    "Rows marked <b>†</b> do have a catalogue scan on file, but it was withdrawn "
    "because supplier pricing is printed inside the image &mdash; those need a "
    "replacement photograph rather than a first one.", BODY))
story.append(Spacer(1, 12))

HDR = ["SKU ID", "Variant code", "Product", "Size / colour", "Price"]
WID = [27*mm, 27*mm, 68*mm, 32*mm, 20*mm]

for brand in ("Pigeon", "Yera", "Dubblin"):
    items = [r for r in rows if r["brand_name"] == brand]
    if not items:
        continue
    hexc = colors.HexColor(BRAND_HEX[brand])
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        f'<font color="{BRAND_HEX[brand]}">{brand}</font> '
        f'<font size="10" color="#6b6b6b">— {len(items)} SKUs</font>', BRANDH))

    cats = collections.defaultdict(list)
    for r in items:
        cats[r["category_name"] or "Uncategorised"].append(r)

    for cat in sorted(cats):
        group = sorted(cats[cat], key=lambda r: (r["product_name"] or "", r["sku_id"]))
        data = [HDR]
        for r in group:
            mark = " †" if r["sku_id"] in suppressed else ""
            size = " / ".join(x for x in [r.get("capacity_or_size"), r.get("color")] if x) or "—"
            price = f"Rs. {int(r['selling_price']):,}" if r.get("selling_price") else "—"
            data.append([
                Paragraph(f'{r["sku_id"]}{mark}', CELL),
                Paragraph(r.get("variant_code") or "—", CELLM),
                Paragraph((r["product_name"] or "")[:70], CELL),
                Paragraph(size, CELLM),
                Paragraph(price, CELL),
            ])
        tbl = Table(data, colWidths=WID, repeatRows=1, hAlign="LEFT")
        tbl.setStyle(TableStyle([
            ("FONT", (0,0), (-1,0), "Helvetica-Bold", 8.2),
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("BACKGROUND", (0,0), (-1,0), hexc),
            ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, colors.HexColor("#f7f7f7")]),
            ("GRID", (0,0), (-1,-1), 0.25, RULE),
            ("VALIGN", (0,0), (-1,-1), "TOP"),
            ("TOPPADDING", (0,0), (-1,-1), 3.5), ("BOTTOMPADDING", (0,0), (-1,-1), 3.5),
            ("LEFTPADDING", (0,0), (-1,-1), 5), ("RIGHTPADDING", (0,0), (-1,-1), 5),
        ]))
        story.append(KeepTogether([Paragraph(f"{cat} &nbsp;<font color='#9b9b9b'>({len(group)})</font>", CATH)]))
        story.append(tbl)
        story.append(Spacer(1, 4))

doc.build(story)
print("built sku-images-missing.pdf")
