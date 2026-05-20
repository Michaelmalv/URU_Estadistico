import io
import openpyxl
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.gridspec as gridspec
import streamlit as st


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
        if tiene_datos:
            proyectos[nombre] = {
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
    ROW_H=0.50; HDR_H=0.75; GAP_H=0.55; TTL_H=1.10; FT_H=0.35
    h_inc = HDR_H + len(INCIDENTES) * ROW_H
    h_del = HDR_H + len(DELITOS) * ROW_H
    fig_w = min(max(12., 10. + n * 1.2), 22.)
    fig_h = (TTL_H + h_inc + GAP_H + h_del + FT_H) * 0.78

    fig = plt.figure(figsize=(fig_w, fig_h), facecolor='white')
    gs = gridspec.GridSpec(5, 1, figure=fig,
         height_ratios=[TTL_H, h_inc, GAP_H, h_del, FT_H], hspace=0)

    ax0 = fig.add_subplot(gs[0]); ax0.set_facecolor(C_HDR); ax0.axis('off')
    ax0.text(.5, .68, p['programa'].upper(), transform=ax0.transAxes,
             ha='center', va='center', fontsize=14, fontweight='bold', color='white')
    ax0.text(.5, .22,
             f"{p['ubicacion']} | {p['extension']} | Inauguración: {p['fecha']}",
             transform=ax0.transAxes, ha='center', va='center', fontsize=7, color='#bbb')

    def draw_table(ax, filas_vars, tipo_hdr):
        ax.set_facecolor('white'); ax.axis('off')
        n_anios = len(todos)
        n = len(filas_vars); LW = .13; TX = LW + .005; TW = 1. - TX
        ht = HDR_H + n * ROW_H; HF = HDR_H / ht; RF = ROW_H / ht
        WN = TW * .40; WA = TW * (.45 / n_anios); WT = TW * .15
        cxs = [TX] + [TX + WN + k * WA for k in range(n_anios)] + [TX + WN + n_anios * WA]
        cws = [WN] + [WA] * n_anios + [WT]
        ax.text(LW * .45, .5, tipo_hdr, transform=ax.transAxes,
                ha='center', va='center', fontsize=8, fontweight='bold', color='#1a1a2e')
        hdrs = [tipo_hdr] + todos + [f'Tasa\n{anio_ref_ant}→{anio_ref_act}']
        hcols = ([C_ANT] + [C_ANT] * len(anios_ant) + [C_ACT] * len(anios_act) + [C_TASA])
        for lbl, cx, cw, bg in zip(hdrs, cxs, cws, hcols):
            ax.add_patch(mpatches.FancyBboxPatch((cx, 1 - HF), cw, HF,
                boxstyle='square,pad=0', facecolor=bg, edgecolor='white', lw=.8,
                transform=ax.transAxes, clip_on=False))
            ax.text(cx + cw / 2, 1 - HF / 2, lbl, transform=ax.transAxes,
                    ha='center', va='center', fontsize=7.5, fontweight='bold',
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
                    ha='left', va='center', fontsize=8, color='#333')
            for k, anio in enumerate(todos):
                val = p['anios'][anio].get(var); cx = cxs[1 + k]; cw = cws[1 + k]
                fd = bg if anio in anios_ant else '#eaf4fb'
                ax.add_patch(mpatches.FancyBboxPatch((cx, yb), cw, RF,
                    boxstyle='square,pad=0', facecolor=fd, edgecolor='white', lw=.4,
                    transform=ax.transAxes, clip_on=False))
                ax.text(cx + cw / 2, (yt + yb) / 2, str(int(val)) if val else '-',
                        transform=ax.transAxes, ha='center', va='center',
                        fontsize=8.5, color='#333')
            ct = cxs[-1]; cw = cws[-1]
            ax.add_patch(mpatches.FancyBboxPatch((ct, yb), cw, RF,
                boxstyle='square,pad=0', facecolor=TBAG, edgecolor='white', lw=.4,
                transform=ax.transAxes, clip_on=False))
            fmt_t = f'{t*100:+.0f}%' if t is not None else 'N/A'
            col_t = '#c0392b' if t and t > 0 else '#27ae60' if t and t < 0 else '#777'
            ax.text(ct + cw / 2, (yt + yb) / 2, fmt_t,
                    transform=ax.transAxes, ha='center', va='center',
                    fontsize=8.5, fontweight='bold', color=col_t)

    ax1 = fig.add_subplot(gs[1]); draw_table(ax1, INCIDENTES, 'INCIDENTE')
    ax2 = fig.add_subplot(gs[2]); ax2.axis('off'); ax2.set_facecolor('white')
    ax3 = fig.add_subplot(gs[3]); draw_table(ax3, DELITOS, 'DELITO')
    ax4 = fig.add_subplot(gs[4]); ax4.axis('off'); ax4.set_facecolor('white')
    ax4.text(.01, .5, f'Fuente: ECU 911 · PPNN | Tasa: {anio_ref_ant}→{anio_ref_act}',
             transform=ax4.transAxes, ha='left', va='center', fontsize=6.5, color='#777')
    fig.subplots_adjust(left=.02, right=.98, top=.98, bottom=.02, hspace=0)
    return fig


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

    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    fig.patch.set_facecolor('white')
    fig.suptitle(f"Resumen comparativo", fontsize=12, fontweight='bold')

    def _grupo(ax, vlist, titulo):
        x = np.arange(len(vlist)); w = 0.75 / n; max_val = 0
        for k, anio in enumerate(todos):
            vals = [p['anios'][anio].get(v) or 0 for v in vlist]
            max_val = max(max_val, max(vals))
            offset = (k - n / 2 + .5) * w
            bars = ax.bar(x + offset, vals, width=w * .9, color=colores[k], label=anio)
            for bar, val in zip(bars, vals):
                if val > 0:
                    ax.text(bar.get_x() + bar.get_width() / 2,
                            bar.get_height() + max_val * .005,
                            str(int(val)), ha='center', va='bottom', fontsize=7)

        if tiene_2026:
            k26 = todos.index('2026*')
            offset26 = (k26 - n / 2 + .5) * w
            for j, var in enumerate(vlist):
                real = p['anios']['2026*'].get(var) or 0
                proy = p['proyeccion_2026'].get(var) or 0
                if proy > real:
                    ax.bar(x[j] + offset26, proy - real, width=w * .9,
                           bottom=real, color='none', edgecolor='#27ae60', lw=1.2, hatch='//')
                    ax.text(x[j] + offset26, proy + max_val * .01, f'~{int(proy)}', ha='center', va='bottom', fontsize=6, color='#1e8449')

        for j, var in enumerate(vlist):
            va_v = p['anios'][anio_ref_ant].get(var)
            vb_v = p['anios'][anio_ref_act].get(var)
            t = tasa_calc(va_v, vb_v)
            if t is None:
                continue
            flecha = '↑' if t > 0 else '↓'
            color = '#c0392b' if t > 0 else '#27ae60'
            ax.text(x[j], max_val * 1.12, f'{flecha}{abs(t*100):.0f}%', ha='center', va='bottom', fontsize=8, color=color)

        etiq = [v.replace(' y ', '\ny ').replace(' de ', '\nde ') for v in vlist]
        ax.set_xticks(x); ax.set_xticklabels(etiq, fontsize=8)
        ax.set_title(titulo, fontsize=10, backgroundcolor='#2c3e50', color='white')
        ax.set_ylim(0, max_val * 1.30 if max_val > 0 else 1)
        ax.legend(fontsize=8)

    _grupo(axes[0], INCIDENTES, 'INCIDENTES (ECU 911)')
    _grupo(axes[1], DELITOS, 'DELITOS (PPNN)')
    plt.tight_layout()
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


def main():
    st.title('Evaluación de Seguridad — Generador interactivo')
    st.markdown('Carga el archivo Excel original y genera cuadros comparativos, gráficos y datos.')

    uploaded = st.file_uploader('Sube el Excel (usa el archivo entregado)', type=['xlsx'])
    if uploaded is None:
        st.info('Sube el archivo Excel para continuar.')
        return

    categorias, proyectos = parse_workbook(uploaded.read())

    modo = st.radio('Modo', ['Por proyecto', 'Por categoría'])
    if modo == 'Por proyecto':
        proy = st.selectbox('Proyecto', sorted(list(proyectos.keys())))
    else:
        cat = st.selectbox('Categoría', list(categorias.keys()))
        proy = st.selectbox('Proyecto', sorted(categorias.get(cat, [])))

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
        if not ant or not act:
            st.warning('Selecciona al menos un año en ambos periodos.')
        elif set(ant) & set(act):
            st.warning('No se deben repetir años en ambos periodos.')
        else:
            st.info('Generando tabla comparativa...')
            fig = generar_tabla(proyectos[proy], ant, act)
            st.pyplot(fig)
            buf = io.BytesIO()
            fig.savefig(buf, format='png', dpi=180, bbox_inches='tight')
            buf.seek(0)
            st.download_button('⬇️ Descargar tabla (PNG)', data=buf.getvalue(), 
                              file_name=f'{proy}_tabla_comparativa.png', mime='image/png')
            plt.close(fig)

    if btn_grafico:
        if not ant or not act:
            st.warning('Selecciona al menos un año en ambos periodos.')
        elif set(ant) & set(act):
            st.warning('No se deben repetir años en ambos periodos.')
        else:
            st.info('Generando resumen gráfico...')
            fig = generar_grafico_resumen(proyectos[proy], ant, act)
            st.pyplot(fig)
            buf = io.BytesIO()
            fig.savefig(buf, format='png', dpi=160, bbox_inches='tight')
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
