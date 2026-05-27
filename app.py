import html
import io
import hashlib
import os
import textwrap
from pathlib import Path
import openpyxl
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.gridspec as gridspec
import streamlit as st
from senderos_imagenes import imagenes_sendero
from senderos_matriz import es_sendero_seguro, fichas_sendero


INCIDENTES = [
    'Daño a propiedad pública y privada',
    'Escándalos', 'Eventos clandestinos',
    'Libadores', 'Venta y consumo de sustancias'
]
DELITOS = [
    'Robo a carros', 'Robo a motos', 'Robo a personas',
    'Robo a unidades económicas', 'Robo de autopartes', 'Robo a domicilios'
]
ALL_VARS = INCIDENTES + DELITOS

COL_INICIO = {'2023': 5, '2024': 16, '2025': 27, '2026*': 38}
COL_TASA_EXCEL = {'2023-2024': 49, '2024-2025': 60}
PERIODOS = list(COL_INICIO.keys())
MESES_2026 = 4

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / 'data'
DEFAULT_EXCEL_NAMES = (
    'Evaluación de proyectos estratégicos_ SEGURIDAD.xlsx',
    'datos_seguridad.xlsx',
    'datos.xlsx',
)


def find_default_excel():
    """Busca el Excel local: variable de entorno, nombres por defecto o cualquier .xlsx en data/."""
    env_path = os.environ.get('SEGURIDAD_EXCEL')
    if env_path:
        path = Path(env_path).expanduser().resolve()
        if path.is_file():
            return path
    for name in DEFAULT_EXCEL_NAMES:
        path = DATA_DIR / name
        if path.is_file():
            return path
    if DATA_DIR.is_dir():
        files = sorted(DATA_DIR.glob('*.xlsx'))
        if files:
            return files[0]
    return None


@st.cache_data(show_spinner='Cargando datos del Excel…')
def load_workbook_data(cache_key: str, file_bytes: bytes):
    return parse_workbook(file_bytes)


def workbook_cache_key(source_label: str, file_bytes: bytes, file_path: Path | None = None):
    if file_path is not None:
        stat = file_path.stat()
        return f'file:{file_path}:{stat.st_mtime_ns}:{stat.st_size}'
    digest = hashlib.md5(file_bytes).hexdigest()
    return f'upload:{source_label}:{digest}'


def safe_float(v):
    if v is None or str(v).strip() in ('', '-'):
        return None
    try:
        return float(v)
    except:
        return None


def parse_workbook(file_bytes):
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))

    categorias = {}
    proyectos = {}
    current_cat = ''

    for row in rows[4:]:
        if row[0] and isinstance(row[0], str) and row[0].strip():
            current_cat = row[0].strip()
            if current_cat not in categorias:
                categorias[current_cat] = []
        nombre = row[1]
        if not nombre or not isinstance(nombre, str):
            continue
        nombre = nombre.strip()

        anios = {}
        for anio, c in COL_INICIO.items():
            anios[anio] = {var: safe_float(row[c + i] if c + i < len(row) else None)
                           for i, var in enumerate(ALL_VARS)}

        tasas_excel = {}
        for llave, c in COL_TASA_EXCEL.items():
            tasas_excel[llave] = {var: safe_float(row[c + i] if c + i < len(row) else None)
                                  for i, var in enumerate(ALL_VARS)}

        proyeccion_2026 = {
            var: (anios['2026*'][var] * 12 / MESES_2026
                  if anios['2026*'][var] is not None else None)
            for var in ALL_VARS
        }

        tiene_datos = any(any(v is not None for v in d.values()) for d in anios.values())
        tiene_metadatos = any(str(row[i] or '').strip() for i in (2, 3, 4))
        if tiene_datos or tiene_metadatos:
            proyectos[nombre] = {
                'tiene_estadisticas': tiene_datos,
                'categoria': current_cat,
                'programa': current_cat,
                'ubicacion': str(row[2] or '').strip(),
                'extension': str(row[3] or '').strip(),
                'fecha': str(row[4] or '').strip(),
                'anios': anios,
                'tasas_excel': tasas_excel,
                'proyeccion_2026': proyeccion_2026
            }
            if current_cat:
                categorias[current_cat].append(nombre)

    return categorias, proyectos


