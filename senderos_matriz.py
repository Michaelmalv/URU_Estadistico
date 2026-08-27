"""Matriz de Senderos Seguros (2024–2026) — datos de las fichas institucionales."""

import unicodedata


def _norm(texto: str) -> str:
    if not texto:
        return ''
    t = unicodedata.normalize('NFD', texto)
    t = ''.join(c for c in t if unicodedata.category(c) != 'Mn')
    return t.lower().strip()


# Clave interna -> lista de alias (nombres en Excel u otras variantes)
ALIASES = {
    'av patria': ['Av. Patria'],
    'av colon': ['Av. Colón'],
    'el tingo': ['El Tingo', 'El Tingo-2 de Agosto'],
    'av michelena': ['Av. Michelena'],
    'chillogallo': ['Chillogallo', 'Chillogallo-Luis Lopez'],
    'caldas y antepara': ['Caldas y Antepara'],
    'av carapungo': ['Av. Carapungo'],
    'la roldos oe13': ['La Roldós Oe13', 'La Roldós Oe13-Colinas del Norte'],
    'isla tortuga': ['Isla tortuga', 'Isla Tortuga'],
    'juan montalvo': ['Juan Montalvo'],
    'conocoto': ['Conocoto'],
    'av ajavi': ['Av. Ajaví'],
    'escalinatas rocafuerte': ['Escalinatas Rocafuerte'],
    'av la ecuatoriana': ['Av. La Ecuatoriana'],
    'gabriel garcia moreno': ['Gabriel García Moreno'],
    'lizardo ruiz': ['Lizardo Ruiz'],
    'av ramon borja': ['Av. Ramón Borja', 'Ramón Borja'],
    'via del ferrocarril': ['Vía del Ferrocarril'],
    'ruiz de castilla': ['Ruiz de Castilla'],
    'carapungo av cacha': ['Carapungo Av. Cacha', 'Av. Cacha'],
    'nanegalito': ['Nanegalito'],
    'atucucho': ['Atucucho'],
    'comite del pueblo': ['Comité del Pueblo'],
    'la mariscal': ['La Mariscal'],
    'rio de janeiro': ['Río de Janeiro'],
    's44': ['S44'],
}

