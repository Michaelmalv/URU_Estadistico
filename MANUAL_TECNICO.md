# MANUAL TÉCNICO

## PORTAL DE EVALUACIÓN DE PROYECTOS ESTRATÉGICOS

Este documento contiene la especificación de arquitectura, estructura de código, dependencias y procesos de compilación y procesamiento de datos del **Portal de Evaluación de Proyectos Estratégicos**.

---

## 1. Arquitectura del Sistema

El portal está construido como una aplicación web moderna orientada a la eficiencia y el alto rendimiento visual:
1. **Framework Principal:** Next.js 16 (App Router) con soporte de renderizado estático y dinámico.
2. **Motor Cartográfico:** Mapbox GL JS (para visualización 3D y renderizado de capas vectoriales).
3. **Estilos:** Vanilla CSS (organizado en `globals.css`) para control absoluto del diseño e identidad institucional (azul y dorado municipal).
4. **Base de Datos (Opcional):** Supabase (servidor PostgreSQL) para almacenamiento remoto de registros económicos de LUAEs, con fallback local mediante endpoints en la API de Next.js.
5. **Pipelines de Datos (Backend offline):** Scripts en Python (utilizando `pandas`, `openpyxl` y `python-docx`) para el análisis cuantitativo e ingesta de datos.

---

## 2. Estructura de Directorios

El código fuente del proyecto se organiza de la siguiente manera:

```text
URU_Estadistico/
├── data/                                 # Bases de datos y recursos geográficos
│   ├── PREDIOS.xlsx                      # Mapeo de códigos catastrales a proyectos
│   ├── BDD LUAE 2022- ... .xlsx          # Base de datos de patentes 2022
│   ├── BDD- Proyectos estrategicos ...   # Base de datos de patentes 2023-2026
│   └── imagenes_categorias/              # Directorio de imágenes sincronizadas
├── documentos/                           # Archivos Word (.docx) originales de planificación
├── scratch/                              # Scripts de desarrollo y automatización
│   ├── build_categorias_info_from_sequence.py  # Compilador de fichas dinámicas Word -> JSX
│   ├── generate_excel_report_formatted.py     # Procesador de LUAEs y proyecciones
│   └── parse_docx_sequence.py                  # Extractor de secuencias XML de Word
├── web/                                  # Proyecto Next.js (Frontend)
│   ├── src/app/
│   │   ├── components/
│   │   │   ├── MapboxMap.js              # Componente de interacción con el mapa Mapbox
│   │   │   ├── Navbar.js                 # Barra de navegación superior
│   │   │   └── categorias_info.js        # Estructura JSX de fichas autogeneradas
│   │   ├── economia/                     # Página de métricas comerciales
│   │   ├── valor-suelo/                  # Página de plusvalía y catastro
│   │   ├── page.js                       # Dashboard principal y control del visor
│   │   └── globals.css                   # Hoja de estilos global y animaciones UI
│   ├── package.json                      # Dependencias de npm
│   └── .env.local                        # Variables de entorno locales
```

---

## 3. Instalación y Configuración del Entorno

### Requisitos Previos
* Node.js v18.0 o superior
* Python 3.10 o superior (con gestor de paquetes `pip`)

### Configuración del Frontend (Next.js)
1. Navegue al directorio `web/` en la terminal:
   ```bash
   cd web
   ```
2. Instale las dependencias de Node.js:
   ```bash
   npm install
   ```
3. Cree un archivo de configuración `.env.local` en la raíz de `web/` e inserte su token de acceso público de Mapbox:
   ```text
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=tu_token_de_mapbox_aqui
   ```
4. Ejecute el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:3000`.

---

## 4. Pipeline de Automatización de Fichas (Word -> JSX)

Para evitar la maquetación manual de textos e imágenes de los documentos originales, se implementó el compilador automático `build_categorias_info_from_sequence.py` en `scratch/`:

### Lógica del Compilador:
1. Lee las relaciones internas del archivo zip de Word (`word/_rels/document.xml.rels`) para mapear identificadores `rId` con los nombres de imágenes originales (ej. `image1.png`).
2. Recorre en secuencia lineal el árbol XML del cuerpo del documento (`word/document.xml`), detectando párrafos vacíos con imágenes asociadas y párrafos con texto.
3. Limpia los caracteres especiales y notaciones matemáticas de LaTeX (ej. `$19.544,98\text{ m}^2$` se traduce automáticamente a `19.544,98 m²`).
4. Genera dinámicamente marcas HTML semánticas y exporta el archivo `web/src/app/components/categorias_info.js` en el orden de maquetación solicitado por la alcaldía.

Para ejecutar este compilador y refrescar las fichas de proyectos:
```bash
python scratch/build_categorias_info_from_sequence.py
```

---

## 5. Pipeline de Procesamiento de Datos Comerciales (LUAE)

Para las consultas analíticas del proyecto de la **Calle Rocafuerte** y la generación de proyecciones, el script `generate_excel_report_formatted.py` en `scratch/` implementa las siguientes reglas técnicas:

### Reglas de Depuración y Deduplicación:
* Se extraen los códigos catastrales (predios) relacionados con el proyecto de la columna correspondiente de `PREDIOS.xlsx`.
* Se filtran las bases de datos de LUAE (2022 y 2023+) comparando el predio.
* **Deduplicación:** Si se repiten el *Número de Licencia*, *Predio* y *Tipo de Movimiento*, se lee el *Código/Descripción CIIU*. Si estos son idénticos, se colapsa la fila para evitar inflación artificial de actividades.
* **Proyección Semestral 2026 (Mayo-Diciembre):** Se aplican tres modelos basados en comportamiento estacional histórico (proporción promedio del periodo Ene-Abr de 28.6% del año) y tendencias recientes estables (2023-2025).

Para regenerar la hoja de cálculo de economía de la Calle Rocafuerte:
```bash
python scratch/generate_excel_report_formatted.py
```

---

## 6. Proceso de Compilación para Producción (Deploy)

Para compilar la aplicación optimizada para producción:
1. Entre al directorio `web/`:
   ```bash
   cd web
   ```
2. Ejecute la compilación de Next.js:
   ```bash
   npm run build
   ```
   Esto generará el paquete estático optimizado en la carpeta `.next/`.
3. Inicie el servidor de producción:
   ```bash
   npm run start
   ```
