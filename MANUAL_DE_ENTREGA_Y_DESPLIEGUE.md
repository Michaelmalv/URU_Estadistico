# Manual de Transferencia Tecnológica, Cuentas Propias y Despliegue
## Portal de Seguimiento y Evaluación de Proyectos Estratégicos (DMQ)

**Entidad:** Municipio del Distrito Metropolitano de Quito • Secretaría de Territorio, Hábitat y Vivienda (STHV)  
**Repositorio Principal:** [https://github.com/Michaelmalv/URU_Estadistico](https://github.com/Michaelmalv/URU_Estadistico)  
**Tecnologías:** Next.js 16 (React 19) • Mapbox GL JS • Supabase (PostgreSQL) • Vercel Cloud  

---

## 1. Objetivo y Alcance de la Transferencia

El propósito de este manual es garantizar que el equipo receptor cuente con **autonomía técnica absoluta** sobre la plataforma. El objetivo es que la entidad administre sus propios servicios en la nube, programe libremente nuevas funcionalidades y mantenga su propia base de datos institucional sin depender de credenciales ni servidores externos.

### Los 4 Pilares Institucionales:
1. **GitHub Propio:** Para almacenar el código fuente, recibir aportes del equipo técnico y programar cambios.
2. **Base de Datos Supabase Propia:** Servidor PostgreSQL en la nube para alojar y consultar las métricas e indicadores.
3. **Cuenta y Token de Mapbox Propio (Obligatorio):** Proveedor cartográfico para renderizar los mapas 3D y capas vectoriales de la ciudad.
4. **Servidor de Despliegue Vercel Propio:** Infraestructura web autogestionada con publicación instantánea ante cada cambio de código.

---

## 2. Repositorio Oficial y Entorno de Programación Local

El código completo del proyecto se entrega a través del repositorio único maestro:  
👉 **`https://github.com/Michaelmalv/URU_Estadistico.git`**

### Paso 2.1: Migrar a la Cuenta Institucional de GitHub
Para transferir el código a la cuenta o servidor de GitHub propio de la entidad, ejecute en su terminal:
```bash
# 1. Clonar el repositorio localmente
git clone https://github.com/Michaelmalv/URU_Estadistico.git
cd URU_Estadistico

# 2. Vincular el repositorio a su nueva cuenta institucional de GitHub
git remote set-url origin https://github.com/SuOrganizacion/URU_Estadistico.git

# 3. Subir todas las ramas al nuevo servidor institucional
git push -u origin main
git push origin master
```

### Paso 2.2: Programación y Modificaciones en Local (Entorno de Desarrollo)
Cualquier programador del equipo puede modificar el diseño, agregar pestañas, editar métricas o integrar nuevas centralidades ejecutando el servidor local de desarrollo:
```bash
# Navegar al directorio de la aplicación web
cd web

# Instalar las dependencias de Node.js
npm install

# Iniciar el servidor local de desarrollo con recarga en vivo
npm run dev
```
La aplicación estará disponible inmediatamente en su navegador en: **`http://localhost:3000`**. Todos los cambios realizados en archivos `.js` o `.css` se actualizan de manera instantánea en pantalla (Fast Refresh).

---

## 3. Configuración de la Base de Datos Propia en Supabase

Para que los datos estén alojados en los servidores de la institución, se ha incluido un script SQL de migración integral que crea el esquema relacional e inserta todos los datos históricos en 1 clic.

### Paso 3.1: Crear Proyecto en Supabase
1. Acceda a [https://supabase.com](https://supabase.com) con su correo institucional.
2. Haga clic en **"New Project"**.
3. Defina el nombre del proyecto (ejemplo: `proyectos-estrategicos-dmq`), establezca una contraseña segura para la base de datos y seleccione la región geográfica más cercana (*South America / São Paulo* o *US East*).

### Paso 3.2: Ejecutar Script de Migración Automática
En la raíz del repositorio se encuentra el archivo:
📁 **`scripts/supabase_migration_complete.sql`**

1. En el panel lateral izquierdo de su proyecto Supabase, haga clic en **SQL Editor**.
2. Haga clic en **"New Query"**.
3. Abra el archivo `scripts/supabase_migration_complete.sql`, copie la totalidad de su contenido y péguelo en el editor SQL.
4. Haga clic en el botón verde **"RUN"**.

> **✓ Resultado Automático:** Se crearán todas las tablas (`proyectos`, `seguridad_estadisticas`, `economia_registros`, `valor_suelo`, `senderos_fichas`), los índices de optimización geográfica y se insertarán todos los registros históricos consolidados con políticas de lectura pública segura (Row Level Security).

### Paso 3.3: Obtener Credenciales de Conexión
En Supabase diríjase a **Project Settings ➔ Data API** y copie sus dos variables institucionales:

| Parámetro en Supabase | Variable de Entorno en el Proyecto | Descripción |
| :--- | :--- | :--- |
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` | Punto de enlace HTTPS del servidor (ej. *https://xyz.supabase.co*) |
| **Project API Key (anon / public)** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave de acceso seguro de lectura pública para el frontend React. |

---

## 4. Cuenta y Token Propio de Mapbox (OBLIGATORIO)

> **⚠️ AVISO OBLIGATORIO DE SEGURIDAD Y SOBERANÍA CARTOGRÁFICA:**  
> Por motivos de seguridad y gobernanza de datos, la institución **DEBE generar su propio token de Mapbox**. No se deben utilizar claves personales ajenas para evitar suspensiones de servicio o bloqueos por exceso de consumo.

Mapbox ofrece un plan gratuito generoso de hasta **50.000 cargas de mapa mensuales gratuitas**, suficiente para la operación institucional.

### Paso 4.1: Creación de Token en Mapbox
1. Ingrese a [https://account.mapbox.com](https://account.mapbox.com) y cree una cuenta con el correo oficial del departamento o institución.
2. En la sección **"Access Tokens"**, haga clic en **"Create a token"**.
3. Asigne un nombre (ejemplo: `Portal-DMQ-Produccion`).
4. *(Recomendado para seguridad):* En el campo **URL Restrictions**, ingrese el dominio donde estará publicado el portal (ejemplo: `*.vercel.app` o el subdominio municipal `*.quito.gob.ec`) para impedir que terceros usen su cuota.
5. Copie el token generado (inicia siempre con el prefijo `pk.eyJ1...`).

Este valor se asignará a la variable de entorno: **`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`**.

---

## 5. Despliegue en la Cuenta Propia de Vercel (Producción Cloud)

Vercel es la infraestructura cloud nativa de Next.js que proporciona hosting de alta disponibilidad, certificados SSL automáticos y despliegue continuo ante cada cambio en GitHub.

### Paso 5.1: Vincular Repositorio y Configurar la Carpeta Raíz ("Root Directory")
1. Inicie sesión en [https://vercel.com](https://vercel.com) con la cuenta de la institución.
2. Haga clic en el botón **"Add New..." ➔ "Project"**.
3. Seleccione su repositorio de GitHub (`URU_Estadistico`).
4. **PASO CRÍTICO:** En la sección **"Root Directory"** de la pantalla de configuración, haga clic en **Edit** y seleccione la subcarpeta:
   ```text
   web
   ```
   *(Esto le indica a Vercel que la aplicación web se encuentra dentro de la carpeta `web/` y evitará cualquier error de detección de framework).*

### Paso 5.2: Configurar las Variables de Entorno Propias
En la misma pantalla de Vercel, despliegue la sección **"Environment Variables"** e ingrese las 3 llaves obtenidas:

| Nombre de la Variable | Valor a Colocar |
| :--- | :--- |
| **`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`** | El token propio creado en la cuenta Mapbox de la entidad (`pk.eyJ1...`). |
| **`NEXT_PUBLIC_SUPABASE_URL`** | La URL del nuevo proyecto Supabase (`https://xxxx.supabase.co`). |
| **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** | La llave pública (anon key) del nuevo proyecto Supabase (`eyJhbGciOi...`). |

### Paso 5.3: Despliegue y Publicación
1. Haga clic en el botón azul **"Deploy"**.
2. En aproximadamente 60 segundos el portal estará compilado y activo bajo el dominio institucional asignado por Vercel.
3. A partir de ese momento, cada `git push` que realice el equipo técnico en GitHub actualizará la web de forma automática.

---

## 6. Arquitectura de Archivos y Carga de Nuevos Datos

Para cargar nuevos proyectos, modificar coordenadas o actualizar capas cartográficas en el futuro, el equipo técnico debe conocer la estructura de datos interna:

| Ubicación del Archivo | Función y Contenido |
| :--- | :--- |
| `web/src/lib/proyectos_geometrias.json` | Capa cartográfica maestra en formato GeoJSON. Contiene los 77 polígonos de soterramientos, las 15 zonas de metro y los senderos en coordenadas WGS84. |
| `web/src/app/components/CentralidadesView.js` | Controlador principal del visor de centralidades, lógica de filtros, búsqueda, animaciones de radar y capas de visualización Mapbox. |
| `web/src/app/components/MapboxMap.js` | Componente modular de mapa para las fichas técnicas individuales y vistas de soterramiento. |
| `web/src/app/globals.css` | Sistema de diseño visual, paleta cromática municipal (azul DMQ, dorado, tonos café para soterramiento) y maquetación responsive. |
| `data/Coordenadas Soterramiento Actualizado/` | Shapefiles vectoriales oficiales del SIRES (`.shp`, `.dbf`, `.prj`) en coordenadas métricas UTM Zona 17S. |
| `scratch/prepare_soterramiento_geometries.js` | Script en Node.js para reproyectar y sincronizar automáticamente nuevos shapefiles a GeoJSON. |

### Tolerancia a Fallos y Resiliencia
El portal cuenta con **arquitectura desacoplada resiliente**: si el servidor de Supabase experimenta mantenimiento o interrupción, el frontend de Next.js activa automáticamente las fuentes JSON locales de respaldo (`web/src/lib/`), garantizando que el portal municipal nunca muestre pantallas en blanco ni errores a la ciudadanía.
