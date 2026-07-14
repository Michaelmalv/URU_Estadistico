import pandas as pd
import openpyxl
import os

OLD_PATH = 'scratch/old_seguridad.xlsx'
NEW_PATH = 'data/Evaluación de proyectos estratégicos_ SEGURIDAD.xlsx'

def read_excel_data(path):
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    
    data = {}
    current_cat = ''
    
    # Mapeamos fila por fila a partir del renglón 5 (0-indexed 4)
    for r_idx, row in enumerate(rows[4:], 5):
        if row[0] and isinstance(row[0], str) and row[0].strip():
            current_cat = row[0].strip()
            
        nombre = row[1]
        if not nombre or not isinstance(nombre, str) or not nombre.strip():
            continue
        nombre = nombre.strip()
        
        # Guardar todos los valores de las columnas a partir del índice 5 en adelante (las métricas)
        metrics = list(row[5:])
        
        data[nombre] = {
            'cat': current_cat,
            'ubicacion': row[2],
            'extension': row[3],
            'fecha': row[4],
            'metrics': metrics,
            'raw_row': row
        }
    return data

def main():
    import subprocess
    try:
        git_cmd = ["git", "show", "HEAD:data/Evaluación de proyectos estratégicos_ SEGURIDAD.xlsx"]
        binary_data = subprocess.check_output(git_cmd)
        os.makedirs(os.path.dirname(OLD_PATH), exist_ok=True)
        with open(OLD_PATH, 'wb') as f:
            f.write(binary_data)
        print("Versión anterior de Excel extraída de Git con éxito.")
    except Exception as e:
        print(f"Error al extraer de Git: {e}")

    if not os.path.exists(OLD_PATH) or not os.path.exists(NEW_PATH):
        print("Error: No se encuentra alguno de los archivos para comparar.")
        return
        
    old_data = read_excel_data(OLD_PATH)
    new_data = read_excel_data(NEW_PATH)
    
    print(f"Proyectos en archivo anterior: {len(old_data)}")
    print(f"Proyectos en archivo nuevo: {len(new_data)}")
    
    # 1. Buscar nuevos proyectos
    nuevos = [p for p in new_data if p not in old_data]
    if nuevos:
        print(f"\n[+] Nuevos proyectos agregados ({len(nuevos)}):")
        for p in nuevos:
            print(f"  - {p} ({new_data[p]['cat']})")
            
    # 2. Buscar proyectos eliminados
    eliminados = [p for p in old_data if p not in new_data]
    if eliminados:
        print(f"\n[-] Proyectos eliminados ({len(eliminados)}):")
        for p in eliminados:
            print(f"  - {p}")
            
    # 3. Comparar métricas y metadatos de proyectos existentes
    comunes = [p for p in new_data if p in old_data]
    cambios_metadatos = 0
    cambios_metricas = 0
    
    metric_cols = [
        # 2023 (11 cols)
        '2023 D.Propiedad', '2023 Escándalos', '2023 E.Clandestinos', '2023 Libadores', '2023 Sustancias',
        '2023 R.Carros', '2023 R.Motos', '2023 R.Personas', '2023 R.Locales', '2023 R.Autopartes', '2023 R.Casas',
        # 2024 (11 cols)
        '2024 D.Propiedad', '2024 Escándalos', '2024 E.Clandestinos', '2024 Libadores', '2024 Sustancias',
        '2024 R.Carros', '2024 R.Motos', '2024 R.Personas', '2024 R.Locales', '2024 R.Autopartes', '2024 R.Casas',
        # 2025 (11 cols)
        '2025 D.Propiedad', '2025 Escándalos', '2025 E.Clandestinos', '2025 Libadores', '2025 Sustancias',
        '2025 R.Carros', '2025 R.Motos', '2025 R.Personas', '2025 R.Locales', '2025 R.Autopartes', '2025 R.Casas',
        # 2026* (11 cols)
        '2026* D.Propiedad', '2026* Escándalos', '2026* E.Clandestinos', '2026* Libadores', '2026* Sustancias',
        '2026* R.Carros', '2026* R.Motos', '2026* R.Personas', '2026* R.Locales', '2026* R.Autopartes', '2026* R.Casas'
    ]
    
    print("\n--- COMPARACIÓN DE DETALLES ---")
    
    for p in comunes:
        o = old_data[p]
        n = new_data[p]
        
        # Comparar ubicación, extensión, fecha
        meta_diff = []
        if o['ubicacion'] != n['ubicacion']:
            meta_diff.append(f"Ubicación: '{o['ubicacion']}' -> '{n['ubicacion']}'")
        if o['extension'] != n['extension']:
            meta_diff.append(f"Extensión: '{o['extension']}' -> '{n['extension']}'")
        if o['fecha'] != n['fecha']:
            meta_diff.append(f"Fecha: '{o['fecha']}' -> '{n['fecha']}'")
            
        if meta_diff:
            cambios_metadatos += 1
            print(f"\n[Meta] Cambios en proyecto '{p}':")
            for d in meta_diff:
                print(f"  * {d}")
                
        # Comparar métricas
        o_met = o['metrics']
        n_met = n['metrics']
        
        metric_diffs = []
        # Solo comparar hasta el tamaño de la menor lista para evitar IndexError
        limit = min(len(o_met), len(n_met), len(metric_cols))
        for idx in range(limit):
            o_val = o_met[idx]
            n_val = n_met[idx]
            if o_val != n_val:
                col_name = metric_cols[idx]
                metric_diffs.append(f"{col_name}: {o_val} -> {n_val}")
                
        if metric_diffs:
            cambios_metricas += 1
            # Imprimir solo los primeros 5 cambios para no inundar el log, pero contar todos
            print(f"\n[Métrica] Cambios de indicadores en '{p}' ({len(metric_diffs)} celdas modificadas):")
            for md in metric_diffs[:6]:
                print(f"  * {md}")
            if len(metric_diffs) > 6:
                print(f"  * ... y {len(metric_diffs) - 6} cambios más en este proyecto.")
                
    print("\n==========================================")
    print(f"Total proyectos comunes evaluados: {len(comunes)}")
    print(f"Proyectos con cambios de metadatos: {cambios_metadatos}")
    print(f"Proyectos con cambios en métricas de delitos/incidentes: {cambios_metricas}")
    print("==========================================")

if __name__ == '__main__':
    main()
