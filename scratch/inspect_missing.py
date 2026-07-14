import os
import pandas as pd

path = r"c:\Users\User\Desktop\URU-Estadisticas\URU_Estadistico\data\Coordenas de Proyectos faltantes.xlsx"

try:
    df = pd.read_excel(path)
    print("Columns:", df.columns.tolist())
    print("Shape:", df.shape)
    print("First 10 rows:")
    print(df.head(10))
    proj_col = [col for col in df.columns if 'PROYECTO' in col.upper() or 'NOMBRE' in col.upper()]
    if proj_col:
        print("\nUnique projects in file:")
        print(df[proj_col[0]].dropna().unique())
    else:
        print("\nNo project column found!")
except Exception as e:
    print("Error:", e)
