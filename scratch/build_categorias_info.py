import os
import json
import re

# Rutas de archivos
SCRATCH_DIR = 'scratch'
COMPONENTS_DIR = 'web/src/app/components'
PAGE_JS_PATH = 'web/src/app/page.js'
OUTPUT_JS_PATH = os.path.join(COMPONENTS_DIR, 'categorias_info.js')

# Mapeo de categorías
MAPPING = {
    'quitopia': 'Quitopia',
    'recuperacion_urbana_av_10_de_agosto': 'Recuperación Urbana Av. 10 de Agosto',
    'rehabilitacion_espacio_publico': 'Rehabilitación del Espacio Público',
    'repotenciacion_parque_bicentenario': 'Repotenciación Parque Bicentenario',
    'senderos_seguros': 'Senderos Seguros'
}

# Imágenes de portada originales
ORIGINAL_IMAGES = {
    'Quitopia': '/imagenes_categorias/quitopia/Quitopia.png',
    'Recuperación Urbana Av. 10 de Agosto': '/imagenes_categorias/recuperacion_urbana_av_10_de_agosto/recuperación_urbana_av10deAgosto.png',
    'Rehabilitación del Espacio Público': '/imagenes_categorias/rehabilitacion_espacio_publico/Rehabilitación del Centro Historico.jpg',
    'Repotenciación Parque Bicentenario': '/imagenes_categorias/repotenciacion_parque_bicentenario/Repotenciación del Bicentenario.png',
    'Senderos Seguros': '/imagenes_categorias/senderos_seguros/Senderos Seguros.png'
}

# Resúmenes de portada originales
ORIGINAL_SUMMARIES = {
    'Quitopia': 'Red de centros de desarrollo comunitario y cuidado integral para el bienestar social de las familias.',
    'Recuperación Urbana Av. 10 de Agosto': 'Estrategia de revitalización del eje vial longitudinal de la 10 de Agosto para mejorar movilidad y vivienda.',
    'Rehabilitación del Espacio Público': 'Revitalización de calles patrimoniales para conectar peatonalmente y reactivar el comercio nocturno.',
    'Repotenciación Parque Bicentenario': 'Consolidación del espacio verde del antiguo aeropuerto mediante arborización nativa y nuevas áreas recreativas.',
    'Senderos Seguros': 'Corredores peatonales diseñados estratégicamente para mitigar índices delictivos y mejorar la seguridad de transeúntes.'
}

def clean_latex(text):
    # Remover marcadores de cita/referencia de Word
    text = re.sub(r'\[cite:\s*[^\]]+\]', '', text)
    # Reemplazar notación matemática de LaTeX a texto limpio
    # $15.000\text{ m}^2$ -> 15.000 m²
    text = re.sub(r'\$(\d+(?:[.,]\d+)?)\\text\{\s*[mM]\s*\}\^2\$', r'\1 m²', text)
    text = re.sub(r'\$(\d+(?:[.,]\d+)?)\\text\{\s*[hH]ect\w*\s*\}\$', r'\1 Hectáreas', text)
    text = re.sub(r'\\text\{\s*[mM]\s*\}\^2', 'm²', text)
    # \text{ ... } -> ...
    text = re.sub(r'\\text\{\s*([^}]+)\s*\}', r'\1', text)
    # USD $1,5\text{ millones}$ -> USD 1.5 millones
    text = re.sub(r'USD\s*\$(\d+(?:[.,]\d+)?)\s*millones', r'USD \1 millones', text)
    # Remover signos de dólar restantes alrededor de números
    text = re.sub(r'\$([^$]+)\$', r'\1', text)
    # Remover barras invertidas sobrantes
    text = text.replace('\\', '')
    return text

def clean_html_latex(html):
    # Busca bloques de $ ... $ en el HTML final y limpia su LaTeX interno,
    # eliminando etiquetas HTML intermedias que puedan haber roto la expresión.
    def replace_math(match):
        math_content = match.group(1)
        # Eliminar cualquier etiqueta HTML interna (como <strong>)
        math_content_clean = re.sub(r'<[^>]+>', '', math_content)
        cleaned = clean_latex(f"${math_content_clean}$")
        return cleaned
    
    return re.sub(r'\$([^$]+)\$', replace_math, html)

