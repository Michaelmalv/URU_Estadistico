import openpyxl

def inspect_file(path, label):
    print(f"\n=== INSPECTING {label} ({path}) ===")
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    
    # Imprimir las primeras 5 filas (primeras 10 columnas)
    for r_idx, r in enumerate(rows[:6]):
        print(f"Row {r_idx}: {r[:12]}")

inspect_file('scratch/old_seguridad.xlsx', 'OLD FILE')
inspect_file('data/Evaluación de proyectos estratégicos_ SEGURIDAD.xlsx', 'NEW FILE')