def tasa_calc(a, b):
    if a is None or b is None or a == 0:
        return None
    return (b - a) / a


def generar_tabla(p, anios_ant, anios_act):
    """Genera tabla comparativa con incidentes y delitos."""
    todos = anios_ant + anios_act
    n = len(todos)
    anio_ref_ant = anios_ant[-1]
    anio_ref_act = anios_act[0]
    llave = f'{anio_ref_ant}-{anio_ref_act}'
    tasas_pre = p.get('tasas_excel', {}).get(llave, {})

    C_HDR='#1a1a2e'; C_ANT='#2c3e50'; C_ACT='#1a5276'; C_TASA='#4a235a'
    RODD='#f7f7f7'; REVEN='#ffffff'; TBAG='#f0e6f6'
    escala = 1.55
    ROW_H = 0.58 * escala
    HDR_H = 0.82 * escala
    GAP_H = 0.55 * escala
    TTL_H = 1.15 * escala
    FT_H = 0.40 * escala
    h_inc = HDR_H + len(INCIDENTES) * ROW_H
    h_del = HDR_H + len(DELITOS) * ROW_H
    fig_w = min(max(16., 13. + n * 1.6), 28.)
    fig_h = (TTL_H + h_inc + GAP_H + h_del + FT_H) * 1.05

    fig = plt.figure(figsize=(fig_w, fig_h), facecolor='white', dpi=120)
    gs = gridspec.GridSpec(5, 1, figure=fig,
         height_ratios=[TTL_H, h_inc, GAP_H, h_del, FT_H], hspace=0)

    ax0 = fig.add_subplot(gs[0]); ax0.set_facecolor(C_HDR); ax0.axis('off')
    ax0.text(.5, .68, p['programa'].upper(), transform=ax0.transAxes,
             ha='center', va='center', fontsize=18, fontweight='bold', color='white')
    ax0.text(.5, .22,
             f"{p['ubicacion']} | {p['extension']} | Inauguración: {p['fecha']}",
             transform=ax0.transAxes, ha='center', va='center', fontsize=10, color='#bbb')

    def draw_table(ax, filas_vars, tipo_hdr):
        ax.set_facecolor('white'); ax.axis('off')
        n_anios = len(todos)
        n = len(filas_vars); LW = .13; TX = LW + .005; TW = 1. - TX
        ht = HDR_H + n * ROW_H; HF = HDR_H / ht; RF = ROW_H / ht
        WN = TW * .40; WA = TW * (.45 / n_anios); WT = TW * .15
        cxs = [TX] + [TX + WN + k * WA for k in range(n_anios)] + [TX + WN + n_anios * WA]
        cws = [WN] + [WA] * n_anios + [WT]
        ax.text(LW * .45, .5, tipo_hdr, transform=ax.transAxes,
                ha='center', va='center', fontsize=11, fontweight='bold', color='#1a1a2e')
        hdrs = [tipo_hdr] + todos + [f'Tasa\n{anio_ref_ant}→{anio_ref_act}']
        hcols = ([C_ANT] + [C_ANT] * len(anios_ant) + [C_ACT] * len(anios_act) + [C_TASA])
        for lbl, cx, cw, bg in zip(hdrs, cxs, cws, hcols):
            ax.add_patch(mpatches.FancyBboxPatch((cx, 1 - HF), cw, HF,
                boxstyle='square,pad=0', facecolor=bg, edgecolor='white', lw=.8,
                transform=ax.transAxes, clip_on=False))
            ax.text(cx + cw / 2, 1 - HF / 2, lbl, transform=ax.transAxes,
                    ha='center', va='center', fontsize=11, fontweight='bold',
                    color='white', linespacing=1.3)
        for i, var in enumerate(filas_vars):
            yt = 1 - HF - i * RF; yb = yt - RF
            bg = RODD if i % 2 == 0 else REVEN
            va = p['anios'][anio_ref_ant].get(var)
            vb = p['anios'][anio_ref_act].get(var)
            t = tasas_pre.get(var) if tasas_pre.get(var) is not None else tasa_calc(va, vb)
            ax.add_patch(mpatches.FancyBboxPatch((cxs[0], yb), cws[0], RF,
                boxstyle='square,pad=0', facecolor=bg, edgecolor='white', lw=.4,
                transform=ax.transAxes, clip_on=False))
            ax.text(cxs[0] + .007, (yt + yb) / 2, var, transform=ax.transAxes,
                    ha='left', va='center', fontsize=11, color='#333')
            for k, anio in enumerate(todos):
                val = p['anios'][anio].get(var); cx = cxs[1 + k]; cw = cws[1 + k]
                fd = bg if anio in anios_ant else '#eaf4fb'
                ax.add_patch(mpatches.FancyBboxPatch((cx, yb), cw, RF,
                    boxstyle='square,pad=0', facecolor=fd, edgecolor='white', lw=.4,
                    transform=ax.transAxes, clip_on=False))
                ax.text(cx + cw / 2, (yt + yb) / 2, str(int(val)) if val else '-',
                        transform=ax.transAxes, ha='center', va='center',
                        fontsize=12, color='#333')
            ct = cxs[-1]; cw = cws[-1]
            ax.add_patch(mpatches.FancyBboxPatch((ct, yb), cw, RF,
                boxstyle='square,pad=0', facecolor=TBAG, edgecolor='white', lw=.4,
                transform=ax.transAxes, clip_on=False))
            fmt_t = f'{t*100:+.0f}%' if t is not None else 'N/A'
            col_t = '#c0392b' if t and t > 0 else '#27ae60' if t and t < 0 else '#777'
            ax.text(ct + cw / 2, (yt + yb) / 2, fmt_t,
                    transform=ax.transAxes, ha='center', va='center',
                    fontsize=12, fontweight='bold', color=col_t)

    ax1 = fig.add_subplot(gs[1]); draw_table(ax1, INCIDENTES, 'INCIDENTE')
    ax2 = fig.add_subplot(gs[2]); ax2.axis('off'); ax2.set_facecolor('white')
    ax3 = fig.add_subplot(gs[3]); draw_table(ax3, DELITOS, 'DELITO')
    ax4 = fig.add_subplot(gs[4]); ax4.axis('off'); ax4.set_facecolor('white')
    ax4.text(.01, .5, f'Fuente: ECU 911 · PPNN | Tasa: {anio_ref_ant}→{anio_ref_act}',
             transform=ax4.transAxes, ha='left', va='center', fontsize=9, color='#777')
    fig.subplots_adjust(left=.02, right=.98, top=.98, bottom=.02, hspace=0)
    return fig