def escape_jsx_braces(text):
    # Reemplazar llaves con entidades HTML para evitar errores de compilación de JSX
    return text.replace('{', '&#123;').replace('}', '&#125;')

def parse_runs_to_html(runs):
    # Une los runs de un párrafo aplicando <strong> donde run.bold es True
    html_parts = []
    for r in runs:
        txt = r['text']
        if r.get('bold'):
            lstrip = len(txt) - len(txt.lstrip())
            rstrip = len(txt) - len(txt.rstrip())
            sp_left = txt[:lstrip]
            sp_right = txt[len(txt)-rstrip:] if rstrip > 0 else ""
            core = txt.strip()
            if core:
                html_parts.append(f"{sp_left}<strong>{core}</strong>{sp_right}")
            else:
                html_parts.append(txt)
        else:
            html_parts.append(txt)
            
    html = "".join(html_parts)
    html = clean_html_latex(html)
    html = escape_jsx_braces(html)
    return html

def build_jsx_for_category(folder_name, key):
    json_path = os.path.join(SCRATCH_DIR, f"{folder_name}_parsed.json")
    if not os.path.exists(json_path):
        print(f"Parsed JSON not found for {folder_name}")
        return None
        
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    paragraphs = data['paragraphs']
    images = data['images']
    
    jsx_blocks = []
    
    # Ignorar primer párrafo (Título) ya que lo representamos en el h1
    # Y buscar si hay un subtítulo en el segundo párrafo
    start_idx = 1
    if paragraphs[1]['is_bold'] and paragraphs[1]['text'] != 'Concepto del Proyecto':
        subtitle = escape_jsx_braces(clean_latex(paragraphs[1]['text']))
        jsx_blocks.append(f'        <p style={{{{ color: "var(--text-muted)", fontSize: "1rem", fontWeight: "600", marginBottom: "1.5rem" }}}}>{subtitle}</p>')
        start_idx = 2
        
    # Variables de control
    in_list = False
    list_type = "ul" # ul o ol
    
    # Procesar párrafos
    i = start_idx
    while i < len(paragraphs):
        p = paragraphs[i]
        text = p['text']
        is_bold = p['is_bold']
        runs = p['runs']
        
        # Detectar cabeceras
        # Si es un número (ej. "1. Bulevar...") o es Concepto del Proyecto
        is_heading = is_bold or text.startswith(('1. ', '2. ', '3. ', '4. ', '5. ')) or text == 'Concepto del Proyecto' or text.startswith('Ficha Técnica')
        
        # Limpiar LaTeX
        clean_p_text = escape_jsx_braces(clean_latex(text))
        
        if is_heading:
            # Si estábamos en una lista, la cerramos
            if in_list:
                jsx_blocks.append(f'        </{list_type}>')
                in_list = False
                
            # Determinar tipo de cabecera
            if text == 'Concepto del Proyecto':
                # El siguiente párrafo suele ser el concepto, lo ponemos en una alerta info
                next_p = paragraphs[i+1] if i+1 < len(paragraphs) else None
                formatted_next = parse_runs_to_html(next_p['runs']) if next_p else ""
                
                jsx_blocks.append('        <div className="info-alert">')
                jsx_blocks.append(f'          {formatted_next}')
                jsx_blocks.append('        </div>')
                
                # Insertar la primera imagen después del concepto si existe
                if len(images) > 0:
                    jsx_blocks.append(f'        <div className="detail-image-container">')
                    jsx_blocks.append(f'          <img src="{images[0]}" alt="Concepto" />')
                    jsx_blocks.append('        </div>')
                
                i += 2 # Saltar concepto
                continue
            else:
                # Cabecera estándar
                jsx_blocks.append(f'        <h3>{clean_p_text}</h3>')
                
                # Reglas especiales para insertar imágenes tras cabeceras específicas
                if folder_name == 'rehabilitacion_espacio_publico':
                    if 'Shyris' in text and len(images) > 0:
                        jsx_blocks.append(f'        <div className="detail-image-container">')
                        jsx_blocks.append(f'          <img src="{images[0]}" alt="Tribuna de los Shyris" />')
                        jsx_blocks.append('        </div>')
                    elif 'Benalcázar' in text and len(images) > 1:
                        jsx_blocks.append(f'        <div className="detail-image-container">')
                        jsx_blocks.append(f'          <img src="{images[1]}" alt="Calle Benalcázar" />')
                        jsx_blocks.append('        </div>')
                elif folder_name == 'repotenciacion_parque_bicentenario':
                    if 'Deportiva' in text and len(images) > 1:
                        jsx_blocks.append(f'        <div className="detail-image-container">')
                        jsx_blocks.append(f'          <img src="{images[1]}" alt="Zona Deportiva" />')
                        jsx_blocks.append('        </div>')
                    elif 'Conservación' in text and len(images) > 2:
                        jsx_blocks.append(f'        <div className="detail-image-container">')
                        jsx_blocks.append(f'          <img src="{images[2]}" alt="Zona de Conservación" />')
                        jsx_blocks.append('        </div>')
                elif folder_name == 'quitopia':
                    if 'Ficha Técnica' in text and len(images) > 1:
                        jsx_blocks.append(f'        <div className="detail-image-container">')
                        jsx_blocks.append(f'          <img src="{images[1]}" alt="Ficha Técnica" />')
                        jsx_blocks.append('        </div>')
                    elif 'Cuidado y Cohesión' in text and len(images) > 2:
                        jsx_blocks.append(f'        <div className="detail-image-container">')
                        jsx_blocks.append(f'          <img src="{images[2]}" alt="Cuidado Familiar" />')
                        jsx_blocks.append('        </div>')
                    elif 'Educación' in text and len(images) > 3:
                        jsx_blocks.append(f'        <div className="detail-image-container">')
                        jsx_blocks.append(f'          <img src="{images[3]}" alt="Educación" />')
                        jsx_blocks.append('        </div>')
                    elif 'Recreación' in text and len(images) > 4:
                        jsx_blocks.append(f'        <div className="detail-image-container">')
                        jsx_blocks.append(f'          <img src="{images[4]}" alt="Recreación y Complejo Acuático" />')
                        jsx_blocks.append('        </div>')
                elif folder_name == 'senderos_seguros':
                    if 'Priorización' in text and len(images) > 1:
                        jsx_blocks.append(f'        <div className="detail-image-container">')
                        jsx_blocks.append(f'          <img src="{images[1]}" alt="Priorización" />')
                        jsx_blocks.append('        </div>')
            i += 1
            continue
            
        # Detectar si el párrafo es un ítem de lista (tiene un run en negrita al principio seguido de dos puntos ':')
        has_list_pattern = False
        first_run_bold = runs[0].get('bold') if runs else False
        first_run_text = runs[0]['text'].strip() if runs else ""
        
        if first_run_bold and (first_run_text.endswith(':') or (len(runs) > 1 and runs[1]['text'].strip().startswith(':'))):
            has_list_pattern = True
            
        if has_list_pattern:
            if not in_list:
                list_type = "ul"
                jsx_blocks.append(f'        <{list_type}>')
                in_list = True
            
            # Formatear el ítem
            item_html = parse_runs_to_html(runs)
            # Asegurar que el formato sea <li><strong>Prefijo:</strong> Resto</li>
            # Si el run en negrita ya tiene el texto completo antes del :, está bien
            jsx_blocks.append(f'          <li>{item_html}</li>')
        else:
            # Párrafo normal
            if in_list:
                jsx_blocks.append(f'        </{list_type}>')
                in_list = False
            
            p_html = parse_runs_to_html(runs)
            jsx_blocks.append(f'        <p>{p_html}</p>')
            
        i += 1
        
    if in_list:
        jsx_blocks.append(f'        </{list_type}>')
        
    # Si es Quitopía y hay imágenes sobrantes (por ejemplo, la 6ta), ponerla al final
    if folder_name == 'quitopia' and len(images) > 5:
        jsx_blocks.append(f'        <div className="detail-image-container">')
        jsx_blocks.append(f'          <img src="{images[5]}" alt="Quitopía Fin" />')
        jsx_blocks.append('        </div>')

    inner_content = "\n".join(jsx_blocks)
    
    image_path = ORIGINAL_IMAGES.get(key, f"/imagenes_categorias/{folder_name}/{folder_name}.png")
    if key in ORIGINAL_SUMMARIES:
        summary_text = ORIGINAL_SUMMARIES[key]
    else:
        summary_text = clean_latex(paragraphs[2]['text'][:120]) + "..."
    summary_text = summary_text.replace("'", "\\'")
    
    return f"""  '{key}': {{
    image: '{image_path}',
    summary: '{summary_text}',
    content: (
      <div className="article-content">
        <h1>{data['title']}</h1>
{inner_content}
      </div>
    )
  }}"""

