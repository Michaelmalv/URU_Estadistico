import os
import re
import unicodedata
import pandas as pd
from supabase import create_client

def normalize(text):
    if not text or pd.isna(text):
        return ''
    s = str(text).strip().lower()
    s = ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))
    # Map \ufffd or replacement characters if they occur
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

def get_supabase_credentials():
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

    # Try root .env
    env_root = r"c:\Users\User\Desktop\URU-Estadisticas\URU_Estadistico\.env"
    if os.path.exists(env_root):
        with open(env_root, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("SUPABASE_URL="):
                    supabase_url = line.split("=", 1)[1].strip()
                elif line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    supabase_key = line.split("=", 1)[1].strip()

    # Try web/.env.local if not loaded
    if not supabase_url or not supabase_key:
        env_web = r"c:\Users\User\Desktop\URU-Estadisticas\URU_Estadistico\web\.env.local"
        if os.path.exists(env_web):
            with open(env_web, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("NEXT_PUBLIC_SUPABASE_URL="):
                        supabase_url = line.split("=", 1)[1].strip()
                    elif line.startswith("NEXT_PUBLIC_SUPABASE_ANON_KEY="):
                        supabase_key = line.split("=", 1)[1].strip()

    return supabase_url, supabase_key

def main():
    print("=== INGESTIÓN DE REGISTROS DE ECONOMÍA EXACTOS ===")
    
    # 1. Conectar a Supabase
    supabase_url, supabase_key = get_supabase_credentials()
    if not supabase_url or not supabase_key:
        print("Error: No se pudieron cargar las credenciales de Supabase.")
        return
    print(f"Conectando a Supabase en {supabase_url}...")
    supabase = create_client(supabase_url, supabase_key)

    # 2. Cargar mapeo de predios a proyectos
    data_dir = r"c:\Users\User\Desktop\URU-Estadisticas\URU_Estadistico\data"
    predios_path = os.path.join(data_dir, "PREDIOS.xlsx")
    if not os.path.exists(predios_path):
        print(f"Error: No se encuentra el archivo {predios_path}")
        return

    print("Cargando mapeo de predios desde PREDIOS.xlsx...")
    df_predios = pd.read_excel(predios_path, header=None)

    categories = []
    last_cat = None
    for col in range(df_predios.shape[1]):
        val = df_predios.iloc[0, col]
        if pd.notna(val) and str(val).strip() != "":
            last_cat = str(val).strip()
        categories.append(last_cat)

    projects = []
    for col in range(df_predios.shape[1]):
        val = df_predios.iloc[1, col]
        proj_name = str(val).strip() if pd.notna(val) else ""
        projects.append(proj_name)

    # Mapping of Excel column projects to canonical DB project names
    db_names = {
        'AV. PATRIA': 'Av. Patria',
        'AV. COLON': 'Av. Colón',
        'EL TINGO': 'El Tingo-2 de Agosto',
        'AV. MICHELENA': 'Av. Michelena',
        'CHILLOGALLO': 'Chillogallo-Luis Lopez',
        'CALDAS Y ANTEPARA': 'Caldas y Antepara',
        'AV. CARAPUNGO': 'Av. Carapungo',
        'LA ROLDOS': 'La Roldós Oe13-Colinas del Norte',
        'ISLA TORTUGA': 'Isla Tortuga',
        'JUAN MONTALVO': 'Juan Montalvo',
        'CONOCOTO': 'Conocoto',
        'AV. AJAVI': 'Av. Ajaví',
        'ESCALINATAS ROCAFUERTE': 'Escalinatas Rocafuerte',
        'AV. LA ECUATORIANA': 'Av. La Ecuatoriana',
        'GABRIEL GARCIA MORENO': 'Gabriel García Moreno',
        'LIZARDO RUIZ': 'Lizardo Ruiz',
        'AV. RAMON BORJA': 'Av. Ramón Borja',
        'VIA DEL FERROCARRIL': 'Vía del Ferrocarril',
        'RUIZ DE CASTILLA': 'Ruiz de Castilla',
        'AV. CACHA': 'Av. Cacha',
        'NANEGALITO': 'Nanegalito',
        'COMITE DEL PUEBLO': 'Comité del Pueblo',
        'LA MARISCAL': 'La Mariscal',
        'RIO DE JANEIRO': 'Río de Janeiro',
        'QUITUMBE': 'Quitumbe',
        'MORAN VALVERDE': 'Morán Valverde',
        'SOLANDA': 'Solanda',
        'CARDENAL DE LA TORRE': 'Cardenal de la Torre',
        'EL RECREO': 'El Recreo',
        'LA MAGDALENA': 'La Magdalena',
        'SAN FRANCISCO': 'San Francisco',
        'ALAMEDA': 'La Alameda',
        'EL EJIDO': 'El Ejido',
        'UNIVERSIDAD CENTRAL': 'Universidad Central',
        'LA PRADERA': 'La Pradera',
        'LA CAROLINA': 'La Carolina',
        'INAQUITO': 'Iñaquito',
        'JIPIJAPA': 'Jipijapa',
        'EL LABRADOR': 'El Labrador: Bulevar y Parque de la Resiliencia',
        'CALLE ROCAFUERTE': 'Calle Rocafuerte',
        'CALLE BENALCAZAR': 'Calle Benalcazar',
        'BULEVAR TRIBUNA DE LOS SHYRIS': 'Bulevar Tribuna de los Shyris',
        'PARQUE NAVARRO': 'Parque Navarro - Plaza de las tripas'
    }

    # Build predio-to-projects mapping
    predio_to_projects = {}
    for col_idx in range(df_predios.shape[1]):
        proj_header = projects[col_idx]
        norm_header = normalize(proj_header)
        db_proj = db_names.get(norm_header)
        if not db_proj:
            # Try standard match
            for k, v in db_names.items():
                if normalize(k) == norm_header:
                    db_proj = v
                    break
        if not db_proj:
            print(f"Warning: No se pudo mapear la columna '{proj_header}' ({norm_header})")
            continue
        
        predio_list = df_predios.iloc[2:, col_idx].dropna().tolist()
        for p in predio_list:
            p_clean = clean_predio(p)
            if p_clean:
                if p_clean not in predio_to_projects:
                    predio_to_projects[p_clean] = set()
                predio_to_projects[p_clean].add(db_proj)

    print(f"Mapeo cargado: {len(predio_to_projects)} predios únicos asociados a proyectos.")

    # 3. Leer y procesar archivos de LUAE (2022 y 2023+)
    bdd_files = [
        "BDD LUAE 2022- Proyectos estrategicos _ Desarrollo Urbanistico.xlsx",
        "BDD- Proyectos estrategicos _ Desarrollo Urbanistico.xlsx"
    ]

    all_records = []

    for filename in bdd_files:
        path = os.path.join(data_dir, filename)
        if not os.path.exists(path):
            print(f"Advertencia: No se encuentra {path}")
            continue

        print(f"Leyendo archivo: {filename}...")
        df = pd.read_excel(path)

        predio_col = [c for c in df.columns if normalize(c) == 'predio'][0]
        licencia_col = [c for c in df.columns if 'licencia' in normalize(c)][0]
        mov_col = [c for c in df.columns if 'tipo de movimiento' in normalize(c) or 'movimiento' in normalize(c)][0]
        ciiu_col = [c for c in df.columns if 'ciiu' in normalize(c) and 'descrip' in normalize(c)][0]
        fecha_col = [c for c in df.columns if 'impresion' in normalize(c) or 'impresio' in normalize(c)][0]

        for idx, row in df.iterrows():
            p_raw = row[predio_col]
            p_clean = clean_predio(p_raw)

            # Si el predio no está asociado a ningún proyecto, lo ignoramos
            if p_clean not in predio_to_projects:
                continue

            lic = str(row[licencia_col]).strip()
            mov = str(row[mov_col]).strip()
            ciiu = str(row[ciiu_col]).strip() if pd.notna(row[ciiu_col]) else ''
            fecha_val = row[fecha_col]

            # Formatear fecha
            date_str = None
            if pd.notna(fecha_val):
                if isinstance(fecha_val, pd.Timestamp):
                    date_str = fecha_val.strftime('%Y-%m-%d')
                elif isinstance(fecha_val, str):
                    date_str = fecha_val.strip()
                else:
                    date_str = str(fecha_val).strip()

            # Normalizar movimiento a EMISION o RENOVACION
            mov_n = norm_mov(mov)
            if mov_n not in ['EMISION', 'RENOVACION']:
                continue

            all_records.append({
                'predio': p_clean,
                'licencia': lic,
                'movimiento': mov_n,
                'ciiu': ciiu,
                'fecha': date_str
            })

    print(f"Total registros matched antes de deduplicar: {len(all_records)}")

    # 4. Aplicar regla de deduplicación de negocios
    # Si se repite Licencia, Predio, Movimiento y CIIU, se colapsa a uno.
    df_all = pd.DataFrame(all_records)
    
    # Creamos columnas auxiliares normalizadas para la deduplicación
    df_all['lic_norm'] = df_all['licencia'].str.strip().str.lower()
    df_all['predio_norm'] = df_all['predio'].str.strip().str.lower()
    df_all['mov_norm'] = df_all['movimiento'].str.strip().str.upper()
    df_all['ciiu_norm'] = df_all['ciiu'].str.strip().str.lower()

    df_dedup = df_all.drop_duplicates(subset=['lic_norm', 'predio_norm', 'mov_norm', 'ciiu_norm'])
    print(f"Total registros únicos después de deduplicar: {len(df_dedup)}")

    # 5. Expandir registros para predios que pertenecen a múltiples proyectos
    final_db_records = []
    for idx, row in df_dedup.iterrows():
        p_clean = row['predio']
        associated_projects = predio_to_projects.get(p_clean, [])
        for proj in associated_projects:
            final_db_records.append({
                'sector_raw': proj,
                'movimiento_raw': row['movimiento'],
                'fecha_impresion': row['fecha']
            })

    print(f"Total registros expandidos para inserción en Base de Datos: {len(final_db_records)}")

    # 6. Limpiar y subir a Supabase
    print("Vaciando tabla economia_registros en Supabase...")
    try:
        # Una forma segura de eliminar todos los registros es un delete sin filtro o con un id > 0
        supabase.table("economia_registros").delete().gt("id", 0).execute()
        print("Tabla vaciada con éxito.")
    except Exception as e:
        print(f"Error al vaciar tabla: {e}")
        return

    print("Insertando nuevos registros en Supabase por lotes de 1000...")
    batch_size = 1000
    for i in range(0, len(final_db_records), batch_size):
        batch = final_db_records[i:i+batch_size]
        try:
            supabase.table("economia_registros").insert(batch).execute()
            print(f"  > Insertado lote {i // batch_size + 1} ({len(batch)} registros)")
        except Exception as e:
            print(f"Error al insertar lote en la posición {i}: {e}")
            return

    print("\n=== INGESTIÓN COMPLETADA CON ÉXITO ===")

if __name__ == '__main__':
    main()
