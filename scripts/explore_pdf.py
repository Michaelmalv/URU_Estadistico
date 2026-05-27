# -*- coding: utf-8 -*-
import re
import sys
from pathlib import Path

import fitz

PDF = Path(r"C:\Users\User\Downloads\Senderos Seguros - Comisión Seguridad VF (resumen).pptx.pdf")
OUT = Path(__file__).resolve().parents[1] / "data" / "pdf_explore"
OUT.mkdir(parents=True, exist_ok=True)

doc = fitz.open(PDF)
keywords = ("antes", "después", "despues", "particularidades", "av.", "sendero", "epmmop")

lines = []
for i in range(doc.page_count):
    text = doc[i].get_text().lower()
    hits = [k for k in keywords if k in text]
    if hits or i < 5:
        safe = doc[i].get_text()[:300].encode("utf-8", errors="replace").decode("utf-8")
        line = f"page {i+1:02d} imgs={len(doc[i].get_images())} hits={hits}\n  {safe[:250]}\n"
        lines.append(line)

(Path(__file__).resolve().parents[1] / "data" / "pdf_explore" / "pages.txt").write_text(
    "".join(lines), encoding="utf-8"
)
doc.close()
print("written", len(lines), "lines")