# ==========================================
# DEFINICIONES HARDCODED (Zonas Metro, etc.)
# ==========================================

ZONAS_METRO_CODE = """  'Zonas Metro': {
    image: '/imagenes_categorias/zonas_metro/Zonas metro.jpg',
    summary: 'Modelo de ordenamiento físico-espacial en los exteriores de las estaciones para ordenar el flujo peatonal masivo.',
    content: (
      <div className="article-content">
        <h1>Zonas Metro</h1>
        <div className="info-alert">
          Para ordenar la alta concentración peatonal y el flujo masivo en los exteriores de las estaciones del Metro de Quito, se diseñó un <strong>modelo de ordenamiento físico-espacial</strong> que divide los accesos en tres zonas concéntricas:
        </div>
        <ul>
          <li><strong>Zona A - Aglomeración:</strong> Es el área colindante inmediata a la boca de ingreso del Metro. Está destinada de forma <strong>exclusiva</strong> a garantizar la entrada y salida fluida y segura de los pasajeros, por lo que debe mantenerse completamente libre de obstáculos.</li>
          <li><strong>Zona B - Concentración:</strong> Funciona como una franja o área de amortiguamiento urbano. In este espacio se permite la instalación regulada de <strong>mobiliario confortable</strong> (bancas, basureros, iluminación) diseñado para la permanencia o espera de los usuarios.</li>
          <li><strong>Zona C - Dispersión:</strong> Es el área abierta perimetral. Está perfilada como el lugar idóneo para la colocación de <strong>señalética de orientación</strong>, paradas de transporte complementario y casetas de <strong>comerciantes autónomos regularizados</strong> bajo el debido proceso de autorización.</li>
        </ul>

        <h3>Tótems de Identidad Metropolitana</h3>
        <p>Cada estación cuenta con un <strong>hito vertical unificado</strong> que le otorga identidad al entorno urbano. Este elemento técnico cuenta con las siguientes especificaciones y componentes:</p>
        <blockquote>
          <strong>Dimensiones estructurales:</strong> 4.04 metros de altura × 0.70 metros de ancho.
        </blockquote>
        <ul>
          <li><strong>Identificación:</strong> Incorpora el logo iconográfico de la estación y su nombre visible a larga distancia.</li>
          <li><strong>Orientación:</strong> Integra mapas detallados del sector y de la red completa del sistema de transporte.</li>
          <li><strong>Accesibilidad universal:</strong> Incluye un <strong>Mapa Háptico</strong> con texturas y relieves en braille especialmente diseñado para personas con discapacidad visual.</li>
          <li><strong>Información y servicios:</strong> Cuenta con espacios inferiores destinados a paneles informativos de la ciudad o publicidad regulada.</li>
        </ul>
      </div>
    )
  }"""

