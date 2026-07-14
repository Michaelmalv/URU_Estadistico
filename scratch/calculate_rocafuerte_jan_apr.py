import os
import re
import unicodedata
import pandas as pd
import numpy as np

DATA_DIR = r"C:\Users\User\Desktop\URU-Estadisticas\URU_Estadistico\data"
PREDIOS_PATH = os.path.join(DATA_DIR, 'PREDIOS.xlsx')
BDD_22_PATH = os.path.join(DATA_DIR, 'BDD LUAE 2022- Proyectos estrategicos _ Desarrollo Urbanistico.xlsx')
BDD_23_PATH = os.path.join(DATA_DIR, 'BDD- Proyectos estrategicos _ Desarrollo Urbanistico.xlsx')

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

def main():
    # 1. Obtener predios de Calle Rocafuerte (columna 39)
    df_predios = pd.read_excel(PREDIOS_PATH, header=None)
    raw_predios = df_predios.iloc[2:, 39].dropna().tolist()
    rocafuerte_predios = set([clean_predio(p) for p in raw_predios if clean_predio(p)])
    
    # 2. Cargar y filtrar BDDs
    all_matched = []
    bdd_files = [(BDD_22_PATH, "2022"), (BDD_23_PATH, "2023+")]
    
    for path, label in bdd_files:
        df = pd.read_excel(path)
        predio_col = [c for c in df.columns if normalize(c) == 'predio'][0]
        licencia_col = [c for c in df.columns if 'licencia' in normalize(c)][0]
        mov_col = [c for c in df.columns if 'tipo de movimiento' in normalize(c) or 'movimiento' in normalize(c)][0]
        ciiu_col = [c for c in df.columns if 'ciiu' in normalize(c) and 'descrip' in normalize(c)][0]
        fecha_col = [c for c in df.columns if 'impresion' in normalize(c) or 'impresio' in normalize(c)][0]
        
        for idx, row in df.iterrows():
            p_clean = clean_predio(row[predio_col])
            if p_clean in rocafuerte_predios:
                lic = str(row[licencia_col]).strip()
                mov = str(row[mov_col]).strip()
                ciiu = str(row[ciiu_col]).strip() if pd.notna(row[ciiu_col]) else ''
                fecha_val = row[fecha_col]
                
                mov_n = norm_mov(mov)
                if mov_n not in ['EMISION', 'RENOVACION']:
                    continue
                    
                date_obj = None
                if pd.notna(fecha_val):
                    try:
                        date_obj = pd.to_datetime(fecha_val)
                    except Exception:
                        pass
                        
                all_matched.append({
                    'PREDIO': p_clean,
                    'LICENCIA': lic,
                    'MOVIMIENTO': mov_n,
                    'DESCRIPCION_CIIU': ciiu,
                    'FECHA_IMPRESION': date_obj,
                    'ANIO': date_obj.year if date_obj else None,
                    'MES': date_obj.month if date_obj else None
                })
                
    df_matched = pd.DataFrame(all_matched)
    
    # Deduplicación
    df_matched['lic_norm'] = df_matched['LICENCIA'].str.strip().str.lower()
    df_matched['predio_norm'] = df_matched['PREDIO'].str.strip().str.lower()
    df_matched['mov_norm'] = df_matched['MOVIMIENTO'].str.strip().str.upper()
    df_matched['ciiu_norm'] = df_matched['DESCRIPCION_CIIU'].str.strip().str.lower()
    df_dedup = df_matched.drop_duplicates(subset=['lic_norm', 'predio_norm', 'mov_norm', 'ciiu_norm']).copy()
    
    # Filtrar registros con año válido
    df_valid = df_dedup.dropna(subset=['ANIO', 'MES']).copy()
    df_valid['ANIO'] = df_valid['ANIO'].astype(int)
    df_valid['MES'] = df_valid['MES'].astype(int)
    
    print("\n--- DISTRIBUCIÓN POR AÑO ---")
    print(df_valid['ANIO'].value_counts().sort_index())
    
    # Comprobar registros de 2026
    print("\n--- REGISTROS POR MES EN 2026 ---")
    df_2026 = df_valid[df_valid['ANIO'] == 2026]
    print(df_2026['MES'].value_counts().sort_index())
    
    # Frecuencias Enero-Abril (Meses 1, 2, 3, 4) por año
    print("\n--- EMISIONES Y RENOVACIONES DE ENERO A ABRIL POR AÑO ---")
    years = sorted(df_valid['ANIO'].unique())
    for yr in years:
        df_yr_ja = df_valid[(df_valid['ANIO'] == yr) & (df_valid['MES'] <= 4)]
        emisiones = (df_yr_ja['MOVIMIENTO'] == 'EMISION').sum()
        renovaciones = (df_yr_ja['MOVIMIENTO'] == 'RENOVACION').sum()
        print(f"Año {yr} (Ene-Abr): Emisiones = {emisiones}, Renovaciones = {renovaciones}, Total = {emisiones + renovaciones}")

    # Datos históricos completos por año y tramo (Ene-Abr vs May-Dic)
    print("\n--- COMPARATIVA HISTÓRICA ENE-ABR VS MAY-DIC ---")
    for yr in years:
        df_yr = df_valid[df_valid['ANIO'] == yr]
        df_yr_ja = df_yr[df_yr['MES'] <= 4]
        df_yr_md = df_yr[df_yr['MES'] > 4]
        
        tot_ja = len(df_yr_ja)
        tot_md = len(df_yr_md)
        ratio_ja = tot_ja / len(df_yr) if len(df_yr) > 0 else 0
        print(f"Año {yr}: Total Año = {len(df_yr)}, Ene-Abr = {tot_ja} ({ratio_ja:.1%}), May-Dic = {tot_md}")

if __name__ == '__main__':
    main()
