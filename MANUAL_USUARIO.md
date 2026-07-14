# MANUAL DE USUARIO

## PORTAL DE EVALUACIÓN DE PROYECTOS ESTRATÉGICOS

Este documento sirve como guía para el usuario final del **Portal de Evaluación de Proyectos Estratégicos**, una herramienta interactiva diseñada para el monitoreo, evaluación y visualización de intervenciones territoriales prioritarias en el Distrito Metropolitano de Quito.

---

## 1. Introducción al Portal

El portal permite visualizar y contrastar la planificación urbana con indicadores reales de impacto comercial, seguridad y valor de suelo en las áreas intervenidas por los proyectos del municipio. El sistema se compone de tres módulos principales:
1. **Fichas Informativas de Proyectos:** Detalles técnicos, cronogramas e imágenes secuenciales de las obras.
2. **Visor Cartográfico Interactivo:** Mapa dinámico con delimitación de polígonos, vías e infraestructura.
3. **Módulo de Indicadores Económicos y de Seguridad:** Matrices de licenciamiento comercial (LUAE) e índices de seguridad.

---

## 2. Estructura y Navegación Principal

Al ingresar al portal (`http://localhost:3000`), visualizará la pantalla principal que se divide en tres secciones clave:

### A. Barra de Navegación Superior
Permite conmutar rápidamente entre las diferentes dimensiones de análisis:
* **Proyectos:** Vista general de las fichas y el mapa interactivo.
* **Economía:** Gráficos e indicadores de impacto comercial (Licencias LUAE emitidas y renovadas).
* **Seguridad:** Índices de percepción de seguridad y reducción delictiva en áreas de senderos seguros.
* **Valor del Suelo:** Comportamiento y plusvalía catastral en los tramos intervenidos.

### B. Panel de Tarjetas de Proyectos (Dashboard)
Los proyectos se encuentran organizados de forma estratégica en dos filas principales:
* **Fila 1 (Ejes de Conectividad y Espacio Público):**
  1. *Senderos Seguros:* Corredores de circulación peatonal segura.
  2. *Zonas Metro:* Ordenamiento del flujo peatonal en estaciones.
  3. *Rehabilitación del Espacio Público:* Revitalización de calles patrimoniales del casco colonial.
  4. *Repotenciación Parque Bicentenario:* Megaproyecto verde en el antiguo aeropuerto.
* **Fila 2 (Equipamientos de Cuidado y Eventos):**
  5. *Quitopía:* Red de cuidados comunitarios y capacitación digital.
  6. *Recuperación Urbana Av. 10 de Agosto:* Regeneración habitacional y de movilidad.
  7. *Arena del Bicentenario:* Infraestructura modular para conciertos masivos.
  8. *Arena del Sur:* Nodo cultural y deportivo en Quitumbe.

---

## 3. Guía de Uso del Visor Cartográfico

El mapa interactivo se encuentra integrado en la pestaña principal de **Proyectos** y se controla mediante gestos y botones dedicados:

* **Desplazamiento:** Mantenga presionado el botón izquierdo del mouse y arrastre sobre el mapa.
* **Zoom:** Use la rueda de scroll del mouse para acercarse o alejarse del territorio.
* **Rotación/Inclinación:** Mantenga presionado el botón derecho del mouse y arrastre de arriba a abajo o en círculos para cambiar la perspectiva 3D del relieve (cámara del mapa).

### Selección de Capas y Polígonos
1. Haga clic sobre la tarjeta de cualquier proyecto (por ejemplo, *Rehabilitación del Espacio Público*).
2. El mapa se centrará y hará zoom automáticamente en la ubicación exacta del proyecto (ej. Calle Rocafuerte o Calle Benalcázar).
3. Verá delimitado en color azul/rojo el **polígono espacial de intervención**.
4. Al hacer clic sobre el polígono o vía en el mapa, emergerá una etiqueta flotante (tooltip) con el nombre técnico del tramo y sus coordenadas geográficas exactas.

---

## 4. Consulta de Fichas de Detalle

Al presionar el botón **"Ver detalles"** en la tarjeta de cualquier proyecto, se desplegará el panel lateral de información con la ficha técnica completa extraída de la planificación oficial:

* **Concepto del Proyecto:** Una caja destacada de color azul claro que resume el propósito urbano de la obra.
* **Ficha Técnica y Presupuesto:** Indicadores de inversión (en millones de USD), población beneficiaria y cronogramas de obra.
* **Imágenes Secuenciales:** Fotografías y planos conceptuales renderizados ordenados exactamente en la secuencia metodológica del proyecto (ej. imágenes de fases viales antes de los componentes ecológicos).
* **Tablas Informativas:** Desglose del presupuesto por sub-componentes u obras específicas.

---

## 5. Módulo de Indicadores Económicos (LUAE)

Para consultar el impacto en la economía barrial provocado por las intervenciones:

1. Diríjase a la pestaña **Economía** en la barra de navegación.
2. Seleccione el proyecto de interés (ej. *Calle Rocafuerte*).
3. Visualizará el gráfico de barras interactivo con:
   * **Emisiones (Emitidas):** Nuevas licencias de funcionamiento entregadas semestralmente.
   * **Renovaciones (Renovadas):** Licencias preexistentes que decidieron continuar con su actividad comercial.
4. **Descarga de Datos:** En la parte inferior del gráfico, encontrará el botón **"Descargar Reporte en Excel"**. Al presionarlo, el sistema descargará automáticamente la matriz de datos cruzada en formato `.xlsx` con el detalle de las patentes y predios para su análisis en Excel de escritorio.

---

## 6. Solución de Problemas Frecuentes

* **El mapa interactivo aparece en blanco:**
  * Esto suele ocurrir si la clave de API de Mapbox no se ha cargado correctamente en el entorno. Verifique la conexión a internet y asegúrese de que el archivo de configuración local `.env.local` incluya la variable `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` correspondiente.
* **Las imágenes detalladas no cargan dentro de la ficha:**
  * Las imágenes detalladas se sincronizan automáticamente con las subcarpetas del proyecto en `data/imagenes_categorias/`. Si renombró algún directorio o subió un nuevo archivo Word, corra el script de compilación automática en la terminal para sincronizar las rutas del visor.