ARENA_BICENTENARIO_CODE = """  'Arena del Bicentenario': {
    image: '/imagenes_categorias/bicentenario/bicentenario.png',
    summary: 'Megaproyecto de renovación urbana de 105 hectáreas que integra humedales, ciclovías, deportes y una arena para conciertos.',
    content: (
      <div className="article-content">
        <h1>Arena del Bicentenario</h1>
        <div className="info-alert">
          La repotenciación de las 105 hectáreas del antiguo aeropuerto representa el proyecto de renovación y revitalización urbana más ambicioso del Distrito Metropolitano. Proyectado bajo las normativas del Plan de Uso y Gestión del Suelo (PUGS), este espacio técnico tiene el potencial de albergar vivienda y servicios para una población de hasta 304.000 habitantes, frenando la expansión descontrolada de las periferias.
        </div>

        <h3>Sostenibilidad e Infraestructura Verde-Azul</h3>
        <p>Con el fin de mitigar los efectos del cambio climático en la zona centro-norte, el parque implementa soluciones ambientales estratégicas:</p>
        <ul>
          <li><strong>Suelo permeable:</strong> Incremento del 5% de su superficie de absorción.</li>
          <li><strong>Red Verde-Azul:</strong> Consolidación de 8 hectáreas que contemplan la creación de <strong>6 cuerpos de agua y humedales</strong> diseñados para la captación técnica de aguas lluvias, la regulación del microclima y el fomento de la biodiversidad urbana.</li>
        </ul>

        <h3>Deporte, Comercio y Recreación Replicable</h3>
        <p>El megaproyecto organiza su espacio público a través de módulos replicables de equipamiento de alta calidad:</p>
        <ul>
          <li><strong>67 Canchas Deportivas:</strong> 21 de fútbol, 19 de voleibol, 11 de básquet, 7 de tenis, 5 múltiples, 3 de balonmano y 1 de béisbol.</li>
          <li><strong>Movilidad Activa:</strong> Construcción de <strong>12 km de caminerías internas</strong> iluminadas (divididas en 5 tipologías de diseño de estancia) y una red de <strong>14.4 km de ciclovías</strong> con carril segregado.</li>
          <li><strong>14 Plazas Comerciales:</strong> Equipadas con <strong>360 kioscos modulares</strong> de madera (1.80 × 1.80 m) integrados a zonas de vegetación y descanso para promover y ordenar el comercio local.</li>
          <li><strong>Zonas Temáticas:</strong> Incorporación de 12 áreas de juegos infantiles (con zonas especiales para la primera infancia), 38 zonas de picnic/descanso y 5 parques caninos (<em>dogparks</em>).</li>
        </ul>

        <h3>Grandes Hitos de Entretenimiento Masivo</h3>
        <ul>
          <li><strong>Arena de Espectáculos Quito:</strong> Megaestructura equipada con un escenario principal con capacidad para <strong>50.000 espectadores</strong>, diseñado para insertar a la capital en el circuito internacional de grandes conciertos, festivales y ferias masivas.</li>
          <li><strong>Anfiteatro Polifuncional:</strong> Espacio cultural al aire libre totalmente integrado al paisaje del parque, el cual utiliza relieves técnicos y graderíos naturales de césped para albergar eventos artísticos y comunitarios.</li>
        </ul>
      </div>
    )
  }"""

