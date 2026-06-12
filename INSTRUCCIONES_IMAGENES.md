# Instrucciones para Añadir Imágenes a la Pestaña INFORMACIÓN

## Estructura de Carpetas

Se han creado 4 carpetas para colocar las imágenes principales de cada categoría:

```
data/imagenes_categorias/
├── senderos_seguros/
├── zonas_metro/
├── rehabilitacion_espacio_publico/
├── bicentenario/
└── arena_del_sur/
```

## Cómo Añadir las Imágenes

### 1. **Senderos Seguros**
📁 Ruta: `data/imagenes_categorias/senderos_seguros/`
- Coloca la imagen principal que quieras mostrar en la cuadrícula
- Formatos soportados: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- Nombre sugerido: `principal.jpg` o `portada.jpg`

### 2. **Zonas Metro**
📁 Ruta: `data/imagenes_categorias/zonas_metro/`
- Coloca la imagen principal para esta sección
- Mismo formato que arriba

### 3. **Rehabilitación del Espacio Público**
📁 Ruta: `data/imagenes_categorias/rehabilitacion_espacio_publico/`
- Coloca la imagen principal para esta sección

### 4. **Bicentenario**
📁 Ruta: `data/imagenes_categorias/bicentenario/`
- Coloca la imagen principal para esta sección

### 5. **Arena del Sur**
📁 Ruta: `data/imagenes_categorias/arena_del_sur/`
- Coloca la imagen principal para esta sección

## Funcionamiento

1. Al abrir la pestaña **INFORMACIÓN**, verás una **cuadrícula de 2×2** con las 4 categorías
2. Cada cuadrícula mostrará:
   - La imagen principal (si existe)
   - El nombre de la categoría
   - Un botón "Ver más"

3. Al hacer click en **"Ver más"**, irás a la vista detallada de esa categoría donde se mostrará:
   - Información específica del proyecto
   - Imágenes adicionales
   - Estadísticas y descripciones
   - (Esto está listo para que agregues el contenido)

## Notas Técnicas

- **Tamaño de imagen recomendado**: 800×600 px o más (se ajustará automáticamente)
- **Si no hay imagen**: Se mostrará un placeholder indicando dónde colocarla
- **Primera imagen**: El sistema toma la primera imagen encontrada en cada carpeta
- **Ruta relativa**: Los paths se calculan desde la raíz del proyecto

## Próximos Pasos

Una vez agregues las imágenes, puedes pasar el contenido detallado (descripciones, estadísticas, información) para cada categoría y lo integraré en la vista detallada.
