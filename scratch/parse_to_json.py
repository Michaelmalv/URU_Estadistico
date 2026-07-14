import docx
import zipfile
import glob
import os
import shutil
import json

# Directorios origen y destino
DOC_DIR = 'documentos'
PUBLIC_DIR = 'web/public/imagenes_categorias'
SCRATCH_DIR = 'scratch'

# Mapeo de archivos Word a las carpetas de imágenes y claves del home
MAPPING = {
    'Quitopía.docx': {
        'folder': 'quitopia',
        'key': 'Quitopia',
        'title': 'Quitopía'
    },
    'Recuperación Urbana Av. 10 de Agosto.docx': {
        'folder': 'recuperacion_urbana_av_10_de_agosto',
        'key': 'Recuperación Urbana Av. 10 de Agosto',
        'title': 'Recuperación Urbana Av. 10 de Agosto'
    },
    'REHABILITACIÓN DEL ESPACIO PÚBLICO.docx': {
        'folder': 'rehabilitacion_espacio_publico',
        'key': 'Rehabilitación del Espacio Público',
        'title': 'Rehabilitación del Espacio Público'
    },
    'Repotenciación Parque Bicentenario.docx': {
        'folder': 'repotenciacion_parque_bicentenario',
        'key': 'Repotenciación Parque Bicentenario',
        'title': 'Repotenciación Parque Bicentenario'
    },
    'Senderos Seguros.docx': {
        'folder': 'senderos_seguros',
        'key': 'Senderos Seguros',
        'title': 'Senderos Seguros'
    }
}

os.makedirs(SCRATCH_DIR, exist_ok=True)

for doc_name, info in MAPPING.items():
    doc_path = os.path.join(DOC_DIR, doc_name)
    if not os.path.exists(doc_path):
        print(f"Skipping {doc_name} (not found)")
        continue

    print("=" * 60)
    print(f"PARSING: {doc_name}")
    print("=" * 60)

    # 1. Extraer imágenes del ZIP del .docx
    dest_img_dir = os.path.join(PUBLIC_DIR, info['folder'])
    os.makedirs(dest_img_dir, exist_ok=True)
    
    extracted_images = []
    with zipfile.ZipFile(doc_path) as z:
        media_files = [f for f in z.namelist() if 'word/media/' in f]
        for idx, media_file in enumerate(sorted(media_files), 1):
            ext = os.path.splitext(media_file)[1]
            new_name = f"extracted_{idx}{ext}"
            new_path = os.path.join(dest_img_dir, new_name)
            
            with z.open(media_file) as src_file, open(new_path, 'wb') as f_dest:
                shutil.copyfileobj(src_file, f_dest)
                
            web_path = f"/imagenes_categorias/{info['folder']}/{new_name}"
            extracted_images.append(web_path)
            print(f"  Extracted image: {media_file} -> {web_path}")

    # 2. Leer párrafos con estructura
    doc = docx.Document(doc_path)
    paragraphs = []
    
    for idx, p in enumerate(doc.paragraphs):
        text = p.text.strip()
        if not text:
            continue
            
        is_bold = all(run.bold for run in p.runs) if p.runs else False
        style = p.style.name
        
        paragraphs.append({
            'index': idx,
            'text': text,
            'style': style,
            'is_bold': is_bold,
            'runs': [{'text': r.text, 'bold': r.bold or False} for r in p.runs]
        })
        
    # Guardar en un JSON en scratch para análisis
    out_json = os.path.join(SCRATCH_DIR, f"{info['folder']}_parsed.json")
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump({
            'title': info['title'],
            'key': info['key'],
            'images': extracted_images,
            'paragraphs': paragraphs
        }, f, ensure_ascii=False, indent=2)
        
    print(f"Saved structure to {out_json} (paragraphs count: {len(paragraphs)})")