def mostrar_figura_alta_res(fig, dpi_pantalla: int = 220):
    """Muestra la figura a ancho completo en alta resolución (evita pixelación al ampliar)."""
    buf = io.BytesIO()
    fig.savefig(
        buf, format='png', dpi=dpi_pantalla, bbox_inches='tight',
        facecolor='white', pad_inches=0.2,
    )
    buf.seek(0)
    st.image(buf, use_container_width=True)


def _etiqueta_grafico(nombre: str, ancho: int = 16) -> str:
    """Parte el nombre en líneas para evitar solapamiento en el eje X."""
    lineas = textwrap.wrap(nombre, width=ancho, break_long_words=False)
    return '\n'.join(lineas[:3]) if lineas else nombre


def generar_grafico_resumen(p, anios_ant, anios_act):
    todos = anios_ant + anios_act
    n = len(todos)
    tiene_2026 = '2026*' in anios_act
    anio_ref_ant = anios_ant[-1]
    anio_ref_act = anios_act[0]

    COLS_ANT = ['#1a5276', '#2e86c1', '#5dade2']
    COLS_ACT = ['#1e8449', '#27ae60', '#82e0aa']
    colores = ([COLS_ANT[i % 3] for i in range(len(anios_ant))] +
               [COLS_ACT[i % 3] for i in range(len(anios_act))])

    max_cats = max(len(INCIDENTES), len(DELITOS))
    fig_w = max(14., 10. + max_cats * 2.2 + n * 1.0)
    alto_panel = 6.5 + max_cats * 0.35
    fig_h = alto_panel * 2 + 1.8
    fig, axes = plt.subplots(2, 1, figsize=(fig_w, fig_h), dpi=120)
    fig.patch.set_facecolor('white')
    fig.suptitle('Resumen comparativo', fontsize=18, fontweight='bold', y=0.995)

    def _grupo(ax, vlist, titulo):
        x = np.arange(len(vlist))
        w = 0.75 / n
        max_val = 0
        for k, anio in enumerate(todos):
            vals = [p['anios'][anio].get(v) or 0 for v in vlist]
            max_val = max(max_val, max(vals))
            offset = (k - n / 2 + .5) * w
            bars = ax.bar(x + offset, vals, width=w * .9, color=colores[k], label=anio)
            for bar, val in zip(bars, vals):
                if val > 0:
                    ax.text(
                        bar.get_x() + bar.get_width() / 2,
                        bar.get_height() + max_val * 0.02,
                        str(int(val)), ha='center', va='bottom', fontsize=11,
                    )

        if tiene_2026:
            k26 = todos.index('2026*')
            offset26 = (k26 - n / 2 + .5) * w
            for j, var in enumerate(vlist):
                real = p['anios']['2026*'].get(var) or 0
                proy = p['proyeccion_2026'].get(var) or 0
                if proy > real:
                    ax.bar(
                        x[j] + offset26, proy - real, width=w * .9,
                        bottom=real, color='none', edgecolor='#27ae60', lw=1.2, hatch='//',
                    )
                    ax.text(
                        x[j] + offset26, proy + max_val * 0.04, f'~{int(proy)}',
                        ha='center', va='bottom', fontsize=10, color='#1e8449',
                    )

        techo = max(max_val * 1.45, 1)
        for j, var in enumerate(vlist):
            va_v = p['anios'][anio_ref_ant].get(var)
            vb_v = p['anios'][anio_ref_act].get(var)
            t = tasa_calc(va_v, vb_v)
            if t is None:
                continue
            flecha = '↑' if t > 0 else '↓'
            color = '#c0392b' if t > 0 else '#27ae60'
            ax.text(
                x[j], techo * 0.96, f'{flecha}{abs(t * 100):.0f}%',
                ha='center', va='top', fontsize=12, fontweight='bold', color=color,
            )

        ancho_etiq = 16 if len(vlist) >= 6 else 20
        etiq = [_etiqueta_grafico(v, ancho_etiq) for v in vlist]
        ax.set_xticks(x)
        ax.set_xticklabels(etiq, fontsize=11, rotation=30, ha='right')
        ax.set_title(titulo, fontsize=14, backgroundcolor='#2c3e50', color='white', pad=12)
        ax.set_ylim(0, techo)
        ax.legend(fontsize=11, loc='upper left', framealpha=0.9)
        ax.margins(x=0.06)
        ax.tick_params(axis='x', pad=10)
        ax.tick_params(axis='y', labelsize=11)

    _grupo(axes[0], INCIDENTES, 'INCIDENTES (ECU 911)')
    _grupo(axes[1], DELITOS, 'DELITOS (PPNN)')
    fig.tight_layout(rect=[0, 0.02, 1, 0.97], h_pad=4.0)
    fig.subplots_adjust(hspace=0.45)
    return fig


