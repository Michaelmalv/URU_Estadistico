Evaluación de Seguridad — App Streamlit

Instrucciones rápidas:

1. Crear entorno e instalar dependencias:

```bash
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

2. Ejecutar la app:

```bash
streamlit run app.py
```

3. **Datos precargados (recomendado):** el archivo `Evaluación de proyectos estratégicos_ SEGURIDAD.xlsx` debe estar en la carpeta `data/`. La app lo carga automáticamente al abrir — no hace falta subirlo cada vez.

4. La pestaña **ECONOMIA** puede leer automáticamente `resultado_cruce_predios_renovacion_v3.xlsx` y `resultado_cruce_predios_emision_v3.xlsx` si los colocas en `data/`. También puedes subirlos manualmente desde la propia pestaña.

5. Opcional: en el panel lateral puedes subir otro Excel para reemplazar el archivo de seguridad solo en esa sesión, o pulsar **Recargar datos** después de actualizar el archivo en disco.

6. La app genera el "Resumen comparativo" en **SEGURIDAD** y una gráfica de comparación por sector en **ECONOMIA**.

**Ruta personalizada:** define la variable de entorno `SEGURIDAD_EXCEL` con la ruta completa a tu archivo.
