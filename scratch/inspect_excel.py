import openpyxl
import pandas as pd
import glob
import os

# Ver las primeras filas de PREDIOS.xlsx
df_predios = pd.read_excel('data/PREDIOS.xlsx', header=None, nrows=10)
print("--- PREDIOS.xlsx First 5 rows ---")
print(df_predios.iloc[:5, :10]) # primeras 5 filas y 10 columnas

# Buscar si "Rocafuerte" o "Calle Rocafuerte" está en las cabeceras (fila 0 o 1)
print("\n--- Searching for 'Rocafuerte' in headers ---")
for col_idx in range(df_predios.shape[1]):
    val_row0 = str(df_predios.iloc[0, col_idx]).strip()
    val_row1 = str(df_predios.iloc[1, col_idx]).strip()
    if 'rocafuerte' in val_row0.lower() or 'rocafuerte' in val_row1.lower():
        print(f"Col {col_idx}: Row 0='{val_row0}', Row 1='{val_row1}'")

# Ver columnas de BDD LUAE 2022
df_luae_22 = pd.read_excel('data/BDD LUAE 2022- Proyectos estrategicos _ Desarrollo Urbanistico.xlsx', nrows=5)
print("\n--- BDD LUAE 2022 Columns ---")
print(df_luae_22.columns.tolist())

# Ver columnas de BDD Proyectos estrategicos (2023+)
df_luae_23 = pd.read_excel('data/BDD- Proyectos estrategicos _ Desarrollo Urbanistico.xlsx', nrows=5)
print("\n--- BDD- Proyectos estrategicos 2023+ Columns ---")
print(df_luae_23.columns.tolist())
