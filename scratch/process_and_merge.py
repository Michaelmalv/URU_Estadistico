import os
import pandas as pd
import json
import math
import unicodedata
import re

data_dir = r"c:\Users\User\Desktop\URU-Estadisticas\URU_Estadistico\data"
files = [
    "VERTICES INTERVENCIONES ESPACIO PÚBLICO.xlsx",
    "VERTICES SENDEROS SEGUROS 2024.xlsx",
    "VERTICES SENDEROS SEGUROS 2026.xlsx",
    "VERTICES SENDERSO SEGUROS 2025.xlsx",
    "VERTICES ZONAS METRO.xlsx",
    "Coordenas de Proyectos faltantes.xlsx"
]

db_projects = [
    "Av. Patria", "Av. Colón", "El Tingo-2 de Agosto", "Av. Michelena",
    "Chillogallo-Luis Lopez", "Caldas y Antepara", "Av. Carapungo",
    "La Roldós Oe13-Colinas del Norte", "Isla Tortuga", "Juan Montalvo",
    "Conocoto", "Av. Ajaví", "Escalinatas Rocafuerte", "Av. La Ecuatoriana",
    "Gabriel García Moreno", "Lizardo Ruiz", "Av. Ramón Borja",
    "Vía del Ferrocarril", "Ruiz de Castilla", "Av. Cacha", "Nanegalito",
    "Comité del Pueblo", "La Mariscal", "Río de Janeiro", "Quitumbe",
    "Morán Valverde", "Solanda", "Cardenal de la Torre", "El Recreo",
    "La Magdalena", "San Francisco", "La Alameda", "El Ejido",
    "Universidad Central", "La Pradera", "La Carolina", "Iñaquito",
    "Jipijapa", "El Labrador: Bulevar y Parque de la Resiliencia",
    "Calle Rocafuerte", "Bulevar Tribuna de los Shyris",
    "Parque Navarro - Plaza de las tripas", "Calle Benalcazar"
]

def normalize_key(text):
    if not text:
        return ''
    s = str(text).strip().lower()
    s = ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))
    s = re.sub(r'[^a-z0-9]+', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

# Exact DB normalized keys list
db_keys = {normalize_key(p): p for p in db_projects}

# Custom mapping from Excel Project Name -> DB Project Name
EXCEL_TO_DB_MAP = {
    "LABRADOR": "El Labrador: Bulevar y Parque de la Resiliencia",
    "El Tingo": "El Tingo-2 de Agosto",
    "Calle Luis Francisco López": "Chillogallo-Luis Lopez",
    "Calle Luis Francisco Lope": "Chillogallo-Luis Lopez",
    "Calle Luis Francisco Lópe": "Chillogallo-Luis Lopez",
    "Calle Luis Francisco Lpez": "Chillogallo-Luis Lopez",
    "Av. Juan de Ascaray y parque Isla Tortuga": "Isla Tortuga",
    "CAPITAN RAMON BORJA": "Av. Ramón Borja",
    "MAGDALENA": "La Magdalena",
    "ALAMEDA": "La Alameda",
    "PRADERA": "La Pradera",
    "CAROLINA": "La Carolina",
    "BULEVAR SHYRIS": "Bulevar Tribuna de los Shyris",
    "BENALCAZAR": "Calle Benalcazar",
    "La Roldós Oe13- COLINAS DEL NORTE": "La Roldós Oe13-Colinas del Norte",
    "La Roldós Oe13- COLINAS DEL NORTE": "La Roldós Oe13-Colinas del Norte",
}

# Add normalization mappings for direct matches
all_coordinates = {}

for file in files:
    path = os.path.join(data_dir, file)
    if not os.path.exists(path):
        continue
    
    print(f"Reading {file}...")
    df = pd.read_excel(path)
    proj_col = [col for col in df.columns if 'PROYECTO' in col.upper() or 'NOMBRE' in col.upper()][0]
    
    df = df.dropna(subset=[proj_col, 'X', 'Y'])
    
    for excel_name, group in df.groupby(proj_col):
        # Sort coordinates if there is an id or fid to maintain order
        sort_cols = [col for col in group.columns if col.lower() in ['fid', 'id']]
        if sort_cols:
            group = group.sort_values(by=sort_cols[0])
            
        coords = group[['X', 'Y']].values.tolist()
        
        valid_coords = []
        for x, y in coords:
            try:
                xf = float(x)
                yf = float(y)
                # Quito coordinate filters
                if -80.0 < xf < -77.0 and -2.0 < yf < 1.0:
                    valid_coords.append([xf, yf])
            except ValueError:
                pass
                
        if len(valid_coords) < 1:
            continue
            
        # Determine target DB project name
        db_name = EXCEL_TO_DB_MAP.get(excel_name)
        if not db_name:
            # Try to match direct normalization
            norm_excel = normalize_key(excel_name)
            if norm_excel in db_keys:
                db_name = db_keys[norm_excel]
            else:
                db_name = excel_name  # Fallback to the excel name itself
                
        key = normalize_key(db_name)
        
        if key in all_coordinates:
            print(f"  Appending points to existing key: '{key}' (for '{db_name}')")
            all_coordinates[key]['coords'].extend(valid_coords)
            all_coordinates[key]['names'].add(excel_name)
        else:
            all_coordinates[key] = {
                'coords': valid_coords,
                'names': {excel_name},
                'source': file,
                'db_name': db_name
            }

# Add old coordinates from MapboxMap.js for projects that might not be in Excel
# (or just to make sure we don't lose any)
old_coordinates = {
    "av patria": {
      "center": [-78.4994, -0.2105],
      "zoom": 15,
      "geojson": {
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [-78.5042, -0.2118],
            [-78.4994, -0.2105],
            [-78.4946, -0.2092]
          ]
        }
      }
    },
    "av colon": {
      "center": [-78.4912, -0.2023],
      "zoom": 15,
      "geojson": {
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [-78.4988, -0.2056],
            [-78.4912, -0.2023],
            [-78.4835, -0.1990]
          ]
        }
      }
    },
    "av michelena": {
      "center": [-78.5365, -0.2541],
      "zoom": 15,
      "geojson": {
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [-78.5410, -0.2520],
            [-78.5365, -0.2541],
            [-78.5320, -0.2562]
          ]
        }
      }
    },
    "chillogallo": {
      "center": [-78.5583, -0.2748],
      "zoom": 15,
      "geojson": {
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [-78.5610, -0.2730],
            [-78.5583, -0.2748],
            [-78.5550, -0.2765]
          ]
        }
      }
    },
    "el tingo": {
      "center": [-78.4447, -0.3168],
      "zoom": 14,
      "geojson": {
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [-78.4490, -0.3150],
            [-78.4447, -0.3168],
            [-78.4410, -0.3190]
          ]
        }
      }
    },
    "el labrador bulevar y parque de la resiliencia": {
      "center": [-78.4867, -0.1550],
      "zoom": 15,
      "geojson": {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-78.48564664, -0.157045378],
            [-78.48568769, -0.15701184],
            [-78.48571151, -0.156993407],
            [-78.48579926, -0.15694784],
            [-78.48584798, -0.156918912]
          ]]
        }
      }
    }
}

