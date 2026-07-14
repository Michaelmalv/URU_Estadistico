import os
import zipfile
import xml.etree.ElementTree as ET
import glob
import json

DOC_DIR = 'documentos'
SCRATCH_DIR = 'scratch'

# Namespaces XML de Word
NAMESPACES = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture'
}

def parse_rels(zip_ref):
    """Parsea el archivo de relaciones para mapear rId -> ruta de imagen."""
    rels = {}
    try:
        rels_data = zip_ref.read('word/_rels/document.xml.rels')
        root = ET.fromstring(rels_data)
        for rel in root.findall('.//{http://schemas.openxmlformats.org/package/2006/relationships}Relationship'):
            r_id = rel.get('Id')
            target = rel.get('Target')
            # Las relaciones de imagen suelen apuntar a media/image1.png
            if 'media/' in target:
                # normalizar la ruta (ej: media/image1.png -> word/media/image1.png)
                rels[r_id] = os.path.join('word', target).replace('\\', '/')
    except Exception as e:
        print(f"Error parsing rels: {e}")
    return rels

def find_image_rids_in_element(element):
    """Busca recursivamente todos los rId de imágenes en un elemento XML."""
    rids = []
    # Buscar blip (que contiene el embed rId de la imagen)
    for blip in element.findall('.//w:drawing//a:blip', NAMESPACES):
        rid = blip.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
        if rid:
            rids.append(rid)
    # También en el formato antiguo de formas vml
    for imagedata in element.findall('.//w:pict//v:imagedata', {'w': NAMESPACES['w'], 'v': 'urn:schemas-microsoft-com:vml'}):
        rid = imagedata.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}href') or \
              imagedata.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
        if rid:
            rids.append(rid)
    return rids

def parse_docx_to_sequence(doc_path):
    """Mapea secuencialmente los párrafos y sus imágenes asociadas."""
    sequence = []
    
    with zipfile.ZipFile(doc_path) as z:
        rels = parse_rels(z)
        
        # Leer el documento XML principal
        doc_data = z.read('word/document.xml')
        root = ET.fromstring(doc_data)
        body = root.find('w:body', NAMESPACES)
        
        if body is None:
            return sequence
            
        # Recorremos el cuerpo elemento por elemento (párrafos y tablas)
        for child in body:
            if child.tag.endswith('p'):  # Párrafo
                p_text = "".join(child.itertext()).strip()
                
                # Buscar imágenes en este párrafo
                rids = find_image_rids_in_element(child)
                p_images = [rels[rid] for rid in rids if rid in rels]
                
                sequence.append({
                    'type': 'paragraph',
                    'text': p_text,
                    'images': p_images
                })
            elif child.tag.endswith('tbl'):  # Tabla (algunos Words meten imágenes en tablas)
                # Recorrer celdas de la tabla
                tbl_text = []
                tbl_images = []
                for cell in child.findall('.//w:tc', NAMESPACES):
                    cell_text = "".join(cell.itertext()).strip()
                    if cell_text:
                        tbl_text.append(cell_text)
                    rids = find_image_rids_in_element(cell)
                    tbl_images.extend([rels[rid] for rid in rids if rid in rels])
                    
                sequence.append({
                    'type': 'table',
                    'text': " | ".join(tbl_text),
                    'images': tbl_images
                })
                
    return sequence

files = glob.glob(os.path.join(DOC_DIR, '*.docx'))
for f in files:
    if os.path.basename(f).startswith('~$'):
        continue
    print(f"Parsing sequence of {os.path.basename(f)}...")
    seq = parse_docx_to_sequence(f)
    
    # Guardar la secuencia en scratch para poder verla
    base_name = os.path.splitext(os.path.basename(f))[0]
    out_path = os.path.join(SCRATCH_DIR, f"{base_name}_sequence.json")
    with open(out_path, 'w', encoding='utf-8') as out_f:
        json.dump(seq, out_f, indent=2, ensure_ascii=False)
        
    # Imprimir un resumen
    img_count = sum(len(item['images']) for item in seq)
    print(f"  Total items: {len(seq)}, Total images found: {img_count}")