MATRIZ = [
    # --- 2024 ---
    {'clave': 'av patria', 'anio': 2024, 'nombre': 'Av. Patria',
     'ejecutor': 'EPMMOP', 'presupuesto': 'USD 712.639 mil', 'extension': '1270 m',
     'beneficiarios': '200 mil hab', 'fecha': '25 enero 2024'},
    {'clave': 'av colon', 'anio': 2024, 'nombre': 'Av. Colón',
     'ejecutor': 'EPMMOP', 'presupuesto': 'USD 692.728,86 mil', 'extension': '2000 m',
     'beneficiarios': '30 mil hab', 'fecha': '04 diciembre 2024'},
    {'clave': 'el tingo', 'anio': 2024, 'nombre': 'El Tingo',
     'ejecutor': 'Adm. Zonal Los Chillos', 'presupuesto': 'USD 361,9 mil', 'extension': '350 m',
     'beneficiarios': '1000 hab', 'fecha': '23 febrero 2024'},
    {'clave': 'av michelena', 'anio': 2024, 'nombre': 'Av. Michelena',
     'ejecutor': 'Adm. Zonal Eloy Alfaro', 'presupuesto': 'USD 230 mil', 'extension': '422 m',
     'beneficiarios': '1200 hab', 'fecha': '25 abril 2024'},
    {'clave': 'chillogallo', 'anio': 2024, 'nombre': 'Chillogallo',
     'ejecutor': 'Adm. Zonal Quitumbe', 'presupuesto': 'USD 284,65 mil', 'extension': '320 m',
     'beneficiarios': '1000 hab', 'fecha': '12 junio 2024'},
    {'clave': 'caldas y antepara', 'anio': 2024, 'nombre': 'Caldas y Antepara',
     'ejecutor': 'Adm. Zonal Manuela Sáenz', 'presupuesto': 'USD 355,88 mil', 'extension': '570 m',
     'beneficiarios': '1500 hab', 'fecha': '15 mayo 2024'},
    {'clave': 'av carapungo', 'anio': 2024, 'nombre': 'Av. Carapungo',
     'ejecutor': 'Adm. Zonal Calderón', 'presupuesto': 'USD 363,29 mil', 'extension': '775 m',
     'beneficiarios': '2500 hab', 'fecha': '09 octubre 2024'},
    {'clave': 'la roldos oe13', 'anio': 2024, 'nombre': 'La Roldós Oe13',
     'ejecutor': 'Adm. Zonal La Delicia', 'presupuesto': 'USD 221,78 mil', 'extension': '700 m',
     'beneficiarios': '1500 hab', 'fecha': 'diciembre 2024'},
    {'clave': 'isla tortuga', 'anio': 2024, 'nombre': 'Isla tortuga',
     'ejecutor': 'Adm. Zonal Eugenio Espejo', 'presupuesto': 'USD 418.35 mil', 'extension': '582 m',
     'beneficiarios': '550 hab', 'fecha': 'diciembre 2024'},
    {'clave': 'juan montalvo', 'anio': 2024, 'nombre': 'Juan Montalvo',
     'ejecutor': 'Adm. Zonal Tumbaco', 'presupuesto': 'USD 245.39 mil', 'extension': '300 m',
     'beneficiarios': '2500 hab', 'fecha': 'diciembre 2024'},
    # --- 2025 ---
    {'clave': 'conocoto', 'anio': 2025, 'nombre': 'Conocoto',
     'ejecutor': 'Adm. Zonal Los Chillos', 'presupuesto': 'USD 202.885,4', 'extension': '1.130 m',
     'beneficiarios': '1.850 directos / 9.250 indirectos', 'fecha': 'NO'},
    {'clave': 'av ajavi', 'anio': 2025, 'nombre': 'Av. Ajaví',
     'ejecutor': 'Adm. Zonal Eloy Alfaro', 'presupuesto': 'USD 329.238,47', 'extension': '800 m',
     'beneficiarios': '1.000 directos / 5.000 indirectos', 'fecha': 'NO'},
    {'clave': 'escalinatas rocafuerte', 'anio': 2025, 'nombre': 'Escalinatas Rocafuerte',
     'ejecutor': 'IMP', 'presupuesto': 'USD 399.961,11 eje vial / USD 199.846,16 escalinatas',
     'extension': '900 m', 'beneficiarios': '1.700 directos / 8.500 indirectos', 'fecha': '11 de diciembre de 2025'},
    {'clave': 'av la ecuatoriana', 'anio': 2025, 'nombre': 'Av. La Ecuatoriana',
     'ejecutor': 'Adm. Zonal Quitumbe', 'presupuesto': 'USD 44.854,97', 'extension': '480 m',
     'beneficiarios': '1.200 directos / 6.000 indirectos', 'fecha': 'NO'},
    {'clave': 'gabriel garcia moreno', 'anio': 2025, 'nombre': 'Gabriel García Moreno',
     'ejecutor': 'Adm. Zonal Calderón', 'presupuesto': 'en revisión', 'extension': '740 m',
     'beneficiarios': '10.000 directos / 50.000 indirectos', 'fecha': 'NO'},
    {'clave': 'lizardo ruiz', 'anio': 2025, 'nombre': 'Lizardo Ruiz',
     'ejecutor': 'Adm. Zonal La Delicia', 'presupuesto': 'USD 455.669,73', 'extension': '710 m',
     'beneficiarios': '2.800 directos / 1.400 indirectos', 'fecha': 'NO'},
    {'clave': 'av ramon borja', 'anio': 2025, 'nombre': 'Av. Ramón Borja',
     'ejecutor': 'Adm. Zonal Eugenio Espejo', 'presupuesto': 'Aplazado a 2026', 'extension': '1.100 m',
     'beneficiarios': '1.200 directos / 6.000 indirectos', 'fecha': 'reprogramado'},
    {'clave': 'via del ferrocarril', 'anio': 2025, 'nombre': 'Vía del Ferrocarril',
     'ejecutor': 'Adm. Zonal Tumbaco', 'presupuesto': 'USD 450.000,00', 'extension': '980 m',
     'beneficiarios': '1.800 directos / 9.000 indirectos', 'fecha': 'NO'},
    {'clave': 'ruiz de castilla', 'anio': 2025, 'nombre': 'Ruiz de Castilla',
     'ejecutor': 'Adm. Zonal La Mariscal', 'presupuesto': 'USD 160.000,00', 'extension': '443 m',
     'beneficiarios': '1.500 directos / 1.800 indirectos', 'fecha': 'NO'},
    # --- 2026 ---
    {'clave': 'carapungo av cacha', 'anio': 2026, 'nombre': 'Carapungo Av. Cacha',
     'ejecutor': 'Adm. Zonal Calderón', 'presupuesto': 'USD 485.000 aprox.', 'extension': '1.300 m',
     'beneficiarios': '2.000 directos / 20.000 indirectos', 'fecha': 'NO'},
    {'clave': 'nanegalito', 'anio': 2026, 'nombre': 'Nanegalito',
     'ejecutor': 'Adm. Zonal Chocó Andino', 'presupuesto': 'USD 329.238,47', 'extension': '676 m',
     'beneficiarios': '—', 'fecha': 'NO'},
    {'clave': 'atucucho', 'anio': 2026, 'nombre': 'Atucucho',
     'ejecutor': 'Adm. Zonal Eugenio Espejo', 'presupuesto': '—', 'extension': '—',
     'beneficiarios': '—', 'fecha': '—'},
    {'clave': 'av ramon borja', 'anio': 2026, 'nombre': 'Ramón Borja',
     'ejecutor': 'Adm. Zonal Eugenio Espejo', 'presupuesto': 'USD 564.200,00', 'extension': '1.010 m',
     'beneficiarios': '10.000 hab', 'fecha': '2da semana de diciembre'},
    {'clave': 'conocoto', 'anio': 2026, 'nombre': 'Conocoto',
     'ejecutor': 'Adm. Zonal Los Chillos', 'presupuesto': 'USD 300.000,00 aprox.', 'extension': '1.300 m',
     'beneficiarios': '—', 'fecha': 'NO'},
    {'clave': 'comite del pueblo', 'anio': 2026, 'nombre': 'Comité del Pueblo',
     'ejecutor': 'Adm. Zonal La Delicia', 'presupuesto': '—', 'extension': '1.267 m',
     'beneficiarios': '—', 'fecha': '—'},
    {'clave': 'la mariscal', 'anio': 2026, 'nombre': 'La Mariscal',
     'ejecutor': 'Adm. Zonal La Mariscal', 'presupuesto': 'USD 648.443,98', 'extension': '1.690 m',
     'beneficiarios': '—', 'fecha': '—'},
    {'clave': 'rio de janeiro', 'anio': 2026, 'nombre': 'Río de Janeiro',
     'ejecutor': 'Adm. Zonal Manuela Sáenz', 'presupuesto': 'USD 350.000,00 aprox.', 'extension': '1.020 m',
     'beneficiarios': '—', 'fecha': '—'},
    {'clave': 's44', 'anio': 2026, 'nombre': 'S44',
     'ejecutor': 'Adm. Zonal Quitumbe', 'presupuesto': '—', 'extension': '—',
     'beneficiarios': '—', 'fecha': '—'},
]

# Índice nombre Excel normalizado -> clave interna
_INDICE_EXCEL = {}
for clave, alias_list in ALIASES.items():
    for alias in alias_list:
        _INDICE_EXCEL[_norm(alias)] = clave


def resolver_clave(nombre_proyecto: str) -> str | None:
    """Obtiene la clave de matriz a partir del nombre del proyecto en el Excel."""
    n = _norm(nombre_proyecto)
    if n in _INDICE_EXCEL:
        return _INDICE_EXCEL[n]
    for clave in ALIASES:
        if clave in n or n in clave:
            return clave
    for entrada in MATRIZ:
        kn = _norm(entrada['nombre'])
        if kn in n or n in kn:
            return entrada['clave']
    return None


def fichas_sendero(nombre_proyecto: str) -> list[dict]:
    """Devuelve todas las fichas de matriz (por año) que correspondan al proyecto."""
    clave = resolver_clave(nombre_proyecto)
    if not clave:
        return []
    return [f for f in MATRIZ if f['clave'] == clave]


def es_sendero_seguro(nombre_proyecto: str, categoria: str = '') -> bool:
    if categoria and 'senderos seguros' in categoria.lower():
        return True
    return bool(fichas_sendero(nombre_proyecto))
