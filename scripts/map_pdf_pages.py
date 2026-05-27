# -*- coding: utf-8 -*-
from pathlib import Path
import fitz
import re

PDF = Path(r"C:\Users\User\Downloads\Senderos Seguros - Comisión Seguridad VF (resumen).pptx.pdf")
doc = fitz.open(PDF)

out = []
for i in range(doc.page_count):
    t = doc[i].get_text()
    if "SENDEROS SEGUROS 2024" not in t and "SENDEROS SEGUROS 2025" not in t:
        continue
    if "MATRIZ" in t:
        continue
    lines = [ln.strip() for ln in t.splitlines() if ln.strip()][:8]
    tipo = []
    tl = t.lower()
    if "particularidades" in tl:
        tipo.append("FICHA")
    if "antes" in tl and ("después" in tl or "despues" in tl):
        tipo.append("ANTES_DESPUES")
    out.append(f"--- p{i+1} {tipo} ---\n")
    out.append(" | ".join(lines[:8]) + "\n\n")

(Path(__file__).resolve().parents[1] / "data" / "pdf_explore" / "map.txt").write_text(
    "".join(out), encoding="utf-8"
)
doc.close()