def export_csv(proyectos):
    registros = []
    for nombre, p in proyectos.items():
        for anio, datos in p['anios'].items():
            for var, val in datos.items():
                if val is not None:
                    tipo = 'Incidente' if var in INCIDENTES else 'Delito'
                    registros.append({
                        'Categoria': p['categoria'],
                        'Proyecto': nombre,
                        'Ubicacion': p['ubicacion'],
                        'Extension': p['extension'],
                        'Fecha': p['fecha'],
                        'Anio': anio,
                        'Tipo': tipo,
                        'Variable': var,
                        'Valor': int(round(val))
                    })
    df = pd.DataFrame(registros)
    # proyeccion
    for nombre, p in proyectos.items():
        for var, val in p['proyeccion_2026'].items():
            if val is not None:
                tipo = 'Incidente' if var in INCIDENTES else 'Delito'
                df = df.append({
                    'Categoria': p['categoria'],
                    'Proyecto': nombre,
                    'Ubicacion': p['ubicacion'],
                    'Extension': p['extension'],
                    'Fecha': p['fecha'],
                    'Anio': '2026_proyeccion',
                    'Tipo': tipo,
                    'Variable': var,
                    'Valor': int(round(val))
                }, ignore_index=True)
    return df


_FICHA_CSS = """
<style>
.ficha-sendero-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1rem 1.75rem;
    margin-top: 0.5rem;
}
.ficha-campo { display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
.ficha-label {
    font-size: 0.75rem; color: #64748b; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.03em;
}
.ficha-valor {
    font-size: 1.05rem; color: #0f172a; line-height: 1.45;
    word-wrap: break-word; overflow-wrap: anywhere;
}
.ficha-titulo-anio {
    font-size: 1rem; font-weight: 700; color: #1e3a5f;
    margin-bottom: 0.75rem; padding-bottom: 0.5rem;
    border-bottom: 2px solid #e2e8f0;
}
</style>
"""