ARENA_DEL_SUR_CODE = """  'Arena del Sur': {
    image: '/imagenes_categorias/arena_del_sur/Arena del Sur.png',
    summary: 'Infraestructura cultural multifuncional en Quitumbe con centro cultural y plaza de espectáculos al aire libre.',
    content: (
      <div className="article-content">
        <h1>Quitumbe: Arena Cultural del Sur</h1>
        <div className="info-alert">
          Es un equipamiento cultural metropolitano de infraestructura inclusiva y multifuncional impulsado por la Alcaldía Metropolitana de Quito. Está diseñado para fortalecer la integración social, el acceso equitativo a la cultura y la dinamización comunitaria en el sur de la ciudad.
        </div>

        <h3>Cifras Clave del Proyecto</h3>
        <ul>
          <li><strong>Área de intervención:</strong> 33.944,72 m²</li>
          <li><strong>Inversión estimada:</strong> USD 6,2 millones</li>
          <li><strong>Ubicación:</strong> Centralidad Urbana Quitumbe</li>
        </ul>

        <h3>Componentes Principales (Plan de Intervención)</h3>
        <p>El proyecto articula sus actividades e infraestructura en dos grandes bloques de equipamiento:</p>
        <ol style={{ paddingLeft: '1.5rem', margin: '1rem 0' }}>
          <li style={{ marginBottom: '0.5rem' }}><strong>Centro Cultural Quitumbe:</strong> Un nodo de encuentro enfocado en la educación y las artes que incluye biblioteca, talleres artísticos, salas de danza, expresión corporal, auditorios y áreas educativas.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Plaza de Espectáculos Quitumbe:</strong> Una infraestructura al aire libre dotada de una gran cubierta de diseño contemporáneo, optimizada para albergar eventos recreativos y conciertos masivos.</li>
        </ol>

        <h3>Propósito e Impacto</h3>
        <ul>
          <li><strong>Encuentro ciudadano:</strong> Funciona como un espacio para activar actividades artísticas, educativas y recreativas.</li>
          <li><strong>Fomento de la cohesión:</strong> Busca promover la apropiación pacífica del espacio público, la cohesión social y el bienestar de la población del sur de Quito.</li>
        </ul>
      </div>
    )
  }"""