merged_coordinates = {}

# Process Excel extracted coordinates
for key, data in all_coordinates.items():
    coords = data['coords']
    
    # Sort or clean coordinates (remove duplicate adjacent coordinates)
    cleaned_coords = []
    for pt in coords:
        if not cleaned_coords or cleaned_coords[-1] != pt:
            cleaned_coords.append(pt)
            
    if len(cleaned_coords) < 1:
        continue
        
    xs = [pt[0] for pt in cleaned_coords]
    ys = [pt[1] for pt in cleaned_coords]
    avg_x = sum(xs) / len(xs)
    avg_y = sum(ys) / len(ys)
    
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    dx = max_x - min_x
    dy = max_y - min_y
    max_d = max(dx, dy)
    
    # Determine zoom
    if max_d < 0.002:
        zoom = 16
    elif max_d < 0.01:
        zoom = 15
    elif max_d < 0.04:
        zoom = 14
    else:
        zoom = 13
        
    p_start = cleaned_coords[0]
    p_end = cleaned_coords[-1]
    dist = math.sqrt((p_start[0] - p_end[0])**2 + (p_start[1] - p_end[1])**2)
    
    is_metro = "ZONAS METRO" in data['source']
    is_space = "ESPACIO PÚBLICO" in data['source']
    
    # We treat as point if it's 1 point, LineString if open, Polygon if closed or from Metro/Space
    if len(cleaned_coords) == 1:
        geojson = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": cleaned_coords[0]
            }
        }
    elif dist < 0.0008 or is_metro or is_space:
        # Make sure polygon is closed (first and last same)
        polygon_coords = list(cleaned_coords)
        if dist > 1e-9:
            polygon_coords.append(cleaned_coords[0])
        geojson = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [polygon_coords]
            }
        }
    else:
        geojson = {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": cleaned_coords
            }
        }
        
    merged_coordinates[key] = {
        "center": [round(avg_x, 6), round(avg_y, 6)],
        "zoom": zoom,
        "geojson": geojson
    }

# Incorporate old coordinates if they are not in the new ones
for key, val in old_coordinates.items():
    if key not in merged_coordinates:
        print(f"Adding old coordinate: '{key}'")
        merged_coordinates[key] = val
    else:
        # If the key is 'el labrador bulevar y parque de la resiliencia', let's combine or keep the old detailed one?
        # Actually, let's keep the new one but print info
        print(f"Overwriting old key '{key}' with new Excel points (Excel: {len(all_coordinates[key]['coords'])} points)")

# Save final coordinates JSON to components folder
target_json = r"c:\Users\User\Desktop\URU-Estadisticas\URU_Estadistico\web\src\app\components\map_coordinates.json"
with open(target_json, 'w', encoding='utf-8') as f:
    json.dump(merged_coordinates, f, indent=2, ensure_ascii=False)
    
print(f"Successfully wrote {len(merged_coordinates)} coordinates to {target_json}!")
