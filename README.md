# Portal de Evaluación y Seguimiento de Proyectos Estratégicos (DMQ)

Sistema integral de análisis territorial, monitoreo cartográfico y evaluación multidimensional de los Proyectos Estratégicos del **Distrito Metropolitano de Quito** (PMDOT / PUGS).

---

## 🌐 Plataforma en Producción (Acceso en Vivo)
El portal se encuentra desplegado y accesible públicamente en la nube:
👉 **[https://portal-seguimiento-proyectos-estrategicos.vercel.app](https://portal-seguimiento-proyectos-estrategicos.vercel.app)**

---

## 🏛️ Módulos del Sistema
1. **Centralidades Urbanas:** Modelo territorial de 22 centralidades urbanas (Metropolitana, Zonal, Sectorial) con análisis en 4 dimensiones: Información General, Seguridad Ciudadana, Dinámica Económica (LUAEs) y Valor del Suelo.
2. **Soterramiento de Redes:** Monitoreo y cartografía interactiva de los 77 polígonos de soterramiento ejecutados y planificados en el DMQ.
3. **Corredores Vivos y Senderos Seguros:** Evaluación de conectores ecológicos y peatonales (Av. Colón, Av. Patria, Av. De La Prensa, Bulevar Amazonas, Bulevar Shyris, entre otros).
4. **Zonas Metro (Línea 1):** Delimitación y seguimiento de las áreas de influencia peatonal directa alrededor de las 15 estaciones del Metro de Quito.
5. **Rehabilitación del Espacio Público:** Fichas técnicas, inventario fotográfico de transformación urbana y avance físico de proyectos.

---

## 📁 Estructura del Repositorio
```text
URU_Estadistico/
├── web/                                  # Aplicación web interactiva (Next.js 16, Mapbox GL, CSS)
│   ├── src/app/                          # Páginas y componentes del portal
│   │   ├── components/                   # Visor de centralidades, mapas y modales
│   │   ├── soterramiento/                # Módulo interactivo de soterramientos
│   │   ├── informacion/                  # Visor de proyectos planificados y fichas técnicas
│   │   └── globals.css                   # Sistema de diseño institucional
│   ├── src/lib/                          # Geometrías consolidadas (GeoJSON) y bases de datos JSON
│   └── package.json                      # Dependencias del frontend
├── data/                                 # Insumos originales de datos (Excel, shapefiles, cartografía)
│   └── Coordenadas Soterramiento Actualizado/ # Shapefile oficial SIRES-DMQ
├── documentos/                           # Fichas técnicas y documentos fuente (.docx)
├── MANUAL_TECNICO.md                     # Manual técnico detallado de arquitectura y mantenimiento
└── README.md                             # Documentación ejecutiva del proyecto
```

---

## 🚀 Ejecución en Entorno Local (Desarrollo)

### Requisitos
* **Node.js** v18.0 o superior
* **npm** v9.0 o superior

### Pasos de instalación y ejecución:
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/Michaelmalv/URU_Estadistico.git
   cd URU_Estadistico/web
   ```

2. Instalar dependencias del frontend:
   ```bash
   npm install
   ```

3. Iniciar el servidor local de desarrollo:
   ```bash
   npm run dev
   ```

4. Abrir en el navegador:
   ```text
   http://localhost:3000
   ```

---

## 📄 Documentación Técnica
Para una guía detallada sobre la estructura de datos, bases de datos y algoritmos de proyección cartográfica, consulte el documento [MANUAL_TECNICO.md](MANUAL_TECNICO.md).