def render_ficha_sendero(ficha: dict, proyecto: dict):
    """Muestra la ficha sin truncar valores largos (p. ej. presupuesto)."""
    label_fecha = 'Fecha entrega' if ficha['anio'] == 2024 else 'Fecha inauguración'
    campos = [
        ('Ejecutor', ficha['ejecutor']),
        ('Presupuesto', ficha['presupuesto']),
        ('Extensión (matriz)', ficha['extension']),
        ('Beneficiarios', ficha['beneficiarios']),
        (label_fecha, ficha['fecha']),
    ]
    if proyecto.get('ubicacion'):
        campos.append(('Ubicación', proyecto['ubicacion']))
    if proyecto.get('extension'):
        campos.append(('Extensión (Excel)', proyecto['extension']))
    if proyecto.get('fecha') and str(proyecto['fecha']).strip() not in ('', 'No', 'nan'):
        campos.append(('Fecha (Excel)', proyecto['fecha']))

    celdas = ''.join(
        f'<div class="ficha-campo"><span class="ficha-label">{html.escape(lbl)}</span>'
        f'<span class="ficha-valor">{html.escape(str(valor))}</span></div>'
        for lbl, valor in campos
    )
    titulo = html.escape(f'Matriz Senderos Seguros {ficha["anio"]} — {ficha["nombre"]}')
    st.markdown(
        _FICHA_CSS
        + f'<div class="ficha-titulo-anio">{titulo}</div>'
        + f'<div class="ficha-sendero-grid">{celdas}</div>',
        unsafe_allow_html=True,
    )


