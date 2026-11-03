# Manual de Transferencia Tecnológica, Cuentas Propias y Despliegue
## Portal de Seguimiento y Evaluación de Proyectos Estratégicos (DMQ)

**Entidad:** Municipio del Distrito Metropolitano de Quito • Secretaría de Territorio, Hábitat y Vivienda (STHV)  
**Repositorio Maestro (Completo):** [https://github.com/Michaelmalv/URU_Estadistico.git](https://github.com/Michaelmalv/URU_Estadistico.git)  
**Repositorio Despliegue Producción (Vercel):** [https://github.com/Michaelmalv/Portal_Evaluacion_Proyectos_Estrategicos.git](https://github.com/Michaelmalv/Portal_Evaluacion_Proyectos_Estrategicos.git)  
**Tecnologías:** Next.js 16 (React 19) • Mapbox GL JS • Supabase (PostgreSQL) • Vercel Cloud  

---

## 1. Objetivo y Principio de Soberanía Tecnológica

El propósito de este manual es garantizar que el equipo receptor cuente con **autonomía técnica absoluta** sobre la plataforma. El objetivo es que la entidad receptora administre sus propios servicios en la nube, programe libremente nuevas funcionalidades y mantenga su propia base de datos institucional sin depender de credenciales ni servidores externos de terceros.

### Los 4 Pilares Institucionales:
1. **GitHub Institucional Propio:** Gobernanza total del código fuente, control de versiones, recepción de aportes del equipo técnico e integración continua.
2. **Base de Datos Supabase Propia:** Servidor PostgreSQL en la nube para alojar y consultar las métricas e indicadores de Seguridad, Economía (LUAEs) y Avalúos de Suelo.
3. **Cuenta y Token de Mapbox Propio (Obligatorio):** Proveedor cartográfico para renderizar los mapas 3D, relieves y capas vectoriales de la ciudad con restricción de dominio.
4. **Servidor de Despliegue Vercel Propio:** Infraestructura web autogestionada de alto rendimiento con publicación instantánea ante cada `git push`.

---

## 2. Repositorios GitHub y Clonación Local Paso a Paso

El código completo del proyecto se encuentra disponible en dos repositorios públicos oficiales:

* **Repositorio Maestro (Completo):**  
  👉 `https://github.com/Michaelmalv/URU_Estadistico.git`  
  *(Contiene la aplicación web en `/web`, datos cartográficos SIRES, matrices analíticas en Excel y scripts de automatización).*
* **Repositorio de Despliegue Producción (Vercel Directo):**  
  👉 `https://github.com/Michaelmalv/Portal_Evaluacion_Proyectos_Estrategicos.git`  
  *(Subárbol optimizado exclusivamente para despliegue directo en Vercel sin subcarpetas).*

### Paso 2.1: Migrar a la Cuenta Institucional de GitHub
Para transferir el código a la cuenta o servidor de GitHub propio de la entidad, ejecute en su terminal:

```bash
# 1. Clonar el repositorio maestro localmente
git clone https://github.com/Michaelmalv/URU_Estadistico.git
cd URU_Estadistico

# 2. Re-vincular el repositorio a su nueva cuenta institucional de GitHub
git remote set-url origin https://github.com/SuOrganizacion/URU_Estadistico.git

# 3. Subir las ramas principales al nuevo servidor institucional
git push -u origin main
git push origin master
```

### Paso 2.2: Programación y Ejecución en Entorno Local (Desarrollo)
Cualquier programador del equipo puede modificar el diseño, agregar pestañas, editar métricas o integrar nuevas centralidades ejecutando el servidor local de desarrollo:

```bash
# Navegar al directorio de la aplicación web
cd web

# Instalar las dependencias de Node.js (requiere Node.js v18, v20, v22 o superior)
npm install

# Iniciar el servidor local de desarrollo con recarga en vivo
npm run dev
```

La aplicación estará disponible inmediatamente en su navegador en: **`http://localhost:3000`**. Cualquier cambio que realice en los archivos `.js` o `.css` se refresca inmediatamente en pantalla (Fast Refresh).

---

## 3. Base de Datos Propia en Supabase e Inyección SQL Completa

Para que las estadísticas de Seguridad, Dinámica Económica (LUAEs) y Valor de Suelo funcionen con su propio backend institucional, se incluye el script maestro de migración e inyección SQL en 1 clic.

### Paso 3.1: Crear Proyecto Propio en Supabase (Gratuito / Cloud)
1. Acceda a [https://supabase.com](https://supabase.com) con su correo institucional.
2. Haga clic en **"New Project"**.
3. Defina el nombre del proyecto (ejemplo: `portal-estrategicos-dmq`), establezca una contraseña segura para la base de datos y seleccione la región geográfica más cercana (*South America / São Paulo* o *US East*).

### Paso 3.2: Ubicación del Script de Inyección SQL Maestro
En la raíz del repositorio clonado se encuentra el archivo maestro listo para ejecutar:  
📁 **`scripts/supabase_migration_complete.sql`** *(59 KB con esquema relacional, restricciones, índices y seed data histórico consolidado 2019-2026).*

### Paso 3.3: Ejecutar la Inyección SQL en el Panel de Supabase
1. En el panel lateral izquierdo de su proyecto Supabase, haga clic en **SQL Editor**.
2. Haga clic en **"New Query"**.
3. Abra el archivo `scripts/supabase_migration_complete.sql`, copie la totalidad de su contenido y péguelo en el editor SQL.
4. Presione el botón verde **"RUN"**.

#### Resumen de Estructura DDL Creada por el Script:
```sql
-- 1. Habilitar extensión de identificadores únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla de Proyectos Estratégicos
CREATE TABLE IF NOT EXISTS proyectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT UNIQUE NOT NULL,
    categoria TEXT,
    ubicacion TEXT,
    extension TEXT,
    fecha_inauguracion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Estadísticas de Seguridad (Series Temporales 2019-2025)
CREATE TABLE IF NOT EXISTS seguridad_estadisticas (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
    anio TEXT NOT NULL,
    variable TEXT NOT NULL,
    valor NUMERIC,
    tipo TEXT DEFAULT 'observado'
);

-- 4. Registros de Dinámica Económica (LUAEs)
CREATE TABLE IF NOT EXISTS economia_registros (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    sector_raw TEXT,
    movimiento_raw TEXT,
    fecha_impresion DATE
);

-- 5. Valor del Suelo Urbano (Avalúo 2022-2026)
CREATE TABLE IF NOT EXISTS valor_suelo (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    proyecto TEXT NOT NULL,
    descripcion TEXT,
    valor_2022_2023 NUMERIC,
    valor_2024 NUMERIC,
    valor_2026 NUMERIC
);

-- 6. Fichas Descriptivas de Senderos Seguros
CREATE TABLE IF NOT EXISTS senderos_fichas (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
    anio INT,
    ejecutor TEXT,
    presupuesto TEXT,
    extension TEXT,
    beneficiarios TEXT,
    fecha TEXT
);
```

#### Regla Obligatoria: Políticas de Lectura Pública (Row Level Security - RLS)
Supabase bloquea por defecto las consultas web públicas. El script ejecuta automáticamente las siguientes políticas indispensables para que el frontend pueda consultar los datos de forma segura sin credenciales administrativas:

```sql
-- Habilitar RLS en cada tabla
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE seguridad_estadisticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE economia_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE valor_suelo ENABLE ROW LEVEL SECURITY;
ALTER TABLE senderos_fichas ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso público de solo lectura (SELECT)
CREATE POLICY "Lectura publica proyectos" ON proyectos FOR SELECT USING (true);
CREATE POLICY "Lectura publica seguridad" ON seguridad_estadisticas FOR SELECT USING (true);
CREATE POLICY "Lectura publica economia" ON economia_registros FOR SELECT USING (true);
CREATE POLICY "Lectura publica valor suelo" ON valor_suelo FOR SELECT USING (true);
CREATE POLICY "Lectura publica senderos" ON senderos_fichas FOR SELECT USING (true);
```

### Paso 3.4: Copiar Credenciales Institucionales de Supabase
En Supabase diríjase a **Project Settings ➔ Data API** y copie sus dos variables institucionales:

| Parámetro en Supabase | Variable de Entorno en el Proyecto | Descripción |
| :--- | :--- | :--- |
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` | Punto de enlace HTTPS del servidor (ej. *https://xxxx.supabase.co*) |
| **anon / public key** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública segura para consultas frontend desde el navegador. |

---

## 4. Cuenta y Access Token Propio de Mapbox (OBLIGATORIO)

> **⚠️ AVISO OBLIGATORIO DE SOBERANÍA CARTOGRÁFICA Y SEGURIDAD:**  
> Por normativas de ciberseguridad municipal, la institución **DEBE generar su propio token de Mapbox**. Jamás utilice tokens personales ajenos para evitar cortes imprevistos o bloqueos por límite de cuota.

Mapbox ofrece **50.000 cargas de mapa mensuales completamente gratuitas**, suficientes para la demanda ciudadana e interna del portal.

### Paso 4.1: Registro de Cuenta Mapbox
Ingrese a [https://account.mapbox.com](https://account.mapbox.com) y registre una cuenta oficial con el correo de la institución.

### Paso 4.2: Creación de Token con Restricción de Dominio
1. En la sección **"Access Tokens"**, haga clic en **"Create a token"**.
2. Asigne nombre: `Portal-DMQ-Produccion`.
3. En el campo **"URL Restrictions"**, escriba los dominios permitidos (ejemplo: `*.vercel.app` y `*.quito.gob.ec`). Esto impide que terceros consuman su cuota de mapas.
4. Copie el token generado (inicia siempre con el prefijo `pk.eyJ1...`).

Este valor corresponde a la variable: **`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`**.

---

## 5. Despliegue en Producción Cloud con Vercel

Vercel es la nube oficial de Next.js. Provee servidores de alta velocidad, certificados SSL HTTPS automáticos y publicación continua ante cada actualización en GitHub.

### Paso 5.1: Conectar el Repositorio de GitHub en Vercel
1. Inicie sesión en [https://vercel.com](https://vercel.com) con la cuenta institucional.
2. Haga clic en **"Add New..." ➔ "Project"**.
3. Seleccione el repositorio (`URU_Estadistico` o `Portal_Evaluacion_Proyectos_Estrategicos`).

> **🚨 PASO CRÍTICO OBLIGATORIO: CONFIGURAR "ROOT DIRECTORY" EN "web"**  
> Si conecta el repositorio maestro `URU_Estadistico`, en la pantalla de configuración de Vercel debe hacer clic en **EDIT** en **"Root Directory"** y escribir:
> ```text
> web
> ```
> *(Si no selecciona la subcarpeta `web`, Vercel intentará compilar la raíz del repositorio y fallará al no encontrar `package.json`).*

### Paso 5.2: Inyectar las 3 Variables de Entorno en Vercel
En la sección **"Environment Variables"** de Vercel, pegue las 3 claves obtenidas:

| Variable en Vercel | Valor a Colocar | Propósito |
| :--- | :--- | :--- |
| **`NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`** | `pk.eyJ1...` (Token propio de Mapbox) | Renderizado de mapas 3D y trazados viales |
| **`NEXT_PUBLIC_SUPABASE_URL`** | `https://xxxx.supabase.co` | Conexión a la base de datos PostgreSQL |
| **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** | `eyJhbGciOi...` (Anon Key de Supabase) | Lectura pública segura de estadísticas |

### Paso 5.3: Clic en "Deploy" y Publicación Exitosa
1. Haga clic en el botón azul **"Deploy"**.
2. En aproximadamente 60 segundos la web estará activa con su dominio institucional.
3. A partir de ese momento, cada cambio guardado en GitHub actualizará la web automáticamente sin intervención manual.

### Archivo de Configuración Local de Respaldo (`web/.env.local`)
Cree un archivo llamado `.env.local` dentro de la subcarpeta `/web` con las mismas 3 variables para trabajar en su entorno de desarrollo:

```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.eyJ1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxx
```

---

## 6. Arquitectura de Datos y Modificación Futura de Proyectos

Toda la estructura analítica, cartográfica y estadística está desacoplada para facilitar auditorías y permitir agregar futuros proyectos fácilmente:

| Archivo / Ruta | Formato / Contenido | Función en el Sistema |
| :--- | :--- | :--- |
| `web/src/lib/centralidades_data.json` | JSON (18 Centralidades, 69 proyectos) | Base documental maestra con fichas técnicas, presupuestos, ejecutores y estado |
| `web/src/lib/proyectos_geometrias.json` | GeoJSON WGS84 (120 características) | Geometrías exactas: 77 soterramientos, 15 zonas metro, 23 viales y 5 puntos |
| `web/src/lib/soterramiento.json` | JSON (38 proyectos SIRES DMQ) | Métricas del Plan Maestro de Soterramiento (kilometraje, tipo, ejecutor) |
| `web/src/app/components/CentralidadesView.js` | React Component | Visor territorial, motor de filtros, jerarquías y balizas de radar |
| `web/src/app/components/MapboxMap.js` | React Component | Componente modular de mapa para fichas técnicas individuales |
| `scripts/supabase_migration_complete.sql` | SQL DDL & DML (59 KB) | Inyección integral con todas las tablas e históricos 2019-2026 |
| `data/Coordenadas Soterramiento Actualizado/` | Shapefiles (.shp, .dbf, .prj) | Archivos cartográficos nativos municipales en UTM Zona 17S |

---

## 7. Sensibilidad del Proyecto, Resiliencia y Tolerancia a Fallos

> **🛡️ ARQUITECTURA RESILIENTE DE ALTA DISPONIBILIDAD (MOTOR HÍBRIDO):**  
> Para asegurar que el portal municipal nunca sufra caídas ni muestre pantallas en blanco si la base de datos entra en pausa por inactividad de Supabase, el portal cuenta con un mecanismo de respaldo automático: si la conexión remota tarda o falla, el frontend consume de inmediato las fuentes locales precargadas en `web/src/lib/`, garantizando **100% de disponibilidad ciudadana 24/7**.

### Checklist Oficial de Verificación para Puesta en Marcha Institucional:
- [x] **Código Fuente Clonado:** Repositorio descargado en local y respaldado en la cuenta de GitHub institucional.
- [x] **Base de Datos PostgreSQL Inyectada:** Script `scripts/supabase_migration_complete.sql` ejecutado exitosamente con políticas RLS activas.
- [x] **Token Cartográfico Mapbox Generado:** Token propio creado con restricción a dominios institucionales autorizados.
- [x] **Despliegue en Vercel Configurado:** Root Directory establecido en `web` y las 3 variables de entorno inyectadas correctamente.
- [x] **Funcionamiento Idéntico Comprobado:** Pestañas operativas (*Información, Centralidades Urbanas, Corredores Vivos, Zonas Metro, Rehabilitación del Espacio Público, Soterramiento*), mapas 3D con colores correctos y navegación de fichas funcionando plenamente.

---
*Certificación: Sistema entregado en condición "Llave en Mano", verificado punto a punto, con documentación reproducible y arquitectura autosuficiente para el Municipio del Distrito Metropolitano de Quito.*
