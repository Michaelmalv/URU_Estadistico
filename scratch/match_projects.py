import os
import pandas as pd
import unicodedata
import re
import json

data_dir = r"c:\Users\User\Desktop\URU-Estadisticas\URU_Estadistico\data"
files = [
    "VERTICES INTERVENCIONES ESPACIO PÚBLICO.xlsx",
    "VERTICES SENDEROS SEGUROS 2024.xlsx",
    "VERTICES SENDEROS SEGUROS 2026.xlsx",
    "VERTICES SENDERSO SEGUROS 2025.xlsx",
    "VERTICES ZONAS METRO.xlsx"
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

def normalize(text):
    if not text:
        return ''
    s = str(text).strip().lower()
    s = ''.join(c for c in unicodedata.normalize('NFKD', s) if not unicodedata.combining(c))
    s = re.sub(r'[^a-z0-9]+', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

excel_projects = set()
for file in files:
    path = os.path.join(data_dir, file)
    if not os.path.exists(path):
        continue
    df = pd.read_excel(path)
    proj_col = [col for col in df.columns if 'PROYECTO' in col.upper() or 'NOMBRE' in col.upper()][0]
    excel_projects.update(df[proj_col].dropna().unique())

print("Excel Projects:")
excel_list = sorted(list(excel_projects))
for idx, ep in enumerate(excel_list):
    print(f"  {idx+1}. '{ep}' -> '{normalize(ep)}'")

print("\nMatching attempt:")
mapping = {}
for dp in db_projects:
    dp_norm = normalize(dp)
    
    # Exact match in normalized forms
    matched = None
    for ep in excel_projects:
        ep_norm = normalize(ep)
        if dp_norm == ep_norm:
            matched = ep
            break
            
    # Substring match / heuristic match
    if not matched:
        for ep in excel_projects:
            ep_norm = normalize(ep)
            # If DB is 'el labrador bulevar y parque de la resiliencia' and Excel is 'labrador'
            if ep_norm in dp_norm or dp_norm in ep_norm:
                matched = ep
                break
                
    # Specific exceptions
    if not matched:
        if dp == "El Tingo-2 de Agosto":
            for ep in excel_projects:
                if normalize(ep) == "el tingo":
                    matched = ep
                    break
        elif dp == "Chillogallo-Luis Lopez":
            for ep in excel_projects:
                if "lopez" in normalize(ep):
                    matched = ep
                    break
        elif dp == "Isla Tortuga":
            for ep in excel_projects:
                if "isla tortuga" in normalize(ep):
                    matched = ep
                    break
        elif dp == "Av. Ramón Borja":
            for ep in excel_projects:
                if "borja" in normalize(ep):
                    matched = ep
                    break
        elif dp == "La Magdalena":
            for ep in excel_projects:
                if normalize(ep) == "magdalena":
                    matched = ep
                    break
        elif dp == "La Alameda":
            for ep in excel_projects:
                if normalize(ep) == "alameda":
                    matched = ep
                    break
        elif dp == "La Pradera":
            for ep in excel_projects:
                if normalize(ep) == "pradera":
                    matched = ep
                    break
        elif dp == "La Carolina":
            for ep in excel_projects:
                if normalize(ep) == "carolina":
                    matched = ep
                    break
        elif dp == "Bulevar Tribuna de los Shyris":
            for ep in excel_projects:
                if "shyris" in normalize(ep):
                    matched = ep
                    break
        elif dp == "Calle Benalcazar":
            for ep in excel_projects:
                if "benalcazar" in normalize(ep):
                    matched = ep
                    break
                    
    print(f"DB: '{dp}' ({dp_norm}) -> Matched Excel: '{matched}'")