def main():
    st.title('Evaluación de Seguridad — Generador interactivo')
    st.markdown(
        'Genera cuadros comparativos, gráficos y datos. '
        'Si colocas el Excel en la carpeta `data/`, se carga solo al abrir la app.'
    )

    default_path = find_default_excel()
    with st.sidebar:
        st.subheader('Fuente de datos')
        if default_path:
            st.success(f'Archivo local: `{default_path.name}`')
            st.caption(str(default_path))
        else:
            st.warning('Sin Excel en `data/`. Sube uno abajo o copia el archivo ahí.')
        uploaded = st.file_uploader(
            'Subir otro Excel (opcional)',
            type=['xlsx'],
            help='Reemplaza temporalmente el archivo local de esta sesión.',
        )
        if st.button('Recargar datos', help='Vuelve a leer el Excel tras actualizarlo en disco.'):
            load_workbook_data.clear()
            st.rerun()

    file_bytes = None
    source_label = None
    cache_path = None

    if uploaded is not None:
        file_bytes = uploaded.getvalue()
        source_label = uploaded.name
    elif default_path is not None:
        file_bytes = default_path.read_bytes()
        source_label = default_path.name
        cache_path = default_path

    if file_bytes is None:
        st.info(
            'Coloca tu archivo `.xlsx` en la carpeta `data/` del proyecto '
            '(por ejemplo `data/datos_seguridad.xlsx`) o súbelo en el panel lateral.'
        )
        return

    cache_key = workbook_cache_key(source_label, file_bytes, cache_path)
    try:
        categorias, proyectos = load_workbook_data(cache_key, file_bytes)
    except Exception as exc:
        st.error(f'No se pudo leer el Excel ({source_label}): {exc}')
        return

    n_senderos = sum(1 for p in proyectos.values() if p.get('categoria') == 'Senderos Seguros')
    st.caption(
        f'Datos cargados: **{source_label}** · {len(proyectos)} proyectos '
        f'({n_senderos} Senderos Seguros)'
    )

    modo = st.radio('Modo', ['Por proyecto', 'Por categoría'])
    if modo == 'Por proyecto':
        proy = st.selectbox('Proyecto', sorted(list(proyectos.keys())))
    else:
        cat = st.selectbox('Categoría', list(categorias.keys()))
        proy = st.selectbox('Proyecto', sorted(categorias.get(cat, [])))

    p = proyectos[proy]
    fichas = fichas_sendero(proy)
    if fichas or es_sendero_seguro(proy, p.get('categoria', '')):
        st.subheader('Ficha del sendero seguro')
        if fichas:
            for ficha in fichas:
                with st.container(border=True):
                    render_ficha_sendero(ficha, p)
        else:
            st.caption('Proyecto de Senderos Seguros sin ficha en las matrices 2024–2026.')

        imgs = imagenes_sendero(proy)
        if imgs['extension'] or imgs['antes_despues']:
            st.markdown('#### Imágenes del sendero')
            if imgs['extension']:
                st.markdown('**Mapa de extensión**')
                st.image(str(imgs['extension']), use_container_width=True)
            if imgs['antes_despues']:
                st.markdown('**Antes y después**')
                st.image(str(imgs['antes_despues']), use_container_width=True)
            elif imgs['extension']:
                st.caption('En el PDF no hay diapositiva de antes/después para este sendero (solo ficha).')

    ant = st.multiselect('Años anterior', PERIODOS, default=['2024'])
    act = st.multiselect('Años actual', PERIODOS, default=['2025'])

    col1, col2, col3 = st.columns(3)
    with col1:
        btn_tabla = st.button('📊 Generar tabla comparativa')
    with col2:
        btn_grafico = st.button('📈 Generar resumen gráfico')
    with col3:
        btn_csv = st.button('💾 Exportar CSV')

    if btn_tabla:
        if not p.get('tiene_estadisticas', True):
            st.warning('Este proyecto aún no tiene datos de incidentes/delitos en el Excel.')
        elif not ant or not act:
            st.warning('Selecciona al menos un año en ambos periodos.')
        elif set(ant) & set(act):
            st.warning('No se deben repetir años en ambos periodos.')
        else:
            st.info('Generando tabla comparativa...')
            fig = generar_tabla(proyectos[proy], ant, act)
            mostrar_figura_alta_res(fig, dpi_pantalla=200)
            buf = io.BytesIO()
            fig.savefig(buf, format='png', dpi=300, bbox_inches='tight', facecolor='white')
            buf.seek(0)
            st.download_button('⬇️ Descargar tabla (PNG)', data=buf.getvalue(), 
                              file_name=f'{proy}_tabla_comparativa.png', mime='image/png')
            plt.close(fig)

    if btn_grafico:
        if not p.get('tiene_estadisticas', True):
            st.warning('Este proyecto aún no tiene datos de incidentes/delitos en el Excel.')
        elif not ant or not act:
            st.warning('Selecciona al menos un año en ambos periodos.')
        elif set(ant) & set(act):
            st.warning('No se deben repetir años en ambos periodos.')
        else:
            st.info('Generando resumen gráfico...')
            fig = generar_grafico_resumen(proyectos[proy], ant, act)
            mostrar_figura_alta_res(fig, dpi_pantalla=220)
            buf = io.BytesIO()
            fig.savefig(buf, format='png', dpi=300, bbox_inches='tight', facecolor='white')
            buf.seek(0)
            st.download_button('⬇️ Descargar gráfico (PNG)', data=buf.getvalue(), 
                              file_name=f'{proy}_grafico_resumen.png', mime='image/png')
            plt.close(fig)

    if btn_csv:
        df = export_csv(proyectos)
        csv = df.to_csv(index=False, encoding='utf-8-sig')
        st.download_button('⬇️ Descargar CSV', data=csv, file_name='seguridad_proyectos_powerbi.csv', mime='text/csv')


if __name__ == '__main__':
    main()
