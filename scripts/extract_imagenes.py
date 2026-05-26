# -*- coding: utf-8 -*-
"""Extrae imágenes de extensión y antes/después del PDF de Senderos Seguros."""
import json
import re
import unicodedata
from pathlib import Path

import fitz
from PIL import Image

OUT_DIR = Path(__file__).resolve().parents[1] / "data" / "imagenes_senderos"
META_FILE = OUT_DIR / "catalogo.json"
DPI = 180


def _buscar_pdf() -> Path:
    candidatos = sorted((Path.home() / "Downloads").glob("Senderos Seguros*resumen*.pdf"))
    if candidatos:
        return candidatos[0]
    return Path(r"C:\Users\User\Downloads\Senderos Seguros - Comisión Seguridad VF (resumen).pptx.pdf")

# Páginas 1-based del PDF (verificado en Senderos Seguros - Comisión Seguridad VF)
MAPEO_2024 = [
    ("av patria", 8, 9),
    ("av colon", 10, 11),
    ("el tingo", 12, 13),
    ("av michelena", 14, 15),
    ("chillogallo", 16, 17),
    ("caldas y antepara", 18, 19),
    ("av carapungo", 20, 21),
    ("la roldos oe13", 22, 23),
    ("isla tortuga", 24, 25),
    ("juan montalvo", 26, 27),
]

# 2025: solo fichas en el PDF (páginas 29-37), sin diapositiva antes/después
MAPEO_2025 = [
    ("conocoto", 29, None),
    ("av ajavi", 30, None),
    ("escalinatas rocafuerte", 31, None),
    ("gabriel garcia moreno", 32, None),
    ("lizardo ruiz", 33, None),
    ("av ramon borja", 34, None),
    ("via del ferrocarril", 35, None),
    ("av la ecuatoriana", 36, None),
    ("ruiz de castilla", 37, None),
]


def _norm(s: str) -> str:
    t = unicodedata.normalize("NFD", s)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", t.lower().strip())


def _render_page_region(page, clip, path: Path):
    mat = fitz.Matrix(DPI / 72, DPI / 72)
    pix = page.get_pixmap(matrix=mat, clip=clip, alpha=False)
    path.parent.mkdir(parents=True, exist_ok=True)
    pix.save(str(path))


def _trim_left_margin(path: Path):
    with Image.open(path) as source:
        image = source.convert("RGB")
        grayscale = image.convert("L")
        width, height = image.size
        sample_width = min(120, width)
        if sample_width < 20:
            return

        def column_average(column: int) -> float:
            return sum(grayscale.getpixel((column, row)) for row in range(height)) / height

        baseline = sum(column_average(column) for column in range(sample_width)) / sample_width
        if baseline < 150:
            return

        threshold = baseline - 25
        window = min(24, width)
        crop_x = 0
        for left in range(0, max(1, width - window)):
            window_average = sum(column_average(column) for column in range(left, left + window)) / window
            if window_average <= threshold:
                crop_x = max(0, left - 6)
                break

        if crop_x <= 0:
            return

        trimmed = image.crop((crop_x, 0, width, height))
        trimmed.save(path)


def _clip_mapa_extension(page):
    rects = []
    for img in page.get_images(full=True):
        for rect in page.get_image_rects(img[0]):
            if rect.width > page.rect.width * 0.18 and rect.height > page.rect.height * 0.35:
                rects.append(rect)

    if not rects:
        return fitz.Rect(
            page.rect.width * 0.32,
            page.rect.height * 0.04,
            page.rect.width * 0.99,
            page.rect.height * 0.96,
        )

    rect = max(rects, key=lambda r: r.width * r.height)
    pad_x = min(6, page.rect.width * 0.01)
    pad_y = min(4, page.rect.height * 0.01)
    return fitz.Rect(
        max(page.rect.x0, rect.x0 - pad_x),
        max(page.rect.y0, rect.y0 - pad_y),
        min(page.rect.x1, rect.x1 + pad_x),
        min(page.rect.y1, rect.y1 + pad_y),
    )


def extraer():
    doc = fitz.open(_buscar_pdf())
    catalogo = {}

    for clave, p_ficha, p_antes in MAPEO_2024 + MAPEO_2025:
        carpeta = OUT_DIR / clave.replace(" ", "_")
        carpeta.mkdir(parents=True, exist_ok=True)
        entry = catalogo.setdefault(clave, {})

        if p_ficha and p_ficha <= doc.page_count:
            page = doc[p_ficha - 1]
            clip_mapa = _clip_mapa_extension(page)
            ext_path = carpeta / "extension.png"
            _render_page_region(page, clip_mapa, ext_path)
            _trim_left_margin(ext_path)
            entry["extension"] = f"data/imagenes_senderos/{carpeta.name}/extension.png"

        if p_antes and p_antes <= doc.page_count:
            page = doc[p_antes - 1]
            ad_path = carpeta / "antes_despues.png"
            _render_page_region(page, page.rect, ad_path)
            entry["antes_despues"] = f"data/imagenes_senderos/{carpeta.name}/antes_despues.png"

    doc.close()

    META_FILE.parent.mkdir(parents=True, exist_ok=True)
    META_FILE.write_text(json.dumps(catalogo, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Extraídos {len(catalogo)} senderos en {OUT_DIR}")
    return catalogo


if __name__ == "__main__":
    extraer()
