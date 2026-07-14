import pandas as pd
import numpy as np

# 1. Leer predios de Calle Rocafuerte (columna 39)
df_predios = pd.read_excel('data/PREDIOS.xlsx', header=None)
# Col 39 (0-indexed)
raw_predios = df_predios.iloc[2:, 39].dropna().tolist()
rocafuerte_predios = []
for p in raw_predios:
    try:
        val = int(float(p))
        rocafuerte_predios.append(val)
    except ValueError:
        pass
rocafuerte_predios = list(set(rocafuerte_predios))
print(f"Calle Rocafuerte Predio count: {len(rocafuerte_predios)}")
print("First 10 predios:", rocafuerte_predios[:10])

# 2. Cargar BDD 2022
print("\n--- BDD 2022 ---")
df_22 = pd.read_excel('data/BDD LUAE 2022- Proyectos estrategicos _ Desarrollo Urbanistico.xlsx')
cols_22 = df_22.columns.tolist()
print("Columns:", cols_22)

# Buscar columnas
mov_col_22 = [c for c in cols_22 if 'MOVIMIENTO' in c][0]
date_col_22 = [c for c in cols_22 if 'IMPRESI' in c or 'FECHA' in c][0] # Buscamos fecha impresión
predio_col_22 = [c for c in cols_22 if 'PREDIO' in c][0]

print(f"Detected columns 22: Movimiento={mov_col_22}, Fecha={date_col_22}, Predio={predio_col_22}")
print("Unique movement types 2022:", df_22[mov_col_22].unique())
print("Date column sample 2022:")
print(df_22[date_col_22].head())

# 3. Cargar BDD 2023+
print("\n--- BDD 2023+ ---")
df_23 = pd.read_excel('data/BDD- Proyectos estrategicos _ Desarrollo Urbanistico.xlsx')
cols_23 = df_23.columns.tolist()

# Buscar columnas
mov_col_23 = [c for c in cols_23 if 'MOVIMIENTO' in c][0]
date_col_23 = [c for c in cols_23 if 'IMPRESI' in c or 'FECHA' in c][0]
predio_col_23 = [c for c in cols_23 if 'PREDIO' in c][0]

print(f"Detected columns 23: Movimiento={mov_col_23}, Fecha={date_col_23}, Predio={predio_col_23}")
print("Unique movement types 2023+:", df_23[mov_col_23].unique())
print("Date column sample 2023+:")
print(df_23[date_col_23].head())
