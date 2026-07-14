import os
import re
import unicodedata
import pandas as pd
import numpy as np

# Rutas
DATA_DIR = 'data'
PREDIOS_PATH = os.path.join(DATA_DIR, 'PREDIOS.xlsx')
BDD_22_PATH = os.path.join(DATA_DIR, 'BDD LUAE 2022- Proyectos estrategicos _ Desarrollo Urbanistico.xlsx')
BDD_23_PATH = os.path.join(DATA_DIR, 'BDD- Proyectos estrategicos _ Desarrollo Urbanistico.xlsx')
OUTPUT_PATH = 'Reporte_LUAE_Calle_Rocafuerte_Semestral.xlsx'

def normalize(text):
    if not text or pd.isna(text):
        return ''
    s = str(text).strip().lower()
    s = ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))
    s = s.replace('\ufffd', 'o')
    s = re.sub(r'[^a-z0-9]+', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

def clean_predio(p):
    if pd.isna(p):
        return ''
    s = str(p).strip()
    if s.endswith('.0'):
        s = s[:-2]
    return s

def norm_mov(m):
    m_norm = normalize(m)
    if 'renov' in m_norm:
        return 'RENOVACION'
    if 'emis' in m_norm:
        return 'EMISION'
    return m_norm.upper()

def get_semester(date_val):
    if not date_val or pd.isna(date_val):
        return 'SIN FECHA'
    try:
        dt = pd.to_datetime(date_val)
        year = dt.year
        semester = 'S1' if dt.month <= 6 else 'S2'
        return f"{year}-{semester}"
    except Exception:
        return 'FECHA INVALIDA'

def main():
    print("=== PROCESANDO DATOS PARA CALLE ROCAFUERTE ===")
    
    # 1. Obtener predios de Calle Rocafuerte (columna 39)
    df_predios = pd.read_excel(PREDIOS_PATH, header=None)
    raw_predios = df_predios.iloc[2:, 39].dropna().tolist()
    
    rocafuerte_predios = []
    for p in raw_predios:
        p_clean = clean_predio(p)
        if p_clean:
            rocafuerte_predios.append(p_clean)
            
    rocafuerte_predios = set(rocafuerte_predios)
    print(f"Predios únicos de Calle Rocafuerte cargados: {len(rocafuerte_predios)}")
    
    # 2. Cargar y filtrar bases de datos
    bdd_files = [
        (BDD_22_PATH, "2022"),
        (BDD_23_PATH, "2023+")
    ]
    
    all_matched_records = []
    
    for path, label in bdd_files:
        if not os.path.exists(path):
            print(f"Error: No se encuentra {path}")
            continue
            
        print(f"Procesando base de datos {label} ({os.path.basename(path)})...")
        df = pd.read_excel(path)
        
        # Detectar columnas dinámicamente
        predio_col = [c for c in df.columns if normalize(c) == 'predio'][0]
        licencia_col = [c for c in df.columns if 'licencia' in normalize(c)][0]
        mov_col = [c for c in df.columns if 'tipo de movimiento' in normalize(c) or 'movimiento' in normalize(c)][0]
        ciiu_col = [c for c in df.columns if 'ciiu' in normalize(c) and 'descrip' in normalize(c)][0]
        fecha_col = [c for c in df.columns if 'impresion' in normalize(c) or 'impresio' in normalize(c)][0]
        
        for idx, row in df.iterrows():
            p_raw = row[predio_col]
            p_clean = clean_predio(p_raw)
            
            if p_clean in rocafuerte_predios:
                lic = str(row[licencia_col]).strip()
                mov = str(row[mov_col]).strip()
                ciiu = str(row[ciiu_col]).strip() if pd.notna(row[ciiu_col]) else ''
                fecha_val = row[fecha_col]
                
                mov_n = norm_mov(mov)
                if mov_n not in ['EMISION', 'RENOVACION']:
                    continue
                    
                # Formatear fecha
                date_obj = None
                if pd.notna(fecha_val):
                    try:
                        date_obj = pd.to_datetime(fecha_val)
                    except Exception:
                        pass
                
                semester = get_semester(date_obj)
                
                all_matched_records.append({
                    'PREDIO': p_clean,
                    'LICENCIA': lic,
                    'MOVIMIENTO': mov_n,
                    'DESCRIPCION_CIIU': ciiu,
                    'FECHA_IMPRESION': date_obj.strftime('%Y-%m-%d') if date_obj else 'SIN FECHA',
                    'SEMESTRE': semester,
                    'ORIGEN_BDD': label
                })
                
    df_matched = pd.DataFrame(all_matched_records)
    print(f"Total registros matched antes de deduplicar: {len(df_matched)}")
    
    if df_matched.empty:
        print("No se encontraron licencias para los predios de la Calle Rocafuerte.")
        return
        
    # 3. Deduplicación
    df_matched['lic_norm'] = df_matched['LICENCIA'].str.strip().str.lower()
    df_matched['predio_norm'] = df_matched['PREDIO'].str.strip().str.lower()
    df_matched['mov_norm'] = df_matched['MOVIMIENTO'].str.strip().str.upper()
    df_matched['ciiu_norm'] = df_matched['DESCRIPCION_CIIU'].str.strip().str.lower()
    
    df_dedup = df_matched.drop_duplicates(subset=['lic_norm', 'predio_norm', 'mov_norm', 'ciiu_norm']).copy()
    print(f"Total registros únicos después de deduplicar: {len(df_dedup)}")
    
    # 4. Agrupación semestral
    # Obtener todos los semestres válidos ordenados
    semesters = sorted([s for s in df_dedup['SEMESTRE'].unique() if s not in ['SIN FECHA', 'FECHA INVALIDA']])
    
    summary_rows = []
    for sem in semesters:
        df_sem = df_dedup[df_dedup['SEMESTRE'] == sem]
        emisiones = int((df_sem['MOVIMIENTO'] == 'EMISION').sum())
        renovaciones = int((df_sem['MOVIMIENTO'] == 'RENOVACION').sum())
        total = emisiones + renovaciones
        summary_rows.append({
            'Semestre': sem,
            'Emisiones (Emitidas)': emisiones,
            'Renovaciones (Renovadas)': renovaciones,
            'Total LUAEs': total
        })
        
    # Agregar casos sin fecha si existieran
    df_sin_fecha = df_dedup[df_dedup['SEMESTRE'].isin(['SIN FECHA', 'FECHA INVALIDA'])]
    if not df_sin_fecha.empty:
        emisiones = int((df_sin_fecha['MOVIMIENTO'] == 'EMISION').sum())
        renovaciones = int((df_sin_fecha['MOVIMIENTO'] == 'RENOVACION').sum())
        summary_rows.append({
            'Semestre': 'Sin Fecha / Inválido',
            'Emisiones (Emitidas)': emisiones,
            'Renovaciones (Renovadas)': renovaciones,
            'Total LUAEs': emisiones + renovaciones
        })
        
    df_summary = pd.DataFrame(summary_rows)
    print("\n--- RESUMEN SEMESTRAL ---")
    print(df_summary.to_string(index=False))
    
    # 5. Escribir a Excel con formato multi-pestaña
    with pd.ExcelWriter(OUTPUT_PATH, engine='openpyxl') as writer:
        df_summary.to_excel(writer, sheet_name='Resumen Semestral', index=False)
        
        # Eliminar las columnas auxiliares de deduplicación para limpiar el output de detalle
        df_detail_save = df_dedup.drop(columns=['lic_norm', 'predio_norm', 'mov_norm', 'ciiu_norm'])
        df_detail_save.to_excel(writer, sheet_name='Detalle Licencias', index=False)
        
    print(f"\nExcel guardado exitosamente en: {os.path.abspath(OUTPUT_PATH)}")
    
if __name__ == '__main__':
    main()
