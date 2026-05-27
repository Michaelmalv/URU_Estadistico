"""Catálogo de imágenes (extensión y antes/después) extraídas del PDF de Senderos Seguros."""

import json
from pathlib import Path

from senderos_matriz import resolver_clave

BASE_DIR = Path(__file__).resolve().parent
IMAGENES_DIR = BASE_DIR / "data" / "imagenes_senderos"
CATALOGO_PATH = IMAGENES_DIR / "catalogo.json"


def _cargar_catalogo() -> dict:
    if not CATALOGO_PATH.is_file():
        return {}
    return json.loads(CATALOGO_PATH.read_text(encoding="utf-8"))


def imagenes_sendero(nombre_proyecto: str) -> dict[str, Path | None]:
    """Devuelve rutas locales a extension.png y antes_despues.png si existen."""
    clave = resolver_clave(nombre_proyecto)
    if not clave:
        return {"extension": None, "antes_despues": None}

    catalogo = _cargar_catalogo()
    info = catalogo.get(clave, {})
    resultado = {"extension": None, "antes_despues": None}

    if info.get("extension"):
        path = BASE_DIR / info["extension"]
        if path.is_file():
            resultado["extension"] = path

    if info.get("antes_despues"):
        path = BASE_DIR / info["antes_despues"]
        if path.is_file():
            resultado["antes_despues"] = path

    return resultado
