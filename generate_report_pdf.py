from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import textwrap

report_text = '''Informe Técnico — Proyecto URU_Estadistico
Fecha: 1 de junio de 2026

1. Resumen ejecutivo
Propósito: Presentar el estado y los logros del proyecto de análisis y catalogación de imágenes de senderos.
Estado actual: Repositorio organizado con código, datos y scripts reproducibles; entorno virtual local (.venv) en uso; copia de respaldo disponible.

2. Objetivos alcanzados
- Extracción automatizada de imágenes desde PDFs.
- Catalogación centralizada de metadatos en formato JSON.
- Procesamiento y normalización de imágenes listo para análisis.
- Generación de matrices/outputs analíticos a partir de los datos procesados.
- Utilidades de verificación y mapeo disponibles para garantizar trazabilidad.

3. Impacto y beneficios
- Mejora de la trazabilidad de imágenes por zona gracias al catálogo centralizado.
- Proceso reproducible que facilita auditoría y validación de resultados.
- Estandarización del flujo de trabajo: ingestión → catalogación → procesamiento → análisis.
- Respaldo de datos ya disponible, lo que asegura conservación de la muestra original.

4. Estructura del repositorio (elementos clave)
- Código principal: app.py, senderos_imagenes.py, senderos_matriz.py.
- Scripts auxiliares: scripts/extract_imagenes.py, scripts/explore_pdf.py, scripts/map_pdf_pages.py, scripts/check_mappings.py.
- Datos organizados: data/imagenes_senderos/catalogo.json y subcarpetas por zona.
- Respaldo: backup_imagenes_senderos_20260526_155932/.

5. Arquitectura y flujo de trabajo (resumen)
- Ingesta: extracción de imágenes desde PDFs mediante scripts dedicados.
- Catalogación: centralización de metadatos en catalogo.json.
- Procesamiento: normalización y generación de matrices con senderos_imagenes.py y senderos_matriz.py.
- Verificación: utilidades que permiten confirmar correspondencia entre imágenes y entradas del catálogo.

6. Metodología técnica
- Lenguaje: Python.
- Dependencias gestionadas en requirements.txt.
- Reproducibilidad: uso de entorno virtual (.venv).
- Formato de datos: JSON para catálogos; estructura de carpetas por zona para imágenes.

7. Evidencias y artefactos disponibles
- Catálogo central: data/imagenes_senderos/catalogo.json.
- Copia de respaldo completa: backup_imagenes_senderos_20260526_155932/.
- Scripts de extracción, mapeo y verificación en scripts/.
- Procesos de normalización y generación de matrices implementados en senderos_imagenes.py y senderos_matriz.py.

8. Instrucciones de ejecución (resumen, Windows)
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py

Comandos útiles:
python scripts/extract_imagenes.py
python scripts/explore_pdf.py
python scripts/map_pdf_pages.py
python scripts/check_mappings.py

9. Dependencias
- Consultar requirements.txt para la lista completa. Se recomienda usar el entorno virtual provisto para garantizar consistencia.

10. Sugerencias (opciones futuras)
- Documentación ampliada (README.md) con ejemplos y capturas de salida.
- Pipeline CI para ejecutar verificaciones automáticas al integrar cambios.
- Escalado del procesamiento mediante paralelización si se incrementa el volumen de imágenes.

Anexos (archivos de referencia)
- app.py
- senderos_imagenes.py
- senderos_matriz.py
- requirements.txt
- data/imagenes_senderos/catalogo.json
- Carpeta scripts/
- backup_imagenes_senderos_20260526_155932/

Fin del informe.
'''

output_pdf = 'Informe_Uru_Estadistico.pdf'

c = canvas.Canvas(output_pdf, pagesize=A4)
width, height = A4
margin = 40

lines = []
for paragraph in report_text.split('\n\n'):
    wrapped = textwrap.wrap(paragraph, width=100)
    if not wrapped:
        lines.append('')
    else:
        for w in wrapped:
            lines.append(w)
    lines.append('')

x = margin
y = height - margin
textobject = c.beginText()
textobject.setTextOrigin(x, y)
textobject.setFont('Helvetica', 10)
textobject.setLeading(14)

for line in lines:
    if textobject.getY() < margin + 40:
        c.drawText(textobject)
        c.showPage()
        textobject = c.beginText()
        textobject.setTextOrigin(x, height - margin)
        textobject.setFont('Helvetica', 10)
        textobject.setLeading(14)
    textobject.textLine(line)

c.drawText(textobject)
c.save()
print(f'PDF generado: {output_pdf}')