# ==========================================
# PROCESAR Y GENERAR
# ==========================================

print("Generating categories Javascript blocks...")
generated_blocks = []

# Procesar dinámicos
for folder, key in MAPPING.items():
    block = build_jsx_for_category(folder, key)
    if block:
        generated_blocks.append(block)

# Agregar hardcoded
generated_blocks.append(ZONAS_METRO_CODE)
generated_blocks.append(ARENA_BICENTENARIO_CODE)
generated_blocks.append(ARENA_DEL_SUR_CODE)

# Unir todo
blocks_joined = ",\n\n".join(generated_blocks)
file_content = f"""'use strict';
import React from 'react';

export const CATEGORIAS_INFO = {{
{blocks_joined}
}};
"""

# Guardar en archivo de destino
os.makedirs(os.path.dirname(OUTPUT_JS_PATH), exist_ok=True)
with open(OUTPUT_JS_PATH, 'w', encoding='utf-8') as f:
    f.write(file_content)
    
print(f"Successfully generated {OUTPUT_JS_PATH}")

# ==========================================
# ACTUALIZAR src/app/page.js
# ==========================================
print("Updating page.js...")

with open(PAGE_JS_PATH, 'r', encoding='utf-8') as f:
    page_content = f.read()

# Buscamos la definición original de CATEGORIAS_INFO
# Comienza con "const CATEGORIAS_INFO = {" y termina antes de "export default function Home()"
# Usaremos regex para buscar desde "const CATEGORIAS_INFO = {" hasta el final de la definición
pattern = r'const CATEGORIAS_INFO = \{.*?\n\};'
match = re.search(r'const CATEGORIAS_INFO = \{.*?\n\};', page_content, re.DOTALL)

if match:
    # Reemplazamos la definición por el import
    new_page_content = page_content.replace(match.group(0), "")
    
    # Insertar el import al principio (después de 'use client')
    # Buscamos 'use client'; y agregamos el import abajo
    import_statement = "import { CATEGORIAS_INFO } from './components/categorias_info';"
    
    if "import { CATEGORIAS_INFO }" not in new_page_content:
        # Insertar después de la línea de react import
        new_page_content = re.sub(
            r"(import\s+\{\s*useState\s*\}\s*from\s*'react';)",
            r"\1\nimport { CATEGORIAS_INFO } from './components/categorias_info';",
            new_page_content
        )
        
    with open(PAGE_JS_PATH, 'w', encoding='utf-8') as f:
        f.write(new_page_content)
    print("page.js updated successfully.")
else:
    print("Warning: could not locate CATEGORIAS_INFO in page.js")
